import fastapi
import sqlalchemy.orm as orm
from app.services import security_services, database_services, puzzle_services
from app.schemas import token_schemas, puzzle_schemas
from typing import Optional

router = fastapi.APIRouter(tags=['puzzles'])

@router.get("/puzzle", response_model=puzzle_schemas.PuzzleQuestion)
async def get_puzzle(date: Optional[int] = None, db: orm.Session = fastapi.Depends(database_services.get_db)):
    try: 
        return puzzle_services.get_puzzle_question(db, date)
    except puzzle_services.PuzzleAPINotAvailableException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Puzzle service unavailable, try again later"
        ) from e

@router.put("/puzzle/submission/{date}", response_model=puzzle_schemas.SubmissionResult)
async def make_submission(date: int, submission: puzzle_schemas.PuzzleSubmission, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return puzzle_services.accept_puzzle_submission(token_data.user_id, date, submission, db)
    except puzzle_services.PuzzleAPINotAvailableException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Puzzle service unavailable, try again later"
        ) from e

@router.get("/puzzle/submission/{date}", response_model=puzzle_schemas.PuzzleQuestionInclSubmission)
async def retrieve_submission(date: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return puzzle_services.get_current_submission(token_data.user_id, date, db)
    except puzzle_services.PuzzleAPINotAvailableException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Puzzle service unavailable, try again later"
        ) from e

@router.delete("/puzzle/submission/{date}")
async def reset_submission(date: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        puzzle_services.reset_puzzle_submission(token_data.user_id, date, db)
    except puzzle_services.PuzzleAPINotAvailableException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Puzzle service unavailable, try again later"
        ) from e

@router.get("/puzzle/streak", response_model=puzzle_schemas.PuzzleStreak)
async def get_current_streak(token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    return puzzle_services.calculate_streak(token_data.user_id, db)

@router.get("/puzzle/solution/{date}")
async def retrieve_solution(date: int, token_data: token_schemas.TokenData = fastapi.Depends(security_services.valid_token), db: orm.Session = fastapi.Depends(database_services.get_db)):
    try:
        return puzzle_services.retrieve_solution(token_data.user_id, date, db)
    except puzzle_services.PuzzleAPINotAvailableException as e:
        raise fastapi.exceptions.HTTPException(
            status_code=fastapi.status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Puzzle service unavailable, try again later"
        ) from e
