import fastapi
from app.schemas import review_schemas, token_schemas, review_schemas
from app.services import security_services, database_services, listing_services, review_services
import sqlalchemy.orm as orm
from typing import Optional

router = fastapi.APIRouter(
    tags=['reviews'],
)

@router.put("/listing/{listing_id}/review")
def set_current_users_review(listing_id: int, review: review_schemas.CreateReview, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        review = review_services.set_review(token_data.user_id, listing_id, review, db)
        return {"review_id": review.id}
    except review_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except review_services.InvalidReviewRequest as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Invalid review request"
        ) from e

@router.get("/listing/{listing_id}/review", response_model=review_schemas.Review)
def get_current_users_review(listing_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return review_services.get_user_review(token_data.user_id, listing_id, db)
    except review_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except review_services.ReviewDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Review does not exist"
        ) from e

@router.get("/listing/{listing_id}/review/all", response_model=review_schemas.AggregateReviews)
def get_all_reviews_by_listing(listing_id: int, rating: Optional[int] = None, db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return review_services.get_all_reviews_by_listing(listing_id,  db, rating)
    except review_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e

@router.delete("/listing/{listing_id}/review")
def delete_current_users_review_for_listing(listing_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        review_services.delete_users_review_for_listing(listing_id, token_data.user_id, db)
    except review_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except review_services.DeleteReviewException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail="Invalid Delete Requset"
        ) from e

@router.delete("/review/{review_id}")
def delete_review(review_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (review_services.user_owns_review(token_data.user_id, review_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own review[id={review_id}] and is not an Admin"
            )

        review_services.delete_review(review_id, db)
    except review_services.ReviewDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Review[id={review_id}] does not exist"
        ) from e
    except review_services.DeleteReviewException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Invalid Delete Requset"
        ) from e
    