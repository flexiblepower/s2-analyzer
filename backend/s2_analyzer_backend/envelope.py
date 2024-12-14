import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING
from uuid import uuid1

from s2python.s2_validation_error import S2ValidationError

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection

S2MessageType = str
S2Message = dict

@dataclass
class Envelope:
    """
    Sent between CEM and RM, contains S2 protocol message data.
    """
    envelope_id: uuid.UUID
    origin: 'Connection'
    dest: 'Connection | None'
    msg_type: S2MessageType
    msg: S2Message
    format_validation: 'S2ValidationError | None'

    def __init__(self,
                 origin: "Connection",
                 dest: "Connection | None",
                 msg_type: S2MessageType,
                 msg: S2Message,
                 format_validation: "FormatValidationError | None" = None) -> None:
        self.envelope_id = uuid1()
        self.origin = origin
        self.dest = dest
        self.msg = msg
        self.msg_type = msg_type
        self.format_validation = format_validation

    @property
    def is_format_valid(self) -> bool:
        return self.format_validation is None
