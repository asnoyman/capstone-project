import fastapi
import sqlalchemy.orm as orm
from app.services import security_services, database_services, badge_service
from app.schemas import token_schemas, badge_schemas

router = fastapi.APIRouter(tags=['badge'])

@router.get("/badge")
async def get_all_badge(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    badges_earned = badge_service.get_all_badge(token_data.user_id, db)
    badges_type = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    d = {}
    for id in badges_type:
        if id not in badges_earned:
            d[id] = False 
        else:
            d[id] = True
    return d

@router.get("/badge/{user_id}")
async def get_all_user_badge(user_id: int, db: orm.Session = fastapi.Depends(database_services.get_db)):
    badges_earned = badge_service.get_all_badge(user_id, db)
    badges_type = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
    d = {}
    for id in badges_type:
        if id not in badges_earned:
            d[id] = False 
        else:
            d[id] = True
    return d

@router.put("/badge/add_badge_to_current_user", response_model = badge_schemas.Badge)
async def add_new_badge_to_current_user(type_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token),  db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return badge_service.add_new_badge_to_user(token_data.user_id, type_id, db)
    except badge_service.AddBadgeError as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Encountered an error adding badge to user"
        ) from e
    except badge_service.UserAlreadyHadBadgeException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"User already has badge[type_id={type_id}]"
        ) from e
    except badge_service.InvalidBadgeId as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Badge[type_id={type_id}] does not exist"
        ) from e

@router.put("/badge/add_badge_to_user", response_model = badge_schemas.Badge)
async def add_new_badge_to_user(type_id: badge_schemas.BadgeType, user_id: int,  db: orm.Session = fastapi.Depends(database_services.get_db), token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token)):
    try:
        return badge_service.add_new_badge_to_user(user_id, type_id, db)
    except badge_service.AddBadgeError as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Encountered an error adding badge to user"
        ) from e
    except badge_service.UserAlreadyHadBadgeException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"User already has badge[type_id={type_id}]"
        ) from e
    except badge_service.InvalidBadgeId as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Badge[type_id={type_id}] does not exist"
        ) from e
