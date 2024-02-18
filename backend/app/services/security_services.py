import datetime
import fastapi
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.schemas import token_schemas, user_schemas
import passlib.context
import sqlalchemy as sql
from sqlalchemy import orm
from app.database import models
from app.services import database_services, session_services

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

TOKEN_USER_ID = "sub"
TOKEN_SESSION_ID = "sid"
TOKEN_EXPIRY = "exp"

pwd_context = passlib.context.CryptContext(schemes=["bcrypt"])

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/user/auth/login"
)

class UserDoesNotExistException(Exception):
    pass

class IncorrectPasswordException(Exception):
    pass

class UpdatePasswordException(Exception):
    pass

class InvalidPermissionsException(Exception):
    pass

class SingleAdminException(Exception):
    pass

def create_access_token(user: user_schemas.User, expiry: int=ACCESS_TOKEN_EXPIRE_MINUTES) -> token_schemas.Token:
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=expiry)
    data = {
        TOKEN_USER_ID: f"{user.id}",
        TOKEN_EXPIRY: expire,
        TOKEN_SESSION_ID: session_services.get_new_session_id(user.id, user.role),
    }
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return token_schemas.Token(access_token=encoded_jwt, token_type="bearer")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def validate_password(given_password: str, stored_password: str) -> bool:
    return pwd_context.verify(given_password, stored_password)

def valid_token(token: str = fastapi.Depends(oauth2_scheme)) -> token_schemas.TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        data = token_schemas.TokenData(
            token=token,
            user_id=int(payload.get(TOKEN_USER_ID)),
            session_id=payload.get(TOKEN_SESSION_ID),
            expiry=payload.get(TOKEN_EXPIRY)
        )
        session_services.validate_session(data.user_id, data.session_id)
        return data
    except (JWTError, session_services.InvalidSessionIdException, InvalidPermissionsException) as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

def valid_admin_token(token: str = fastapi.Depends(oauth2_scheme)) -> token_schemas.TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        data = token_schemas.TokenData(
            token=token,
            user_id=int(payload.get(TOKEN_USER_ID)),
            session_id=payload.get(TOKEN_SESSION_ID),
            expiry=payload.get(TOKEN_EXPIRY)
        )
        session_services.validate_session(data.user_id, data.session_id, user_schemas.Role.ADMIN)
        return data
    except (JWTError, session_services.InvalidSessionIdException, InvalidPermissionsException) as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Operation requires admin permissions",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

def valid_user(token_data: token_schemas.TokenData = fastapi.Depends(valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)) -> user_schemas.User:
    try:
        return get_user_by_id(token_data.user_id, db)
    except UserDoesNotExistException as e:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e

def valid_admin(user: user_schemas.User = fastapi.Depends(valid_user)) -> user_schemas.User:
    if user.role != user_schemas.Role.ADMIN:
        raise fastapi.HTTPException(
            status_code=fastapi.status.HTTP_401_UNAUTHORIZED,
            detail="Operation requires admin permissions",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def invalidate_token(token: token_schemas.TokenData):
    session_services.invalidate_current_session(token.user_id)

def invalidate_user_token(user_id: int):
    session_services.invalidate_current_session(user_id)

def user_in_admin_session(token_data: token_schemas.TokenData):
    try:
        session_services.validate_session(token_data.user_id, token_data.session_id, user_schemas.Role.ADMIN)
        return True
    except session_services.InvalidSessionIdException:
        return False

def get_user_by_id(id: int, db: orm.Session) -> user_schemas.User:
    user_model = db.scalar(sql.select(models.User).filter_by(id=id))
    if user_model is None:
        raise UserDoesNotExistException
    return user_schemas.User.from_orm(user_model)

def attempt_login(email: str, password: str, db: orm.Session) -> user_schemas.User:
    user_model = db.scalar(sql.select(models.User).filter_by(email=email))
    if user_model is None:
        raise UserDoesNotExistException
    if not validate_password(password, user_model.password):
        raise IncorrectPasswordException
    return user_schemas.User.from_orm(user_model)

def make_admin(user_id: int, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()

    if user_model is None:
        raise UserDoesNotExistException
    
    try:
        user_model.role = models.Role.ADMIN
        db.commit()
    except sql.exc.IntegrityError as e:
        raise InvalidPermissionsException from e

    session_services.set_session_role(user_id, user_schemas.Role.ADMIN)

def demote_admin(user_id: int, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()

    if user_model is None:
        raise UserDoesNotExistException
    
    if user_model.role == models.Role.USER:
        return

    # Raise exception if the last admin is demoting themselves
    num_admins = db.query(models.User).filter(models.User.role == models.Role.ADMIN).count()
    if num_admins == 1:
        raise SingleAdminException
    
    user_model.role = models.Role.USER
    db.commit()

    session_services.set_session_role(user_id, user_schemas.Role.USER)

def update_password(user_id: int, update_password: user_schemas.UpdatePassword, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user_model is None:
        raise UserDoesNotExistException
    
    if not validate_password(update_password.current_password.get_secret_value(), user_model.password):
        raise IncorrectPasswordException
    
    try:
        user_model.password = hash_password(update_password.new_password.get_secret_value())
        db.commit()
    except sql.exc.IntegrityError as e:
        raise UpdatePasswordException from e