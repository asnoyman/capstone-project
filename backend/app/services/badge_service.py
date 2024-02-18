from app.database import models
from app.schemas.listing_schemas import get_current_date
import sqlalchemy.orm as orm
import sqlalchemy as sql
from app.schemas import badge_schemas
from typing import Dict

class AddBadgeError(Exception):
    pass

class InvalidBadgeId(Exception):
    pass

class UserAlreadyHadBadgeException(Exception):
    pass

def get_all_badge(user_id: int, db: orm.Session):
    #get all the badges current user earned
    badge_earned = db.query(models.Badge).filter(models.Badge.owner_id == user_id).all()
    result = []
    for badge in badge_earned:
        result.append(badge.type_id)

    return result

def add_new_badge_to_user(user_id: int, type_id: badge_schemas.BadgeType, db: orm.Session) -> badge_schemas.Badge:
    try:
        badge_type = badge_schemas.BadgeType(type_id)
    except ValueError as e:
        raise InvalidBadgeId
    
    existing_badge = db.query(models.Badge).filter(models.Badge.owner_id == user_id, models.Badge.type_id == badge_type).first()
    if existing_badge is not None:
        raise UserAlreadyHadBadgeException

    badge_model = models.Badge(
        type_id = type_id,
        owner_id = user_id,
        date = get_current_date()
    )
    try:
        db.add(badge_model)
        db.commit()
        db.refresh(badge_model)
        return badge_schemas.Badge.from_orm(badge_model)
    except sql.exc.IntegrityError as e:
        raise AddBadgeError from e