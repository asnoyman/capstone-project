from app.schemas import user_schemas
import sqlalchemy as sql
import sqlalchemy.orm as orm
import app.database.models as models
from app.services import security_services, payment_services
from typing import List

class CreateUserException(Exception):
    pass

class DeleteUserException(Exception):
    pass

class SingleAdminException(Exception):
    pass

class UserDoesNotExistException(Exception):
    pass

def create_user(new_user: user_schemas.CreateUser, db: orm.Session) -> user_schemas.User:
    # First account is an Admin, all other accounts have User role by default 
    role = models.Role.USER if db.scalar(sql.select(models.User)) else models.Role.ADMIN
    
    user_model = models.User(
        first_name= new_user.first_name,
        last_name= new_user.last_name,
        email= new_user.email,
        password= security_services.hash_password(new_user.password.get_secret_value()),
        role= role
    )
    try:
        db.add(user_model)
        db.commit()
        db.refresh(user_model)
        return user_schemas.User.from_orm(user_model)
    except sql.exc.IntegrityError as e:
        raise CreateUserException from e

def does_user_exist(user_id: int, db: orm.Session) -> bool:
    id = db.query(models.User.id).filter(models.User.id == user_id).scalar()
    return id is not None

def create_user_info(user_model: models.User, db: orm.Session, include_payments_info=True) -> user_schemas.UserInfo:
    user_info = user_schemas.UserInfo(
        id=user_model.id,
        first_name=user_model.first_name,
        last_name=user_model.last_name,
        email=user_model.email,
        isAdmin=user_model.role == models.Role.ADMIN,
        profile_picture=user_model.profile_picture
    )
    
    if include_payments_info:
        if user_model.bank_account_id is not None:
            user_info.bsb = user_model.bank_account.bsb
            user_info.account_number = user_model.bank_account.account_number
            user_info.balance = user_model.bank_account.balance
        
        if user_info.isAdmin:
            user_info.system_balance = payment_services.get_system_balances(db).system_balance
    
    return user_info
    
def get_user_profile(user_id: int, db: orm.Session, include_payments_info=True) -> user_schemas.UserInfo:
    user_model = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user_model is None:
        raise UserDoesNotExistException
    
    return create_user_info(user_model, db, include_payments_info)

def get_all_user_profiles(db: orm.Session, include_payments_info=True) -> List[user_schemas.UserInfo]:
    profiles: List[user_schemas.UserInfo] = []

    for user_model in db.query(models.User).all():
        user_info = create_user_info(user_model, db, include_payments_info)
        profiles.append(user_info)

    return profiles

def update_user_info(user_id: int, user_info: user_schemas.UpdateUserInfo, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user_model is None:
        raise UserDoesNotExistException
    
    user_model.first_name = user_info.first_name
    user_model.last_name = user_info.last_name
    user_model.profile_picture = user_info.profile_picture

    try:
        db.commit()
        db.refresh(user_model)
        return user_schemas.User.from_orm(user_model)
    except sql.exc.IntegrityError as e:
        raise CreateUserException from e

def remove_user(user_id: int, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()

    if user_model is None:
        raise UserDoesNotExistException
    
    if user_model.role == models.Role.ADMIN:
        # Cannot delete admin if is the only admin on platform
        num_admins = db.query(models.User).filter(models.User.role == models.Role.ADMIN).count()
        if num_admins == 1:
            raise SingleAdminException
    
    try:
        db.delete(user_model)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteUserException from e
