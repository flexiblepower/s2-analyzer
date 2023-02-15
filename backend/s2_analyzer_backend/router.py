from typing import TYPE_CHECKING
import logging
from s2_analyzer_backend.envelope import Envelope
from s2_analyzer_backend.connection import ConnectionType

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection
    from s2_analyzer_backend.envelope import S2Message
    from s2_analyzer_backend.s2_json_schema_validator import S2JsonSchemaValidator


LOGGER = logging.getLogger(__name__)


class MessageRouter():

    def __init__(self, s2_validator: "S2JsonSchemaValidator") -> None:
        self.connections: dict[str, "Connection"] = {}
        self.s2_validator = s2_validator

    def get_connection_by_origin_id(self, origin_id: str) -> "Connection | None":
        return self.connections.get(origin_id)

    async def route_s2_message(self, origin: "Connection", s2_msg: "S2Message", dest: str) -> bool:
        dest_conn = self.get_connection_by_origin_id(dest)
        if dest_conn is None:
            LOGGER.error(f"Destination connection is unavailable: {dest}")
            return False
        else:
            message_type = self.s2_validator.get_message_type(s2_msg)
            envelope = Envelope(origin, dest_conn, message_type, s2_msg)
            # Add a destination_type
            await self.route_envelope(envelope)
            return True

    async def route_envelope(self, envelope: Envelope) -> bool:

        validation_error = self.s2_validator.validate(envelope.msg, envelope.msg_type)
        if validation_error is None:
            LOGGER.debug(f'{envelope.origin.origin_id} send valid message: {envelope.msg}')
        else:
            LOGGER.debug(f'{envelope.origin.origin_id} send invalid message: {envelope.msg}\nError: {validation_error}')

        conn = envelope.dest

        dest_type = conn.get_connection_type()

        if dest_type == ConnectionType.WEBSOCKET:
            return await conn.send_envelope(envelope)
        elif dest_type == ConnectionType.MODEL:
            envelope.val = validation_error
            return await conn.send_envelope(envelope)
        else:
            raise RuntimeError("Connection type not recognized.")

    def receive_new_connection(self, conn: "Connection") -> None:
        self.connections[conn.origin_id] = conn
        # TODO: Notify if model

    def connection_has_closed(self, conn: "Connection") -> None:
        del self.connections[conn.origin_id]
        # TODO: Notify if model
