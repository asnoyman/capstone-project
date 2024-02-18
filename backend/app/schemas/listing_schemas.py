import pydantic
from typing import Optional, List
import datetime
import time
from app.schemas import review_schemas

TIME_REFERENCE_POINT = 0 # Time stamp representing 10am 
START_OF_DAY_TIME_STAMP = TIME_REFERENCE_POINT - 10 * 60 * 60 * 1000 # Time stamp representing 00:00:00 in ms
END_OF_DAY_TIME_STAMP = TIME_REFERENCE_POINT + 14 * 60 * 60 * 1000 # Time stamp representing 24:00:00 in ms
SECOND = 1000
MINUTE = 60 * 1000
HOUR = 60 * 60 * 1000
ONE_DAY = 24 * 60 * 60 * 1000 # One day in ms
SIX_DAYS = 6 * ONE_DAY # Six days in ms
TIME_BLOCK = 15 * 60 * 1000 # Each time period is aligned to 15 mins

def get_current_date() -> int:
    temp = datetime.datetime.now(tz=datetime.timezone.utc)
    date = datetime.datetime(temp.year, temp.month, temp.day, tzinfo=datetime.timezone.utc)
    return int(date.timestamp()) * 1000

def get_current_time() -> int:
    curr_time = datetime.datetime.today().time()
    (hours, mins, seconds, millis) = curr_time.hour, curr_time.minute, curr_time.second, curr_time.microsecond // 100
    curr_time_in_ms = hours * HOUR + mins * MINUTE + seconds * SECOND + millis
    return curr_time_in_ms + START_OF_DAY_TIME_STAMP

class Image(pydantic.BaseModel):
    id: int
    listing_id: int
    data: bytes

    class Config:
        orm_mode = True

class NewImage(pydantic.BaseModel):
    data: bytes

class CreateAvailability(pydantic.BaseModel):
    start_date: pydantic.NonNegativeInt = pydantic.Field(example=time.mktime(datetime.date.today().timetuple())) # Unix time stamp
    end_date: Optional[pydantic.NonNegativeInt] = pydantic.Field(example=time.mktime((datetime.date.today() + datetime.timedelta(days=1)).timetuple())) # Unix time stamp
    start_time: int = pydantic.Field(ge=START_OF_DAY_TIME_STAMP, le=END_OF_DAY_TIME_STAMP, example= 0) # Time stamp in ms
    end_time: int = pydantic.Field(ge=START_OF_DAY_TIME_STAMP, le=END_OF_DAY_TIME_STAMP, example= TIME_BLOCK) # Time stamp in ms

    @pydantic.validator("end_date")
    def ensure_valid_date_range(cls, end_date: int, values: dict):
        if end_date is None:
            return end_date
        start_date = values["start_date"]
        if end_date < start_date:
            raise ValueError("End date cannot be before start date")
        return end_date
    
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
        if end_time < start_time:
            raise ValueError("End time cannot be before start time")
        return end_time

class Availability(CreateAvailability):
    id: int

    class Config:
        orm_mode = True

class CreateCarSpaceListing(pydantic.BaseModel):
    title: str = pydantic.Field(min_length=1)
    length: pydantic.condecimal(gt=0, decimal_places=2) = pydantic.Field(example=1)
    width: pydantic.condecimal(gt=0, decimal_places=2) = pydantic.Field(example=1)
    height: Optional[pydantic.condecimal(gt=0, decimal_places=2)] = pydantic.Field(example=1)
    price_per_hour: pydantic.condecimal(ge=0, decimal_places=2) = pydantic.Field(example=1)
    address: str = pydantic.Field(example="30/199 Lordes St, Darlinghurst NSW 2010")
    images: List[bytes]

class CarSpaceListing(CreateCarSpaceListing):
    id: int
    owner_id: int
    title: str
    length: pydantic.condecimal(gt=0, decimal_places=2) = pydantic.Field(example=1)
    width: pydantic.condecimal(gt=0, decimal_places=2) = pydantic.Field(example=1)
    height: Optional[pydantic.condecimal(gt=0, decimal_places=2)] = pydantic.Field(example=1)
    price_per_hour: pydantic.condecimal(ge=0, decimal_places=2) = pydantic.Field(example=1)
    address: str = pydantic.Field(example="30/199 Lordes St, Darlinghurst NSW 2010")
    images: List[Image]
    availabilities: List[Availability]
    
    class Config:
        orm_mode = True

class CarSpaceListingInclReview(CarSpaceListing):
    reviews: review_schemas.AggregateReviews




