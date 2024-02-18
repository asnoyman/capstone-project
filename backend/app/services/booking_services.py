import sqlalchemy as sql
import sqlalchemy.orm as orm
from app.schemas import booking_schemas, listing_schemas
from app.database import models
import threading
from contextlib import contextmanager
from typing import List, Set
import decimal
from app.services import payment_services, puzzle_services

create_booking_lock = threading.Lock()
LOCK_TIMEOUT = 2 # Lock.acquire times out after 2 seconds

TWO_PLACES = decimal.Decimal(10) ** -2
TIME_BLOCK = 15 * 60 * 1000 # 15 mins in ms

@contextmanager
def acquire_lock(lock: threading.Lock, timeout: int = LOCK_TIMEOUT):
    result = lock.acquire(timeout=timeout)
    try:
        yield result
    finally:
        if result:
            lock.release()

class ListingNotAvailableException(Exception):
    pass

class ListingDoesNotExistException(Exception):
    pass

class BookingDoesNotExistException(Exception):
    pass

class UserDoesNotOwnBookingException(Exception):
    pass

class BookingInPastException(Exception):
    pass

class DeleteBookingException(Exception):
    pass

class LockNotAvailableException(Exception):
    pass

class NoBankAccountException(Exception):
    pass

def check_availability_recur(start_time: int, end_time: int, availabilitites: List[models.Availability]) -> bool:
    for availability in availabilitites:
        if availability.start_time <= start_time and end_time <= availability.end_time:
            # Case 1, booking contained entirely within availability
            return True
        elif availability.start_time <= start_time <= availability.end_time:
            # Case 2, booking starts during availability but goes overtime
            new_start = availability.end_time + 1
            return check_availability_recur(new_start, end_time, availabilitites)
        elif availability.start_time <= end_time <= availability.end_time:
            # Case 3, booking starts before availability but goes on during it
            new_end = availability.start_time - 1
            return check_availability_recur(start_time, new_end, availabilitites)
        elif start_time < availability.start_time and availability.end_time < end_time:
            # Case 4, booking starts before availability starts and finishes after
            left = check_availability_recur(start_time, availability.start_time - 1, availabilitites)
            right = check_availability_recur(availability.end_time + 1, end_time, availabilitites)
            return left and right
    return False

def listing_has_availability(listing_id: int, booking: booking_schemas.CreateBooking, db: orm.Session):
    # List of all availabilitites that cover this time 
    availabilitites = (db.query(models.Availability)
                      .filter(models.Availability.listing_id == listing_id)
                      .filter(models.Availability.start_date <= booking.date)
                      .filter(sql.or_(models.Availability.end_date >= booking.date, models.Availability.end_date == None))
                      .filter(sql.or_(
                                    sql.and_(models.Availability.start_time <= booking.start_time, booking.start_time <= models.Availability.end_time),
                                    sql.and_(models.Availability.start_time <= booking.end_time, booking.end_time <= models.Availability.end_time),
                                    sql.and_(booking.start_time <= models.Availability.start_time, models.Availability.end_time <= booking.end_time),
                            ))
                      .all())
    return check_availability_recur(booking.start_time, booking.end_time, availabilitites)
    

def create_booking(user_id: int, listing_id: int, booking: booking_schemas.CreateBooking, db: orm.Session) -> booking_schemas.Booking:
    # TODO should probably forbid bookings in the past, but for now it's useful for testing
    listing_model = db.query(models.Listing).filter(models.Listing.id == listing_id).first()
    if listing_model is None:
        raise ListingDoesNotExistException
    
    if not payment_services.user_has_bank_account(listing_model.owner_id, db):
        raise NoBankAccountException
    
    if not listing_has_availability(listing_id, booking, db):
        raise ListingNotAvailableException

    decimal.getcontext().prec = 2
    booking_time_in_hours = decimal.Decimal((booking.end_time - booking.start_time) / 3600000)
    price = decimal.Decimal(booking_time_in_hours * listing_model.price_per_hour)

    new_booking_model = models.Booking(
            user_id = user_id,
            listing_id = listing_id,
            date = booking.date,
            start_time = booking.start_time,
            end_time = booking.end_time,
            price = price
        )
    
    with acquire_lock(create_booking_lock) as acquired:
        if not acquired:
            raise LockNotAvailableException
    
        # conflicting_booking is when 
        # NOT:
        #     requested_booking start time and requested_booking end time are before the booking start time
        #     or
        #     requested_booking start time and requested_booking end time are after the booking end time
        conflicting_booking = (db.query(models.Booking.id)
                               .filter(
                                        models.Booking.listing_id == listing_id,
                                        models.Booking.date == booking.date,
                                        sql.not_(
                                            sql.or_(
                                                sql.and_(booking.start_time < models.Booking.start_time, booking.end_time <= models.Booking.start_time),
                                                sql.and_(booking.start_time >= models.Booking.end_time, booking.end_time > models.Booking.end_time),
                                            )
                                        )
                                    )
                                .first())

        if conflicting_booking is not None:
            raise ListingNotAvailableException

        user_pays_service_fee = puzzle_services.calculate_streak(user_id, db).streak < 7

        try:
            db.add(new_booking_model)
            db.commit()
            db.refresh(new_booking_model)
            payment_services.charge_user(listing_model.owner_id, price, db, user_pays_service_fee)
            return booking_schemas.Booking.from_orm(new_booking_model)
        except sql.exc.IntegrityError as e:
            raise ListingNotAvailableException from e

