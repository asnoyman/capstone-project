import pydantic
from typing import List, Optional

class CreateReview(pydantic.BaseModel):
    rating: int = pydantic.Field(ge=1, le=5, example=5)
    review: Optional[str]
    anonymous: bool

class Review(CreateReview):
    id: int
    user_id: int
    review: Optional[str]
    
    class Config:
        orm_mode = True

class AnonymisedReview(pydantic.BaseModel):
    id: int
    name: str # "anonymous" if anonymous
    rating: int = pydantic.Field(ge=1, le=5, example=5)
    review: Optional[str]
    class Config:
        orm_mode = True

class AggregateReviews(pydantic.BaseModel):
    aggregate_rating: pydantic.condecimal(ge=0, le=5, decimal_places=1) = pydantic.Field(example=4.3) # Rating 0 if no reviews
    reviews: List[AnonymisedReview]
