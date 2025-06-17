from datetime import datetime
import json
import logging
import os
import uuid
from sqlmodel import Field, Relationship, SQLModel, create_engine, Session
from typing import Any, List, Optional, Dict

from s2_analyzer_backend.message_processor.message_type import MessageType

LOGGER = logging.getLogger(__name__)


class CommunicationBase(SQLModel):
    session_id: uuid.UUID
    cem_id: str
    rm_id: str
    origin: str  # Adjust to match the data type of S2OriginType

    message_type: MessageType  # = MessageType.S2

    # This app doesn't need to do any filtering on the message content at the moment,
    # so there's no need to store it in it's own sparse table.
    s2_msg: Optional[dict] = None

    s2_msg_type: Optional[str] = None
    timestamp: datetime


class Communication(CommunicationBase, table=True):
    id: int = Field(default=None, primary_key=True)

    s2_msg: Optional[str] = None

    validation_errors: List["ValidationError"] = Relationship(
        back_populates="communication"
    )

    def model_dump(self, *args, **kwargs):
        result = super().model_dump(*args, **kwargs)

        # Convert the s2_msg from a string to a dictionary
        # so that the frontend can work with it more easily
        if result.get("s2_msg") is not None:
            result["s2_msg"] = json.loads(result["s2_msg"])

        return result


class CommunicationWithValidationErrors(CommunicationBase):
    validation_errors: List["ValidationError"]


class BaseValidationError(SQLModel):
    error_details: Optional[str] = None

    type: str
    loc: str
    msg: str


class ValidationError(BaseValidationError, table=True):
    id: int = Field(default=None, primary_key=True)

    # Back-reference to Message
    communication_id: Optional[int] = Field(
        default=None, foreign_key="communication.id"
    )
    communication: Communication | None = Relationship(
        back_populates="validation_errors"
    )


class PublicValidationError(BaseValidationError):
    id: int


# Relationship Back-population
ValidationError.communication_id = Relationship(back_populates="validation_errors")


def serialize_communication_with_validation_errors(
    comm: Communication,
) -> CommunicationWithValidationErrors:
    validation_errors = []
    try:
        validation_errors = [
            PublicValidationError(
                id=ve.id,
                error_details=ve.error_details,
                type=ve.type,
                loc=ve.loc,
                msg=ve.msg,
            )
            for ve in comm.validation_errors
        ]
    except:
        pass

    comm_with_errors = CommunicationWithValidationErrors(
        session_id=comm.session_id,
        rm_id=comm.rm_id,
        cem_id=comm.cem_id,
        origin=comm.origin,
        message_type=comm.message_type,
        s2_msg=json.loads(comm.s2_msg),
        s2_msg_type=comm.s2_msg_type,
        timestamp=comm.timestamp,
        validation_errors=validation_errors,
    )
    return comm_with_errors


DATABASE_URL = os.environ.get("DATABASE_URL", None)
# Database setup
if DATABASE_URL is None:
    file_path = os.path.abspath(os.getcwd()) + "/database.db"
    DATABASE_URL = f"sqlite:///{file_path}"  # Replace with your database URL
engine = create_engine(DATABASE_URL)


def create_db_and_tables():
    """SQLModel creates the SQLite DB and creates the tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
