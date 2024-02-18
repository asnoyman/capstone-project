import sqlalchemy as sql
import sqlalchemy.orm as orm
from app.schemas import review_schemas
from app.database import models
from app.services import listing_services, booking_services
from typing import Optional
import decimal


class ListingDoesNotExistException(Exception):
    pass

class InvalidReviewRequest(Exception):
    pass

class DeleteReviewException(Exception):
    pass

class ReviewDoesNotExistException(Exception):
    pass

def set_review(user_id: int, listing_id: int, review: review_schemas.CreateReview, db: orm.Session) -> review_schemas.Review:
    # check the listing exist or not
    if listing_services.does_listing_exist(listing_id, db) is False:
        raise ListingDoesNotExistException

    # If the user never used this list, raise invalid request
    if not booking_services.has_user_booked_listing_in_past(listing_id, user_id, db):
        raise InvalidReviewRequest
    
    current_review_model = db.query(models.Review).filter(models.Review.listing_id == listing_id, models.Review.user_id == user_id).first()

    updated_model = None
    if current_review_model is None:
        updated_model = models.Review(
                user_id = user_id,
                listing_id = listing_id,
                rating = review.rating,
                review = review.review,
                anonymous = review.anonymous
            )
    else:
        updated_model = current_review_model
        updated_model.rating = review.rating
        updated_model.review = review.review
        updated_model.anonymous = review.anonymous

    try:
        # If currently no review in database then needs to be added
        if current_review_model is None:
            db.add(updated_model)
        db.commit()
        db.refresh(updated_model)
        return review_schemas.Review.from_orm(updated_model)
    except sql.exc.IntegrityError as e:
        raise InvalidReviewRequest from e 

def get_user_review(user_id: int, listing_id: int, db: orm.Session) -> review_schemas.Review:
    # check the listing exist or not
    if listing_services.does_listing_exist(listing_id, db) is False:
        raise ListingDoesNotExistException
    
    review_model = db.query(models.Review).filter(models.Review.user_id == user_id, models.Review.listing_id == listing_id).first()
    # if there is no review on this list, raise InvalidReviewRequest
    if review_model is None:
        raise ReviewDoesNotExistException
    return review_schemas.Review.from_orm(review_model)

def get_all_reviews_by_listing(listing_id: int, db: orm.Session, rating: Optional[int] = None) -> review_schemas.AggregateReviews:
    # check the listing exist or not
    if listing_services.does_listing_exist(listing_id, db) is False:
        raise ListingDoesNotExistException
    # put the review into the output list
    review_models = []
    if rating is None:
        review_models = db.query(models.Review).filter(models.Review.listing_id == listing_id).all()
    else:
        review_models = db.query(models.Review).filter(models.Review.listing_id == listing_id).filter(models.Review.rating == rating).all()
    
    all_rating = 0
    num_elements = len(review_models)
    result_list = []

    for model in review_models:
        all_rating = all_rating + model.rating
        review = review_schemas.AnonymisedReview(
            id=model.id,
            name="Anonymous" if model.anonymous else f"{model.user.first_name} {model.user.last_name}",
            rating=model.rating,
            review=model.review
        )
        result_list.append(review)
    
    decimal.getcontext().prec = 1
    ave_rating = decimal.Decimal(0) if num_elements == 0 else decimal.Decimal(all_rating / num_elements)
    result = review_schemas.AggregateReviews(
        aggregate_rating=ave_rating,
        reviews=result_list
    )
    return result

def delete_users_review_for_listing(listing_id: int, user_id: int, db: orm.Session):
    #check the listing exist or not
    if listing_services.does_listing_exist(listing_id, db) is False:
        raise ListingDoesNotExistException

    review = db.query(models.Review).filter(models.Review.listing_id == listing_id).filter(models.Review.user_id == user_id).first()
    # if the User does not have a review for listing
    if review is None:
        raise DeleteReviewException
    try:
        db.delete(review)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteReviewException from e

def delete_review(review_id: int, db: orm.Session):
    if not does_review_exist(review_id, db):
        raise ReviewDoesNotExistException
    # check if the user own the review or is admin
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    try:
        db.delete(review)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteReviewException from e
    
    
def does_review_exist(review_id: int, db: orm.Session) -> bool:
    owner_id = db.query(models.Review.user_id).filter(models.Review.id == review_id).scalar()
    return owner_id is not None

def user_owns_review(user_id: int, review_id: int, db: orm.Session) -> bool:
    owner_id = db.query(models.Review.user_id).filter(models.Review.id == review_id).scalar()
    if owner_id is None:
        raise ReviewDoesNotExistException
    return owner_id == user_id