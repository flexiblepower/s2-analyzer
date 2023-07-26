from typing import TYPE_CHECKING
from uuid import uuid1

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection
    from s2_analyzer_backend.s2_json_schema_validator import FormatValidationError

S2MessageType = str
S2Message = dict


class Envelope:
    def __init__(self,
                 origin: "Connection",
                 dest: "Connection",
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
