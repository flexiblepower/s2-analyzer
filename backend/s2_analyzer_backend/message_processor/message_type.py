
import enum


class MessageType(str, enum.Enum):
    S2 = "S2"

    SESSION_STARTED = "SESSION_STARTED"
    SESSION_ENDED = "SESSION_ENDED"

    MSG_INJECTED = "MSG_INJECTED"

