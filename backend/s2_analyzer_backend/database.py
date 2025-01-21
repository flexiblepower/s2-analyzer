from datetime import datetime
import json
import logging
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session
from typing import Any, Optional, Dict

from s2_analyzer_backend.async_application import LOGGER, AsyncApplication


class Communication(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    cem_id: str
    rm_id: str
    origin: str  # Adjust to match the data type of S2OriginType

    # This app doesn't need to do any filtering on the message content at the moment,
    # so there's no need to store it in it's own sparse table.
    s2_msg: Optional[str] = None

    s2_msg_type: Optional[str] = None
    timestamp: datetime

    # Relationship to S2ValidationError
    validation_error: Optional["ValidationError"] = Relationship(
        back_populates="communication"
    )

    def model_dump(self, *args, **kwargs):
        result = super().model_dump(*args, **kwargs)

        # Convert the s2_msg from a string to a dictionary
        # so that the frontend can work with it more easily
        if result.get("s2_msg") is not None:
            result["s2_msg"] = json.loads(result["s2_msg"])

        return result


class ValidationError(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    error_details: Optional[str] = None

    # Back-reference to Message
    communication_id: Optional[int] = Field(
        default=None, foreign_key="communication.id"
    )
    communication: Communication | None = Relationship(
        back_populates="validation_error"
    )


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
