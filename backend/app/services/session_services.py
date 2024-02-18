import redis
import pydantic
from typing import Union
import json
from app.schemas import user_schemas

INITIAL_SESSION_ID = 1

class InvalidSessionIdException(Exception):
    pass

class Session(pydantic.BaseModel):
    session_id: int
    role: int

r = redis.Redis(host='localhost', port=6379)

def get_current_session(user_id: int) -> Union[Session, None]:
    raw_data = r.get(user_id)
    if raw_data is None:
        return None
    data = json.loads(raw_data)
    return Session(**data)

def set_current_session(user_id: int, session: Session):
    r.set(user_id, json.dumps(session.dict()))

def set_session_role(user_id: int, role: user_schemas.Role):
    session = get_current_session(user_id)
    if session is not None:
        session.role = role
        set_current_session(user_id, session)

def validate_session(user_id: int, session_id: int, required_role: user_schemas.Role = user_schemas.Role.USER):
    session = get_current_session(user_id)
    if session is None:
        raise InvalidSessionIdException
    if session_id != session.session_id or session.role < required_role:
        raise InvalidSessionIdException

def get_new_session_id(user_id: int, role: user_schemas.Role = user_schemas.Role.USER) -> int:
    invalidate_current_session(user_id)
    session = get_current_session(user_id)
    if session is None:
        session = Session(session_id=INITIAL_SESSION_ID, role=role)
    else:
        session.session_id += 1
        session.role = role
    set_current_session(user_id, session)
    return session.session_id

def invalidate_current_session(user_id: int):
    session = get_current_session(user_id)
    if session is not None:
        session.session_id += 1
        set_current_session(user_id, session)