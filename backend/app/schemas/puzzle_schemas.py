import pydantic
from typing import List, Dict, Any
import enum

class PuzzleDifficulty(enum.Enum):
    Easy = "Easy"
    Medium = "Medium"
    Hard = "Hard"

class PuzzleData(pydantic.BaseModel):
    puzzle: List[List[int]]
    solution: List[List[int]]
    difficulty: PuzzleDifficulty

class Puzzle(PuzzleData):
    id: int
    date: int

    class Config:
        orm_mode = True

class PuzzleQuestion(pydantic.BaseModel):
    date: int
    puzzle: List[List[int]]
    difficulty: PuzzleDifficulty

class PuzzleQuestionInclSubmission(PuzzleQuestion):
    submission: List[List[int]]
    has_started: bool = False

    @pydantic.validator("has_started", always=True)
    def check_has_started(cls, has_started: bool, values: Dict[str, Any]):
        submission: List[List[int]] = values["submission"]
        puzzle: List[List[int]] = values["puzzle"]
        return submission != puzzle 

class PuzzleSubmission(pydantic.BaseModel):
    submission: List[List[int]]    

class PuzzleSolution(pydantic.BaseModel):
    solution: List[List[int]]

class SubmissionResult(pydantic.BaseModel):
    completed: bool

class PuzzleStreak(pydantic.BaseModel):
    streak: int
