import datetime as _datetime
import sqlalchemy as sql
import sqlalchemy.orm as orm
from sqlalchemy.dialects import postgresql
from app.database import database
import enum
from app.schemas import puzzle_schemas, badge_schemas

class Role(int, enum.Enum):
    USER = 1
    ADMIN = 2

class User(database.Base):
    __tablename__ = "users"
    id = sql.Column(sql.Integer, primary_key=True)
    first_name = sql.Column(sql.String, nullable=False)
    last_name = sql.Column(sql.String, nullable=False)
    email = sql.Column(sql.String, unique=True, nullable=False)
    date_created = sql.Column(sql.DateTime, default=_datetime.datetime.utcnow, nullable=False)
    password = sql.Column(sql.String, nullable=False)
    role = sql.Column(sql.Enum(Role), nullable=False)
    profile_picture = sql.Column(sql.LargeBinary)
    bank_account_id = sql.Column(sql.Integer, sql.ForeignKey("bank_accounts.id"), nullable=True)

    listings = orm.relationship("Listing", back_populates="owner", cascade="all, delete-orphan")
    bookings = orm.relationship("Booking", back_populates="user", cascade="all, delete-orphan")
    reviews = orm.relationship("Review", back_populates="user", cascade="all, delete-orphan")
    bank_account = orm.relationship("BankAccount", back_populates="provider", cascade="all, delete-orphan", single_parent=True)
    puzzle_submissions = orm.relationship("PuzzleSubmission", back_populates="user", cascade="all, delete-orphan")

class Listing(database.Base):
    __tablename__ = "listings"
    id = sql.Column(sql.Integer, primary_key=True)
    owner_id = sql.Column(sql.Integer, sql.ForeignKey("users.id"), nullable=False)
    title = sql.Column(sql.String, nullable=False)
    length = sql.Column(sql.Float(asdecimal=True, decimal_return_scale=2), nullable=False)
    width = sql.Column(sql.Float(asdecimal=True, decimal_return_scale=2), nullable=False)
    height = sql.Column(sql.Float(asdecimal=True, decimal_return_scale=2))
    price_per_hour = sql.Column(sql.Float(asdecimal=True, decimal_return_scale=2), nullable=False)
    address = sql.Column(sql.String, nullable=False)

    owner = orm.relationship("User", back_populates="listings")
    images = orm.relationship("Image", back_populates="listing", cascade="all, delete-orphan")
    availabilities = orm.relationship("Availability", back_populates="listing", cascade="all, delete-orphan")
    bookings = orm.relationship("Booking", back_populates="listing")
    reviews = orm.relationship("Review", back_populates="listing", cascade="all, delete-orphan")

class Image(database.Base):
    __tablename__ = "images"
    id = sql.Column(sql.Integer, primary_key=True)
    listing_id = sql.Column(sql.Integer, sql.ForeignKey("listings.id"), nullable=False)
    data = sql.Column(sql.LargeBinary, nullable=False)

    listing = orm.relationship("Listing", back_populates="images")

class Availability(database.Base):
    __tablename__ = "availabilities"
    id = sql.Column(sql.Integer, primary_key=True)
    listing_id = sql.Column(sql.Integer, sql.ForeignKey("listings.id"), nullable=False)
    start_date = sql.Column(sql.BigInteger, nullable=False)
    end_date = sql.Column(sql.BigInteger)
    start_time = sql.Column(sql.BigInteger, nullable=False)
    end_time = sql.Column(sql.BigInteger, nullable=False)

    listing = orm.relationship("Listing", back_populates="availabilities")

class Booking(database.Base):
    __tablename__ = "bookings"
    id = sql.Column(sql.Integer, primary_key=True)
    user_id = sql.Column(sql.Integer, sql.ForeignKey("users.id"), nullable=False)
    listing_id = sql.Column(sql.Integer, sql.ForeignKey("listings.id", ondelete='SET NULL'))
    date = sql.Column(sql.BigInteger, nullable=False)
    start_time = sql.Column(sql.BigInteger, nullable=False)
    end_time = sql.Column(sql.BigInteger, nullable=False)
    price = sql.Column(sql.Float(asdecimal=True, decimal_return_scale=2), nullable=False)

    user = orm.relationship("User", back_populates="bookings")
    listing = orm.relationship("Listing", back_populates="bookings")

class Review(database.Base):
    __tablename__ = "reviews"
    id = sql.Column(sql.Integer, primary_key=True)
    user_id = sql.Column(sql.Integer, sql.ForeignKey("users.id"), nullable=False)
    listing_id = sql.Column(sql.Integer, sql.ForeignKey("listings.id"), nullable=False)
    rating = sql.Column(sql.SmallInteger, nullable=False)
    review = sql.Column(sql.String)
    anonymous = sql.Column(sql.Boolean)

    user = orm.relationship("User", back_populates="reviews")
    listing = orm.relationship("Listing", back_populates="reviews")

class BankAccount(database.Base):
    __tablename__ = "bank_accounts"
    id = sql.Column(sql.Integer, primary_key=True)
    bsb = sql.Column(sql.String)
    account_number = sql.Column(sql.String)
    balance = sql.Column(sql.Float(asdecimal=True, decimal_return_scale=2), default=0)

    provider = orm.relationship("User", back_populates="bank_account")

class Puzzle(database.Base):
    __tablename__ = "puzzles"
    id = sql.Column(sql.Integer, primary_key=True)
    date = sql.Column(sql.BigInteger, nullable=False, unique=True, index=True)
    puzzle = sql.Column(postgresql.ARRAY(sql.INTEGER, dimensions=2), nullable=False)
    solution = sql.Column(postgresql.ARRAY(sql.INTEGER, dimensions=2), nullable=False)
    difficulty = sql.Column(sql.Enum(puzzle_schemas.PuzzleDifficulty), nullable=False)

    submissions = orm.relationship("PuzzleSubmission", back_populates="puzzle", cascade="all, delete-orphan")

class PuzzleSubmission(database.Base):
    __tablename__ = "puzzle_submissions"
    id = sql.Column(sql.Integer, primary_key=True)
    user_id = sql.Column(sql.Integer, sql.ForeignKey("users.id"), nullable=False)
    puzzle_id = sql.Column(sql.Integer, sql.ForeignKey("puzzles.id"), nullable=False)
    submission = sql.Column(postgresql.ARRAY(sql.INTEGER, dimensions=2), nullable=False)
    completion_date = sql.Column(sql.BigInteger)

    puzzle = orm.relationship("Puzzle", back_populates="submissions")
    user = orm.relationship("User", back_populates="puzzle_submissions")

class Badge(database.Base):
    __tablename__ = "badge"
    id = sql.Column(sql.Integer, primary_key=True)
    type_id = sql.Column(sql.Enum(badge_schemas.BadgeType), nullable=False)
    owner_id = sql.Column(sql.Integer, sql.ForeignKey("users.id"), nullable=False)
    date = sql.Column(sql.BigInteger, nullable=False)
