import pydantic
from typing import Optional, List

TIME_REFERENCE_POINT = 0 # Time stamp representing 10am 
START_OF_DAY_TIME_STAMP = TIME_REFERENCE_POINT - 10 * 60 * 60 * 1000 # Time stamp representing 00:00:00 in ms
END_OF_DAY_TIME_STAMP = TIME_REFERENCE_POINT + 14 * 60 * 60 * 1000 # Time stamp representing 24:00:00 in ms
TIME_BLOCK = 15 * 60 * 1000 # Each time period is aligned to 15 mins

class CreateBooking(pydantic.BaseModel):
    date: pydantic.NonNegativeInt
    start_time: int = pydantic.Field(ge=START_OF_DAY_TIME_STAMP, le=END_OF_DAY_TIME_STAMP, example= 0) # Time stamp in ms
    end_time: int = pydantic.Field(ge=START_OF_DAY_TIME_STAMP, le=END_OF_DAY_TIME_STAMP, example= TIME_BLOCK) # Time stamp in ms

    @pydantic.validator("start_time")
    def ensure_valid_start_time(cls, start_time: int, values: dict):
        if start_time % TIME_BLOCK != 0:
            raise ValueError("Start time must be aligned to a 15 minute period")
        return start_time

    @pydantic.validator("end_time")
    def ensure_valid_end_time(cls, end_time: int, values: dict):
        if end_time % TIME_BLOCK != 0:
            raise ValueError("End time must be aligned to a 15 minute period")
        
        start_time = values["start_time"]
        if end_time <= start_time:
            raise ValueError("End time cannot be before start time")
        return end_time

class Booking(CreateBooking):
    id: int
    listing_id: Optional[int]
    price: pydantic.condecimal(ge=0, decimal_places=2) = pydantic.Field(example=0.00)

    class Config:
        orm_mode = True

class BookingsData(pydantic.BaseModel):
    past_bookings: List[Booking]
    upcoming_bookings: List[Booking]

class TimePeriod(pydantic.BaseModel):
    start_time: int = pydantic.Field(ge=START_OF_DAY_TIME_STAMP, le=END_OF_DAY_TIME_STAMP, example= 0) # Time stamp in ms
    end_time: int = pydantic.Field(ge=START_OF_DAY_TIME_STAMP, le=END_OF_DAY_TIME_STAMP, example= 1) # Time stamp in ms

    @pydantic.validator("end_time")
    def ensure_valid_time_range(cls, end_time: int, values: dict):
        start_time = values["start_time"]
        if end_time < start_time:
            raise ValueError("End time cannot be before start time")
        return end_time

class DayAvailability(pydantic.BaseModel):
    date: int
    times: List[TimePeriod]

class WeekAvailability(pydantic.BaseModel):
    day_1: DayAvailability
    day_2: DayAvailability
    day_3: DayAvailability
    day_4: DayAvailability
    day_5: DayAvailability
    day_6: DayAvailability
    day_7: DayAvailability
    
    