def get_bookings_by_listing_id(listing_id: int, db: orm.Session) -> booking_schemas.BookingsData:
    current_date = listing_schemas.get_current_date()
    current_time = listing_schemas.get_current_time()
    past_booking_models = db.query(models.Booking).filter(models.Booking.listing_id == listing_id,
                                                    sql.or_(
                                                        models.Booking.date < current_date,
                                                        sql.and_(models.Booking.date == current_date, models.Booking.end_time < current_time)
                                                    )
                                                ).all()
    upcoming_booking_models = db.query(models.Booking).filter(models.Booking.listing_id == listing_id,
                                                sql.or_(
                                                    models.Booking.date > current_date,
                                                    sql.and_(models.Booking.date == current_date, models.Booking.end_time >= current_time)
                                                )
                                            ).all()

    past_bookings = [booking_schemas.Booking.from_orm(model) for model in past_booking_models]
    upcoming_bookings = [booking_schemas.Booking.from_orm(model) for model in upcoming_booking_models]
    return booking_schemas.BookingsData(past_bookings=past_bookings, upcoming_bookings=upcoming_bookings)


def get_bookings_by_user_id(user_id: int, db: orm.Session) -> booking_schemas.BookingsData:
    current_date = listing_schemas.get_current_date()
    current_time = listing_schemas.get_current_time()
    past_booking_models = db.query(models.Booking).filter(models.Booking.user_id == user_id,
                                                    sql.or_(
                                                        models.Booking.date < current_date,
                                                        sql.and_(models.Booking.date == current_date, models.Booking.end_time < current_time)
                                                    )
                                                ).all()
    upcoming_booking_models = db.query(models.Booking).filter(models.Booking.user_id == user_id,
                                                    sql.or_(
                                                        models.Booking.date > current_date,
                                                        sql.and_(models.Booking.date == current_date, models.Booking.end_time >= current_time)
                                                    )
                                                ).all()
    
    past_bookings = [booking_schemas.Booking.from_orm(model) for model in past_booking_models]
    upcoming_bookings = [booking_schemas.Booking.from_orm(model) for model in upcoming_booking_models]
    return booking_schemas.BookingsData(past_bookings=past_bookings, upcoming_bookings=upcoming_bookings)

def get_bookings_by_owner_id(owner_id: int, db: orm.Session) -> booking_schemas.BookingsData:
    current_date = listing_schemas.get_current_date()
    current_time = listing_schemas.get_current_time()
    past_booking_models = (db.query(models.Booking)
                            .join(models.Listing)
                            .filter(
                                models.Listing.owner_id == owner_id,
                                sql.or_(
                                    models.Booking.date < current_date,
                                    sql.and_(models.Booking.date == current_date, models.Booking.end_time < current_time)
                                )
                            )
                            .all())
    upcoming_booking_models = (db.query(models.Booking)
                               .join(models.Listing)
                               .filter(
                                    models.Listing.owner_id == owner_id,
                                    sql.or_(
                                        models.Booking.date > current_date,
                                        sql.and_(models.Booking.date == current_date, models.Booking.end_time >= current_time)
                                    )
                                )
                                .all())
    
    past_bookings = [booking_schemas.Booking.from_orm(model) for model in past_booking_models]
    upcoming_bookings = [booking_schemas.Booking.from_orm(model) for model in upcoming_booking_models]
    return booking_schemas.BookingsData(past_bookings=past_bookings, upcoming_bookings=upcoming_bookings)

def get_time_blocks(start_time: int, end_time: int) -> List[int]:
    times = []
    curr_time = start_time
    while curr_time < end_time:
        times.append(curr_time)
        curr_time += TIME_BLOCK
    return times

def get_dates(start_date: int, end_date: int) -> List[int]:
    dates = []
    curr_date = start_date
    while curr_date <= end_date:
        dates.append(curr_date)
        curr_date += listing_schemas.ONE_DAY
    return dates

