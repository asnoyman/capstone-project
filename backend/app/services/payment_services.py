from app.database import database
from app.schemas import payment_schemas
import sqlalchemy as sql
import sqlalchemy.orm as orm
from app.database import models
from app.services import database_services
import decimal

class UserDoesNotExistException(Exception):
    pass

class BankAccountException(Exception):
    pass

class DeleteBankAccountException(Exception):
    pass

class BankAccountDoesNotExistException(Exception):
    pass

ACCOUNT_ID_SYSTEM_REVENUE = 1


def init_payments():
    db = database.SessionLocal()
    if db.query(models.BankAccount).count() == 0:
        revenue = models.BankAccount(bsb="", account_number="")
        db.add(revenue)
        db.commit()
    db.close()

def user_has_bank_account(user_id: int, db: orm.Session) -> bool:
    account_id = db.query(models.User.bank_account_id).filter(models.User.id == user_id).scalar()
    return account_id is not None

def get_bank_account(user_id: int, db: orm.Session) -> payment_schemas.BankAccount:
    user_model = db.query(models.User).filter(models.User.id == user_id).first()

    if user_model is None:
        raise UserDoesNotExistException

    if user_model.bank_account_id is None:
        raise BankAccountDoesNotExistException
    
    return payment_schemas.BankAccount.from_orm(user_model.bank_account)
    
def set_bank_account(create_account: payment_schemas.CreateBankAccount, user_id: int, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()

    if user_model is None:
        raise UserDoesNotExistException
    
    try:
        if user_model.bank_account is None:
            bank_account_model = models.BankAccount(
                bsb=create_account.bsb,
                account_number=create_account.account_number
            )
            user_model.bank_account = bank_account_model
        else:
            user_model.bank_account.bsb = create_account.bsb
            user_model.bank_account.account_number = create_account.account_number
        
        db.commit()
    except sql.exc.IntegrityError as e:
        raise BankAccountException

def delete_bank_account(user_id: int, db: orm.Session):
    user_model = db.query(models.User).filter(models.User.id == user_id).first()

    if user_model is None:
        raise UserDoesNotExistException

    if user_model.bank_account_id is None:
        raise BankAccountDoesNotExistException
    
    try:
        db.delete(user_model.bank_account)
        db.commit()
    except sql.exc.IntegrityError as e:
        raise DeleteBankAccountException

def charge_user(provider_id: int, cost_excl_service_fee: decimal.Decimal, db: orm.Session, pay_service_fee=True):
    if pay_service_fee:
        decimal.getcontext().prec = 2
        service_fee = decimal.Decimal(0.15) * cost_excl_service_fee
        revenue_account = db.query(models.BankAccount).filter(models.BankAccount.id == ACCOUNT_ID_SYSTEM_REVENUE).first()
        revenue_account.balance += service_fee

    provider_account_id = db.query(models.User.bank_account_id).filter(models.User.id == provider_id).scalar()
    if provider_account_id is None:
        raise BankAccountDoesNotExistException
    provider_account = db.query(models.BankAccount).filter(models.BankAccount.id == provider_account_id).first()
    provider_account.balance += cost_excl_service_fee

    db.commit()

def get_system_balances(db: orm.Session) -> payment_schemas.SystemBalance:
    revenue_account = db.query(models.BankAccount).filter(models.BankAccount.id == ACCOUNT_ID_SYSTEM_REVENUE).first()
    return payment_schemas.SystemBalance(system_balance=revenue_account.balance)