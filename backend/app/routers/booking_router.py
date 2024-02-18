import fastapi
import sqlalchemy.orm as orm
from app.services import security_services, booking_services, database_services, listing_services
from app.schemas import token_schemas, booking_schemas, listing_schemas
from typing import List

router = fastapi.APIRouter(
    tags=['bookings'],
)

@router.get("/listing/{listing_id}/book/available", response_model=booking_schemas.WeekAvailability)
def get_availability_to_book(listing_id: int, date: int, db: orm.Session = fastapi.Depends(database_services.get_db)):
    if not listing_services.does_listing_exist(listing_id, db):
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        )

    return booking_services.get_availabilities_for_booking(listing_id, date, db)

@router.get("/listing/{listing_id}/bookings", response_model=booking_schemas.BookingsData)
def get_bookings_by_listing_id(listing_id: int, db: orm.Session = fastapi.Depends(database_services.get_db)):
    if not listing_services.does_listing_exist(listing_id, db):
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        )
    
    return booking_services.get_bookings_by_listing_id(listing_id, db)

@router.post("/listing/{listing_id}/book")
def create_booking(listing_id: int, booking: booking_schemas.CreateBooking, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        booking = booking_services.create_booking(token_data.user_id, listing_id, booking, db)
        return {'booking_id': booking.id}
    except booking_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except booking_services.ListingNotAvailableException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Booking not available"
        ) from e
    except booking_services.NoBankAccountException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Owner not currently accepting payments"
        ) from e
    except booking_services.LockNotAvailableException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Booking timeout, try again later"
        ) from e

@router.delete("/booking/{booking_id}")
def cancel_booking(booking_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        booking_services.cancel_booking(token_data.user_id, booking_id, db)
    except booking_services.BookingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Booking[id={booking_id}] does not exist"
        ) from e
    except booking_services.UserDoesNotOwnBookingException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail=f"User does not own booking[id={booking_id}]"
        ) from e
    except booking_services.BookingInPastException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel past bookings"
        ) from e
    except booking_services.DeleteBookingException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Error deleteing booking"
        ) from e

@router.get("/user/bookings", response_model=booking_schemas.BookingsData)
def get_bookings_on_owned_listings(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    return booking_services.get_bookings_by_owner_id(token_data.user_id, db)

@router.get("/user/booked", response_model=booking_schemas.BookingsData)
def get_bookings_user_has_made(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    return booking_services.get_bookings_by_user_id(token_data.user_id, db)