def get_time_periods(times: Set[int]) -> List[booking_schemas.TimePeriod]:
    if len(times) == 0:
        return []
    times = sorted(list(times))

    time_periods: List[booking_schemas.TimePeriod] = []
    curr_start_time = times[0]
    curr_end_time = curr_start_time + TIME_BLOCK
    for time in times[1:]:
        if time == curr_end_time:
            curr_end_time = time + TIME_BLOCK
        else:
            time_periods.append(booking_schemas.TimePeriod(start_time=curr_start_time, end_time=curr_end_time))
            curr_start_time = time
            curr_end_time = time + TIME_BLOCK
    time_periods.append(booking_schemas.TimePeriod(start_time=curr_start_time, end_time=curr_end_time))

    return time_periods

def get_availabilities_for_booking(listing_id: int, query_date: int, db: orm.Session) -> booking_schemas.WeekAvailability:
    date_1 = query_date
    date_7 = date_1 + listing_schemas.SIX_DAYS

    data = {date_1 + i * listing_schemas.ONE_DAY: set() for i in range(7)} # For each date, have a set of times, where time is the start of a 15 min block where free

    # Get all availabilities that have overlap with week
    availabilities = (db.query(models.Availability)
                      .filter(models.Availability.listing_id == listing_id)
                      .filter(sql.or_(
                                sql.and_(models.Availability.start_date <= date_1, sql.or_(date_1 <= models.Availability.end_date, models.Availability.end_date == None)),
                                sql.and_(models.Availability.start_date <= date_7, sql.or_(date_7 <= models.Availability.end_date, models.Availability.end_date == None)),
                                sql.and_(date_1 <= models.Availability.start_date, sql.or_(models.Availability.end_date <= date_7, models.Availability.end_date == None))
                        ))
                      .all())
    # Turn each availability in a list of times (where a time is the start of a 15 min block where available)
    # Add each list of times to the set of times for each day in week where the availability is active
    for availability in availabilities:
        times = get_time_blocks(availability.start_time, availability.end_time)
        dates = get_dates(max(availability.start_date, date_1), min(availability.end_date, date_7))
        for date in dates:
            data[date].update(times)
    
    # Get the bookings that overlap with this week
    bookings = (db.query(models.Booking)
                .filter(
                    models.Booking.listing_id == listing_id,
                    date_1 <= models.Booking.date,
                    models.Booking.date <= date_7
                )
                .all())
    # Turn each booking into a list of times (where a time is the start of a 15 min block where is booked)
    # Remove each time from the set of times when the listing is available for that day
    for booking in bookings:
        times = get_time_blocks(booking.start_time, booking.end_time)
        for time in times:
            data[booking.date].discard(time)
    
    # For each day in week, turn the set of times (where a time is the start of a 15 min block where is available)
    # into a list of time periods (where a time period is a contiguous period from start_time to end_time)
    # Save each list of time periods into a DayAvailability (a date + list of time periods when available)
    week_time_periods = {i: None for i in range(1, 8)} # Dictionary representing each day in week (day 1-7)
    for day in week_time_periods:
        date = date_1 + (day - 1) * listing_schemas.ONE_DAY
        times = data[date]
        time_periods = get_time_periods(times)
        week_time_periods[day] = booking_schemas.DayAvailability(date=date, times=time_periods)
    
    return booking_schemas.WeekAvailability(
        day_1=week_time_periods[1],
        day_2=week_time_periods[2],
        day_3=week_time_periods[3],
        day_4=week_time_periods[4],
        day_5=week_time_periods[5],
        day_6=week_time_periods[6],
        day_7=week_time_periods[7]
    )

def cancel_booking(user_id: int, booking_id: int, db: orm.Session):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if booking is None:
        raise BookingDoesNotExistException
    
    if booking.user_id != user_id:
        raise UserDoesNotOwnBookingException
    
    current_date = listing_schemas.get_current_date()
    current_time = listing_schemas.get_current_time()
    if booking.date < current_date or (booking.date == current_date and booking.end_time < current_time):
        raise BookingInPastException
    
    try:
        db.delete(booking)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteBookingException from e

def has_user_booked_listing_in_past(listing_id: int, user_id: int, db: orm.Session) -> bool:
    current_date = listing_schemas.get_current_date()
    current_time = listing_schemas.get_current_time()
    past_booking_model = db.query(models.Booking).filter(models.Booking.user_id == user_id,
                                                        models.Booking.listing_id == listing_id,
                                                        sql.or_(
                                                            models.Booking.date < current_date,
                                                            sql.and_(models.Booking.date == current_date, models.Booking.end_time < current_time)
                                                        )
                                                    ).first()
    return past_booking_model is not None

def listing_has_upcoming_bookings(listing_id: int, db: orm.Session) -> bool:
    current_date = listing_schemas.get_current_date()
    current_time = listing_schemas.get_current_time()
    upcoming_booking_model = db.query(models.Booking).filter(models.Booking.listing_id == listing_id,
                                                        sql.or_(
                                                            models.Booking.date > current_date,
                                                            sql.and_(models.Booking.date == current_date, models.Booking.end_time >= current_time)
                                                        )
                                                    ).first()
    return upcoming_booking_model is not None