from typing import Optional
import pydantic
import enum

class CreateUser(pydantic.BaseModel):
    first_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    last_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    email: pydantic.EmailStr
    password: pydantic.SecretStr

class Role(int, enum.Enum):
    USER = 1
    ADMIN = 2

class User(pydantic.BaseModel):
    id: int
    first_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    last_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    email: pydantic.EmailStr
    role: Role
    password: pydantic.SecretStr

    class Config:
        orm_mode = True

class UserInfo(pydantic.BaseModel):
    id: int
    first_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    last_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    email: pydantic.EmailStr
    isAdmin: bool
    profile_picture: Optional[bytes]
    
    # Below null if user does not have a bank account registered
    bsb: Optional[pydantic.constr(regex="[0-9]+")]
    account_number: Optional[pydantic.constr(regex="[0-9]+")]
    balance: Optional[pydantic.condecimal(ge=0, decimal_places=2)]

    # Null is user is not an admin
    system_balance: Optional[pydantic.condecimal(ge=0, decimal_places=2)]

class UpdateUserInfo(pydantic.BaseModel):
    first_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    last_name: str = pydantic.Field(regex=r'[a-zA-Z]+')
    profile_picture: Optional[bytes]

class UpdatePassword(pydantic.BaseModel):
    current_password: pydantic.SecretStr
    new_password: pydantic.SecretStr
