import pydantic
import datetime

class Token(pydantic.BaseModel):
    access_token: str
    token_type: str

class TokenData(pydantic.BaseModel):
    token: str
    user_id: int
    session_id: int
    expiry: datetime.datetime