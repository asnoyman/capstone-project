from app.database import models
import requests
import time
from app.schemas.listing_schemas import ONE_DAY
from app.schemas import puzzle_schemas
import sqlalchemy.orm as orm
import sqlalchemy.exc as exc
import datetime

class PuzzleAPINotAvailableException(Exception):
    pass

class PuzzleUpdateException(Exception):
    pass

SUDOKU_API = "https://sudoku-api.vercel.app/api/dosuku"

def get_current_date() -> int:
    temp = datetime.datetime.now(tz=datetime.timezone.utc) + datetime.timedelta(hours=10)
    date = datetime.datetime(temp.year, temp.month, temp.day, tzinfo=datetime.timezone.utc)
    return int(date.timestamp()) * 1000

def update_days_puzzle(date: int, db: orm.Session) -> models.Puzzle:
    puzzle_data = get_new_puzzle()
    puzzle_model = models.Puzzle(
        date=date,
        puzzle=puzzle_data.puzzle,
        solution=puzzle_data.solution,
        difficulty=puzzle_data.difficulty
    )
    try:
        db.add(puzzle_model)
        db.commit()
    except exc.IntegrityError as e:
        # Exception could occur if there's a data race of two threads trying to update puzzle for puzzle on same day
        # Only one puzzle per day
        raise PuzzleUpdateException from e
    return puzzle_model

def get_new_puzzle() -> puzzle_schemas.PuzzleData:
    for _ in range(5):
        result = requests.get(SUDOKU_API)
        result.json()
        if result.status_code == 200:
            data = result.json()["newboard"]["grids"][0]
            return puzzle_schemas.PuzzleData(
                puzzle=data["value"],
                solution=data["solution"],
                difficulty=puzzle_schemas.PuzzleDifficulty[data['difficulty']]
            )
        else:
            time.sleep(2)
    raise PuzzleAPINotAvailableException

def get_puzzle_from_date(date: int, db: orm.Session) -> models.Puzzle:
    puzzle_model = db.query(models.Puzzle).filter(models.Puzzle.date == date).first()
    if puzzle_model is None:
        try:
            puzzle_model = update_days_puzzle(date, db)
        except PuzzleAPINotAvailableException as e:
            raise e
        except PuzzleUpdateException as e:
            puzzle_model = db.query(models.Puzzle).filter(models.Puzzle.date == date).first()
            if puzzle_model is None:
                raise PuzzleAPINotAvailableException
    return puzzle_model

def get_puzzle_question(db: orm.Session, date=None) -> puzzle_schemas.PuzzleQuestion:
    if date is None:
        date = get_current_date()
    puzzle = get_puzzle_from_date(date, db)
    return puzzle_schemas.PuzzleQuestion(
        date=puzzle.date,
        puzzle=puzzle.puzzle,
        difficulty=puzzle.difficulty
    )

def get_current_submission(user_id: int, puzzle_date: int, db: orm.Session) -> puzzle_schemas.PuzzleQuestionInclSubmission:
    puzzle_model = get_puzzle_from_date(puzzle_date, db)

    submission_model = db.query(models.PuzzleSubmission).filter(
                                                    models.PuzzleSubmission.user_id == user_id,
                                                    models.PuzzleSubmission.puzzle_id == puzzle_model.id
                                                ).first()
    if submission_model is None:
        submission_model = models.PuzzleSubmission(
            user_id=user_id,
            puzzle_id=puzzle_model.id,
            submission=puzzle_model.puzzle
        )
        db.add(submission_model)
        db.commit()
    
    return puzzle_schemas.PuzzleQuestionInclSubmission(
        date = puzzle_date,
        puzzle = puzzle_model.puzzle,
        difficulty= puzzle_model.difficulty,
        submission=submission_model.submission
    )

def accept_puzzle_submission(user_id: int, puzzle_date: int, submission: puzzle_schemas.PuzzleSubmission, db: orm.Session) -> puzzle_schemas.SubmissionResult:
    puzzle_model = get_puzzle_from_date(puzzle_date, db)
    current_submission_model = db.query(models.PuzzleSubmission).filter(
                                                    models.PuzzleSubmission.user_id == user_id,
                                                    models.PuzzleSubmission.puzzle_id == puzzle_model.id
                                                ).first()
    is_complete = submission.submission == puzzle_model.solution
    current_date = get_current_date()

    if current_submission_model is None:
        submission_model = models.PuzzleSubmission(
            user_id=user_id,
            puzzle_id=puzzle_model.id,
            submission=submission.submission,
            completion_date=(current_date if is_complete else None)
        )
        db.add(submission_model)
    else:
        current_submission_model.submission=submission.submission
        if current_submission_model.completion_date is None and is_complete:
            current_submission_model.completion_date=current_date

    db.commit()

    return puzzle_schemas.SubmissionResult(completed=is_complete)

def reset_puzzle_submission(user_id: int, puzzle_date: int, db: orm.Session):
    puzzle_model = get_puzzle_from_date(puzzle_date, db)
    current_submission_model = db.query(models.PuzzleSubmission).filter(
                                                models.PuzzleSubmission.user_id == user_id,
                                                models.PuzzleSubmission.puzzle_id == puzzle_model.id
                                            ).first()
    
    if current_submission_model is not None:
        current_submission_model.submission=puzzle_model.puzzle
        db.commit()

def calculate_streak(user_id: int, db: orm.Session) -> puzzle_schemas.PuzzleStreak:
    submission_models = db.query(models.PuzzleSubmission).join(models.Puzzle).filter(
            models.PuzzleSubmission.user_id == user_id,
            models.PuzzleSubmission.completion_date != None,
            models.Puzzle.date == models.PuzzleSubmission.completion_date
        ).order_by(models.PuzzleSubmission.completion_date.desc()).all()
    today = get_current_date()
    yesterday = today - ONE_DAY
    expected_date = today
    
    completed_today = False
    streak = 0
    for submission_model in submission_models:
        # Handle 1 day grace, streak still counts if haven't completed puzzle today
        if submission_model.completion_date == today:
            completed_today = True
        elif submission_model.completion_date == yesterday and not completed_today:
            expected_date -= ONE_DAY
        
        if (submission_model.completion_date == expected_date):
            streak += 1
            expected_date -= ONE_DAY
        else:
            break
    return puzzle_schemas.PuzzleStreak(streak=streak)

def retrieve_solution(user_id: int, date: int, db: orm.Session) -> puzzle_schemas.PuzzleSolution:
    puzzle_model = get_puzzle_from_date(date, db)
    return puzzle_schemas.PuzzleSolution(solution=puzzle_model.solution)
