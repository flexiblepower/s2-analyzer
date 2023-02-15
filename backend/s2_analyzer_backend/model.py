from typing import TYPE_CHECKING
from enum import Enum
from s2_analyzer_backend.async_application import AsyncApplication

if TYPE_CHECKING:
    from s2_analyzer_backend.envelope import Envelope
    from s2_analyzer_backend.connection import ModelConnection


class ConnectionClosedReason(Enum):
    DISCONNECT = 'disconnect'
    TIMEOUT = 'timeout'


class Model(AsyncApplication):
    def __init__(self) -> None:
        super().__init__()

    def receive_envelope(self, envelope: "Envelope") -> None:
        print(f"The model received following envelope: {envelope}")

    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        pass

    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        pass
