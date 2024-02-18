import fastapi
from app.schemas import token_schemas, user_schemas
from app.services import security_services, database_services, user_services
import sqlalchemy.orm as orm
from typing import List

router = fastapi.APIRouter(
    tags=['admin'],
    prefix='/admin'
)

@router.put("/promote/{user_id}")
async def make_user_admin(user_id: int, admin_token: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        security_services.make_admin(user_id, db)
    except security_services.UserDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"User[id={user_id}] does not exist"
        ) from e

@router.put("/demote/{user_id}")
async def demote_admin(user_id: int, admin_token: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        security_services.demote_admin(user_id, db)
    except security_services.UserDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"User[id={user_id}] does not exist"
        ) from e
    except security_services.SingleAdminException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error demoting user[id={user_id}] as they are the only admin on platform"
        ) from e

@router.delete("/remove/user/{user_id}")
async def delete_user(user_id: int, admin_token: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        user_services.remove_user(user_id, db)
        security_services.invalidate_user_token(user_id)
    except user_services.UserDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"User[id={user_id}] does not exist"
        ) from e
    except user_services.DeleteUserException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting user[id={user_id}]"
        ) from e
    except user_services.SingleAdminException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error deleting user[id={user_id}] as they are the only admin on platform"
        ) from e
    
@router.get("/users", response_model=List[user_schemas.UserInfo])
async def get_all_users(admin_token: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    return user_services.get_all_user_profiles(db)
