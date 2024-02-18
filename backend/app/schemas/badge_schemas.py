import pydantic
from typing import List
import enum

class BadgeType(int, enum.Enum):
    #Provider
    Create_a_listing = 1
    Add_a_youtube_thumbnail = 2
    Add_extra_photos = 3
    Set_availabilities_on_a_listing = 4

    #Consumer:
    Book_a_listing = 5
    Book_a_listing_at_least_a_week_in_advance = 6
    Leave_a_review = 7 
    Leave_a_review_with_a_comment = 8
    Leave_a_review_that_is_not_anonymous = 9 
    Leave_a_5_star_review = 10
    Solve_a_puzzle = 11
    Book_without_a_surcharge = 12 

    #Profile:
    Change_your_name = 13
    Set_your_profile_picture = 14
    Set_bank_details = 15 
    View_someone_else_profile = 16

    #Novel:
    Change_your_name_to_Haowei_The_Man_The_Myth_The_Legend = 17
    Visit_badge_route = 18
    Leave_a_review_at_1111_am = 19
    Book_a_listing_for_parking_day_15th_of_Sep = 20

class BadgeData(pydantic.BaseModel):
    type_id: BadgeType
    class Config:
        orm_mode = True
    

class Badge(pydantic.BaseModel):
    id: int 
    owner_id:int
    date: int 
    type_id : BadgeType
    class Config:
        orm_mode = True