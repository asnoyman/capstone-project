import fastapi
from app.schemas import token_schemas, user_schemas
from app.services import security_services

router = fastapi.APIRouter(
    tags=['token'],
    prefix='/token'
)

responses = {
    fastapi.status.HTTP_401_UNAUTHORIZED: {"description": "Invalid token"}
}

@router.post("/user", responses={fastapi.status.HTTP_401_UNAUTHORIZED: {"description": "Access token is not valid"}})
def check_token_is_valid(token: token_schemas.TokenData = fastapi.Depends(security_services.valid_token)):
    return {}

@router.post("/admin", responses={fastapi.status.HTTP_401_UNAUTHORIZED: {"description": "Access token is not valid or does not belong to an admin"}})
def check_token_is_valid_admin(token: token_schemas.TokenData = fastapi.Depends(security_services.valid_admin_token)):
    return {}