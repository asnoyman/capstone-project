from typing import List
from app.schemas import listing_schemas
from app.database import models
import sqlalchemy.orm as orm
import sqlalchemy as sql
from app.services import user_services, review_services, payment_services, booking_services

class CreateListingException(Exception):
    pass

class ListingDoesNotExistException(Exception):
    pass

class DeleteListingException(Exception):
    pass

class ListingHasUpcomingBookingsException(Exception):
    pass

class CreateImageException(Exception):
    pass

class DeleteImageException(Exception):
    pass

class CreateAvailabilityException(Exception):
    pass

class DeleteAvailabilityException(Exception):
    pass

class AvailabilityDoesNotExistException(Exception):
    pass

class NoBankAccountException(Exception):
    pass

AVAILABILITY_SIZE = 15 * 60 * 1000

def create_car_space_listing(listing: listing_schemas.CreateCarSpaceListing, user_id: int, db: orm.Session):
    if not payment_services.user_has_bank_account(user_id, db):
        raise NoBankAccountException
    
    listing_model = models.Listing(
        owner_id=user_id,
        length=listing.length,
        title=listing.title,
        width=listing.width,
        height=listing.height,
        price_per_hour=listing.price_per_hour,
        address=listing.address,
    )

    try:
        db.add(listing_model)
        db.commit()
        db.refresh(listing_model)
        image_models = [models.Image(listing_id=listing_model.id, data=image) for image in listing.images]
        for model in image_models:
            db.add(model)
        db.commit()
        db.refresh(listing_model)
        return listing_schemas.CarSpaceListing.from_orm(listing_model)
    except sql.exc.IntegrityError as e:
        raise CreateListingException from e

def get_listings(db: orm.Session) -> List[listing_schemas.CarSpaceListingInclReview]:
    listing_models = db.query(models.Listing).all()
    results: List[listing_schemas.CarSpaceListingInclReview] = []
    for listing_model in listing_models:
        listing = listing_schemas.CarSpaceListing.from_orm(listing_model)
        reviews = review_services.get_all_reviews_by_listing(listing_model.id, db)
        results.append(listing_schemas.CarSpaceListingInclReview(**listing.dict(), reviews=reviews))

    return results

def get_listing(listing_id: int, db: orm.Session) -> listing_schemas.CarSpaceListing:
    listing_model = db.query(models.Listing).filter(models.Listing.id == listing_id).scalar()
    if listing_model is None:
        raise ListingDoesNotExistException
    return listing_schemas.CarSpaceListing.from_orm(listing_model)

def user_owns_listing(user_id: int, listing_id: int, db: orm.Session) -> bool:
    owner_id = db.query(models.Listing.owner_id).filter(models.Listing.id == listing_id).scalar()
    if owner_id is None:
        raise ListingDoesNotExistException
    return owner_id == user_id

def does_listing_exist(listing_id: int, db: orm.Session) -> bool:
    owner_id = db.query(models.Listing.owner_id).filter(models.Listing.id == listing_id).scalar()
    return owner_id is not None

def update_car_space_listing(listing_id: int, listing: listing_schemas.CreateCarSpaceListing, db: orm.Session) -> listing_schemas.CarSpaceListing:
    listing_model = db.query(models.Listing).filter(models.Listing.id == listing_id).scalar()
    if listing_model is None:
        raise ListingDoesNotExistException
    
    delete_images(listing_id, db)

    try:
        listing_model.title = listing.title
        listing_model.length = listing.length
        listing_model.width = listing.width
        listing_model.height = listing.height
        listing_model.price_per_hour = listing.price_per_hour
        listing_model.address = listing.address

        image_models = [
            models.Image(
                listing_id=listing_id,
                data=image
            )
            for image in listing.images
        ]
        for image_model in image_models:
            db.add(image_model)

        db.commit()
        db.refresh(listing_model)
        return listing_schemas.CarSpaceListing.from_orm(listing_model)
    except sql.exc.IntegrityError as e:
        raise CreateListingException from e

def delete_listing(listing_id, db: orm.Session):
    listing_model = db.query(models.Listing).filter(models.Listing.id == listing_id).scalar()
    if listing_model is None:
        raise ListingDoesNotExistException
    
    if booking_services.listing_has_upcoming_bookings(listing_id, db):
        raise ListingHasUpcomingBookingsException
    
    try:
        db.delete(listing_model)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteListingException from e

