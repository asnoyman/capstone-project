import fastapi
from app.schemas import token_schemas, user_schemas
from app.services import user_services, database_services, security_services
from sqlalchemy import orm
from fastapi.security import OAuth2PasswordRequestForm

router = fastapi.APIRouter(
    tags=['user'],
    prefix='/user'
)

responses = {
    fastapi.status.HTTP_401_UNAUTHORIZED: {"description": "Invalid credentials"}
}

@router.post("/auth/register", response_model=token_schemas.Token, responses=responses)
async def register_user(new_user: user_schemas.CreateUser, db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        user = user_services.create_user(new_user, db)
        return security_services.create_access_token(user)
    except Exception as e:
        raise fastapi.HTTPException(fastapi.status.HTTP_401_UNAUTHORIZED, detail="Email already in use") from e

@router.post("/auth/login", response_model=token_schemas.Token, responses=responses)
async def login(form_data: OAuth2PasswordRequestForm = fastapi.Depends(), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        user = security_services.attempt_login(form_data.username, form_data.password, db)
        return security_services.create_access_token(user)
    except (security_services.IncorrectPasswordException, security_services.UserDoesNotExistException) as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

@router.post("/auth/logout", responses=responses)
async def logout(token: token_schemas.TokenData = fastapi.Depends(security_services.valid_token)):
    security_services.invalidate_token(token)
    return {}

@router.get("/profile", response_model=user_schemas.UserInfo)
async def get_current_user_profile(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    return user_services.get_user_profile(token_data.user_id, db)

@router.get("/profile/{user_id}", response_model=user_schemas.UserInfo)
async def get_user_profile(user_id: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return user_services.get_user_profile(user_id, db, include_payments_info=(user_id == token_data.user_id or security_services.user_in_admin_session(token_data)))
    except user_services.UserDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"User[id={user_id}] does not exist"
        ) from e

@router.put("/profile")
async def update_current_user_profile(user_info: user_schemas.UpdateUserInfo, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        user_services.update_user_info(token_data.user_id, user_info, db)
    except user_services.CreateUserException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating user[id={token_data.user_id}]"
        ) from e

@router.put("/profile/{user_id}")
async def update_user_profile(user_id: int, user_info: user_schemas.UpdateUserInfo, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        if not (user_id == token_data.user_id or security_services.user_in_admin_session(token_data)):
            raise fastapi.exceptions.HTTPException(
                status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
                detail=f"User does not own account[id={user_id}] and is not an Admin"
            )
        
        user_services.update_user_info(user_id, user_info, db)
    except user_services.UserDoesNotExistException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_404_NOT_FOUND,
            detail=f"User[id={user_id}] does not exist"
        ) from e
    except user_services.CreateUserException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail=f"Error updating user[id={token_data.user_id}]"
        ) from e

@router.put("/password")
async def update_password(update_password_request: user_schemas.UpdatePassword, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        security_services.update_password(token_data.user_id, update_password_request, db)
    except security_services.IncorrectPasswordException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail=f"Old password does not match"
        ) from e
    except security_services.UpdatePasswordException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_400_BAD_REQUEST,
            detail="Error updating password"
        )
