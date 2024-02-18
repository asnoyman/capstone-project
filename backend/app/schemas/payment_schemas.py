import pydantic

class CreateBankAccount(pydantic.BaseModel):
    bsb: pydantic.constr(regex="[0-9]+")
    account_number: pydantic.constr(regex="[0-9]+")

class BankAccount(CreateBankAccount):
    id: int
    balance: pydantic.condecimal(ge=0, decimal_places=2)

    class Config:
        orm_mode = True

class SystemBalance(pydantic.BaseModel):
    system_balance: pydantic.condecimal(ge=0, decimal_places=2)