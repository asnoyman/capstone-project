import fastapi
from app.schemas import listing_schemas, token_schemas
from app.services import security_services, database_services, listing_services
import sqlalchemy.orm as orm
from typing import List

router = fastapi.APIRouter(
    tags=['car space listing'],
    prefix='/listing'
)

@router.post("/create")
async def register_listing(new_listing: listing_schemas.CreateCarSpaceListing, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        listing = listing_services.create_car_space_listing(new_listing, token_data.user_id, db)
        return {"listing_id": listing.id}
    except listing_services.CreateListingException as e:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail="Error creating listing") from e
    except listing_services.NoBankAccountException as e:
        raise fastapi.HTTPException(status_code=fastapi.status.HTTP_400_BAD_REQUEST, detail="User must register a bank account before listing a car space") from e

@router.get("/all", response_model=List[listing_schemas.CarSpaceListingInclReview])
async def get_all_listings(db: orm.Session = fastapi.Depends(database_services.get_db)):
    return listing_services.get_listings(db)

@router.get("/user/{user_id}", response_model=List[listing_schemas.CarSpaceListingInclReview])
async def get_listings_by_user_id(user_id: int, db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return listing_services.get_listing_by_user(user_id, db)
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"User[id={user_id}] does not exist"
        ) from e

@router.get("/user", response_model=List[listing_schemas.CarSpaceListingInclReview])
async def get_listings_from_current_user(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    return listing_services.get_listing_by_user(token_data.user_id, db)
    
@router.get("/{listing_id}", response_model=listing_schemas.CarSpaceListing)
async def get_listing_by_listing_id(listing_id: int, db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return listing_services.get_listing(listing_id, db)
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e

@router.put("/{listing_id}")
async def update_listing(listing_id: int, new_listing: listing_schemas.CreateCarSpaceListing, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
        
        updated_listing = listing_services.update_car_space_listing(listing_id, new_listing, db)
        return {"listing_id": updated_listing.id}
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except (listing_services.CreateListingException, listing_services.DeleteImageException) as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating listing[listing_id={listing_id}]"
        ) from e

@router.delete("/{listing_id}")
async def delete_listing(listing_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
        
        listing_services.delete_listing(listing_id, db)
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except listing_services.DeleteListingException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting listing[listing_id={listing_id}]"
        ) from e
    except listing_services.ListingHasUpcomingBookingsException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete listing[listing_id={listing_id}] as it has upcoming bookings"
        ) from e

@router.get("/{listing_id}/permission")
async def user_listing_permissions(listing_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e

@router.post("/{listing_id}/image")
async def upload_image(listing_id: int, new_image: listing_schemas.NewImage, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
        
        image = listing_services.add_images(listing_id, [new_image.data], db)[0]
        return {"image_id": image.id}
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except listing_services.CreateImageException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Error creating image"
        ) from e

@router.post("/{listing_id}/images")
async def upload_image_bulk(listing_id: int, new_images: List[listing_schemas.NewImage], token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
        image_data = [image.data for image in new_images]
        images = listing_services.add_images(listing_id, image_data, db)
        return {"image_ids": [image.id for image in images]}
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except listing_services.CreateImageException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Error creating image"
        ) from e

@router.get("/{listing_id}/availability", response_model=List[listing_schemas.Availability])
async def get_availability_by_listing_id(listing_id: int, db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return listing_services.get_availabilities(listing_id, db)
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e

@router.put("/{listing_id}/availability")
async def set_availabilitites(listing_id: int, availabilitites: List[listing_schemas.CreateAvailability], token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
        new_availabilitites = listing_services.set_availabilities(listing_id, availabilitites, db)
        return {'availability_ids': [availability.id for availability in new_availabilitites]}
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e
    except listing_services.CreateAvailabilityException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Error creating availability"
        ) from e
    except listing_services.DeleteAvailabilityException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Error deleteing existing availabilities"
        ) from e

@router.get("/{listing_id}/permission")
async def user_is_owner_or_admin(listing_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (listing_services.user_owns_listing(token_data.user_id, listing_id, db) or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own listing[id={listing_id}] and is not an Admin"
            )
    except listing_services.ListingDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"Listing[id={listing_id}] does not exist"
        ) from e