def add_images(listing_id: int, images: List[bytes], db: orm.Session) -> List[listing_schemas.Image]:
    image_models = [
        models.Image(
            listing_id=listing_id,
            data=image
        ) 
        for image in images
    ]

    try:
        for image_model in image_models:
            db.add(image_model)
        db.commit()
        for image_model in image_models:
            db.refresh(image_model)
        return [listing_schemas.Image.from_orm(image_model) for image_model in image_models]
    except sql.exc.IntegrityError as e:
        raise CreateImageException from e

def delete_images(listing_id: int, db: orm.Session):
    images = db.query(models.Image).filter(models.Image.listing_id == listing_id).all()
    try:
        for image_model in images:
            db.delete(image_model)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteImageException from e

def create_availability(listing_id: int, availability: listing_schemas.CreateAvailability, db: orm.Session) -> listing_schemas.Availability:
    availability_model = models.Availability(
        listing_id=listing_id,
        start_date=availability.start_date,
        end_date=availability.end_date,
        start_time=availability.start_time,
        end_time=availability.end_time
    )

    try:
        db.add(availability_model)
        db.commit()
        db.refresh(availability_model)
        return listing_schemas.Availability.from_orm(availability_model)
    except sql.exc.IntegrityError as e:
        raise CreateAvailabilityException from e

def set_availabilities(listing_id: int, availabilities: List[listing_schemas.CreateAvailability], db: orm.Session):
    if not does_listing_exist(listing_id, db):
        raise ListingDoesNotExistException

    delete_all_availabilities(listing_id, db)

    availability_models = [
        models.Availability(
            listing_id= listing_id,
            start_date=availability.start_date,
            end_date=availability.end_date,
            start_time=availability.start_time,
            end_time=availability.end_time
        )
        for availability in availabilities
    ]

    try:
        for availability_model in availability_models:
            db.add(availability_model)
        db.commit()
        for availability_model in availability_models:
            db.refresh(availability_model)
        return [listing_schemas.Availability.from_orm(model) for model in availability_models]
    except sql.exc.IntegrityError as e:
        raise CreateAvailabilityException from e

def get_availabilities(listing_id: int, db: orm.Session) -> List[listing_schemas.Availability]:
    if not does_listing_exist(listing_id, db):
        raise ListingDoesNotExistException
    
    availability_models = db.query(models.Availability).filter(models.Availability.listing_id == listing_id).all()
    return [listing_schemas.Availability.from_orm(model) for model in availability_models]

def update_availability(availability_id: int, availability: listing_schemas.CreateAvailability, db: orm.Session) -> listing_schemas.Availability:
    availability_model = db.query(models.Availability).filter(models.Availability.id == availability_id).scalar()
    if availability_model is None:
        raise AvailabilityDoesNotExistException
    try:
        availability_model.start_date = availability.start_date
        availability_model.end_date = availability.end_date
        availability_model.start_time = availability.start_time
        availability_model.end_time = availability.end_time
        db.commit()
        db.refresh(availability_model)
        return listing_schemas.Availability.from_orm(availability_model)
    except sql.exc.IntegrityError as e:
        raise CreateAvailabilityException from e

def delete_availability(availability_id: int, db: orm.Session):
    availability_model = db.query(models.Availability).filter(models.Availability.id == availability_id).first()
    if availability_model is None:
        raise AvailabilityDoesNotExistException
    try:
        db.delete(availability_model)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteAvailabilityException from e

def delete_all_availabilities(listing_id: int, db: orm.Session):
    availabilities = db.query(models.Availability).filter(models.Availability.listing_id == listing_id).all()
    try:
        for availability_model in availabilities:
            db.delete(availability_model)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteAvailabilityException from e

def get_listing_by_user(user_id : int, db : orm.Session) -> List[listing_schemas.CarSpaceListingInclReview]:
    if not user_services.does_user_exist(user_id, db):
        raise ListingDoesNotExistException
    
    listing_models = db.query(models.Listing).filter(models.Listing.owner_id == user_id).all()
    results: List[listing_schemas.CarSpaceListingInclReview] = []
    for listing_model in listing_models:
        listing = listing_schemas.CarSpaceListing.from_orm(listing_model)
        reviews = review_services.get_all_reviews_by_listing(listing_model.id, db)
        results.append(listing_schemas.CarSpaceListingInclReview(**listing.dict(), reviews=reviews))

    return results