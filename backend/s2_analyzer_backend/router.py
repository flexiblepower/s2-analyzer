from typing import TYPE_CHECKING
import logging
from s2_analyzer_backend.envelope import Envelope
from s2_analyzer_backend.connection import ConnectionType, ModelConnection
from s2_analyzer_backend.model import ConnectionClosedReason

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection
    from s2_analyzer_backend.envelope import S2Message
    from s2_analyzer_backend.s2_json_schema_validator import S2JsonSchemaValidator
    from s2_analyzer_backend.model import ModelRegistry


LOGGER = logging.getLogger(__name__)


class MessageRouter():

    def __init__(self, s2_validator: "S2JsonSchemaValidator", model_registry: "ModelRegistry") -> None:
        self.connections: dict[tuple[str, str], "Connection"] = {}
        self.s2_validator = s2_validator
        self.model_registry: ModelRegistry = model_registry

    def get_reverse_connection(self, origin_id: str, dest_id: str) -> "Connection | None":
        return self.connections.get((dest_id, origin_id))

    async def route_s2_message(self, origin: "Connection", s2_msg: "S2Message") -> bool:
        dest_id = origin.dest_id
        dest = self.get_reverse_connection(origin.origin_id, origin.dest_id)
        if dest is None:
            LOGGER.error("Destination connection is unavailable: %s", dest_id)
            return False
        message_type = self.s2_validator.get_message_type(s2_msg)
        if message_type is None:
            raise ValueError('Unknown message type')
        envelope = Envelope(origin, dest, message_type, s2_msg)
        # Add a destination_type
        await self.route_envelope(envelope)
        return True

    async def route_envelope(self, envelope: Envelope) -> bool:

        validation_error = self.s2_validator.validate(envelope.msg, envelope.msg_type)
        if validation_error is None:
            LOGGER.debug('%s send valid message: %s', envelope.origin.origin_id, envelope.msg)
        else:
            LOGGER.warning('%s send invalid message: %s\n Error: %s', envelope.origin.origin_id, envelope.msg, validation_error)

        conn = envelope.dest

        dest_type = conn.get_connection_type()

        if dest_type == ConnectionType.WEBSOCKET:
            return await conn.send_envelope(envelope)
        if dest_type == ConnectionType.MODEL:
            envelope.val = validation_error
            return await conn.send_envelope(envelope)
        raise RuntimeError("Connection type not recognized.")

    def receive_new_connection(self, conn: "Connection") -> None:
        self.connections[(conn.origin_id, conn.dest_id)] = conn

        model = self.model_registry.lookup_by_id(conn.dest_id)
        if model:
            model_conn = ModelConnection(conn.dest_id, conn.origin_id, conn.s2_origin_type.reverse(), self, model)
            self.connections[(model_conn.origin_id, model_conn.dest_id)] = model_conn
            model.receive_new_connection(model_conn)

    def connection_has_closed(self, conn: "Connection") -> None:
        del self.connections[(conn.origin_id, conn.dest_id)]

        model = self.model_registry.lookup_by_id(conn.dest_id)
        if model:
            model_conn = self.get_reverse_connection(conn.origin_id, conn.dest_id)
            if isinstance(model_conn, ModelConnection):
                model.connection_has_closed(model_conn, ConnectionClosedReason.DISCONNECT)
            else:
                raise ValueError("Unexpected destination connection type")
