from datetime import datetime
import enum
import uuid

from pydantic import BaseModel

from s2python.message import S2Message
from s2_analyzer_backend.message_processor.message_type import MessageType
from s2_analyzer_backend.device_connection.origin_type import S2OriginType


class MessageValidationDetails(BaseModel):
    msg: str
    errors: list[dict] | None


class Message(BaseModel):
    # The message that is passed through the message processor pipeline
    session_id: uuid.UUID
    cem_id: str
    rm_id: str

    timestamp: datetime | None = datetime.now()

    message_type: MessageType = MessageType.S2

    # S2 Message Fields
    origin: S2OriginType
    msg: dict | None = None
    s2_msg: S2Message | None = None
    s2_msg_type: str | None = None
    s2_validation_error: MessageValidationDetails | None = None
