import fastapi
from app.schemas import token_schemas, payment_schemas
from app.services import database_services, security_services, payment_services
from sqlalchemy import orm

router = fastapi.APIRouter(
    tags=['payment'],
)

@router.put("/user/payment/account")
def set_bank_account(create_account: payment_schemas.CreateBankAccount, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        payment_services.set_bank_account(create_account, token_data.user_id, db)
    except payment_services.BankAccountException as e:
        raise fastapi.HTTPException(fastapi.status.HTTP_400_BAD_REQUEST, detail="Error setting bank") from e
    
@router.get("/user/payment/account", response_model=payment_schemas.BankAccount)
def get_bank_account(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return payment_services.get_bank_account(token_data.user_id, db)
    except payment_services.BankAccountDoesNotExistException as e:
        raise fastapi.HTTPException(fastapi.status.HTTP_404_NOT_FOUND, detail="No bank account") from e

@router.delete("/user/payment/account")
def delete_bank_account(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return payment_services.delete_bank_account(token_data.user_id, db)
    except payment_services.BankAccountDoesNotExistException as e:
        raise fastapi.HTTPException(fastapi.status.HTTP_404_NOT_FOUND, detail="No bank account") from e
    except payment_services.DeleteBankAccountException as e:
        raise fastapi.HTTPException(fastapi.status.HTTP_400_BAD_REQUEST, detail="Error deleting bank account") from e

@router.get("/admin/payment", response_model=payment_schemas.SystemBalance)
def get_system_balance(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token),  db: orm.Session = fastapi.Depends(database_services.get_db)):
    return payment_services.get_system_balances(db)
