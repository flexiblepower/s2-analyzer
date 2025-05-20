from datetime import datetime
import uuid

from pydantic import BaseModel

from s2python.message import S2Message
from s2_analyzer_backend.device_connection.origin_type import S2OriginType


class MessageValidationDetails(BaseModel):
    msg: str
    errors: list[dict] | None


class Message(BaseModel):
    session_id: uuid.UUID
    cem_id: str
    rm_id: str
    origin: S2OriginType
    msg: dict
    s2_msg: S2Message | None
    s2_msg_type: str | None
    s2_validation_error: MessageValidationDetails | None
    timestamp: datetime | None
