from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session
from typing import Optional, Dict


class Communication(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    cem_id: str
    rm_id: str
    origin: str  # Adjust to match the data type of S2OriginType
    s2_msg: Optional[str] = None
    s2_msg_type: Optional[str] = None
    timestamp : datetime

    # Relationship to S2ValidationError
    validation_error: Optional["ValidationError"] = Relationship(back_populates="communication")

class ValidationError(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    error_details: Optional[str] = None

    # Back-reference to Message
    communication_id: Optional[int] = Field(default=None, foreign_key="communication.id")
    communication : Communication | None = Relationship(back_populates="validation_error")

# Relationship Back-population
ValidationError.communication_id = Relationship(back_populates="validation_error")


# Database setup
DATABASE_URL = "sqlite:///data/database.sqlite3"  # Replace with your database URL
engine = create_engine(DATABASE_URL)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
