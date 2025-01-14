import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING
from uuid import uuid1

from s2python.s2_validation_error import S2ValidationError

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection

@dataclass
class Envelope:
    """
    Sent between CEM and RM, contains message and metadata for routing to destination.
    """

    envelope_id: uuid.UUID
    origin: "Connection"
    dest: "Connection | None"
    msg: dict

    def __init__(
        self,
        origin: "Connection",
        dest: "Connection | None",
        msg: dict,
    ) -> None:
        self.envelope_id = uuid1()
        self.origin = origin
        self.dest = dest
        self.msg = msg
