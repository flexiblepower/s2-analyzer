import asyncio
from typing import TYPE_CHECKING
import logging
from s2_analyzer_backend.envelope import Envelope
from s2_analyzer_backend.connection import ConnectionType, ModelConnection
from s2_analyzer_backend.model import ConnectionClosedReason
from s2_analyzer_backend.globals import BUILDERS

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection
    from s2_analyzer_backend.envelope import S2Message
    from s2_analyzer_backend.s2_json_schema_validator import S2JsonSchemaValidator
    from s2_analyzer_backend.model import ModelRegistry


LOGGER = logging.getLogger(__name__)


class MessageRouter:
    connections: dict[tuple[str, str], "Connection"]
    s2_validator: "S2JsonSchemaValidator"
    model_registry: "ModelRegistry"
    _buffer_queue_by_origin_dest_id: dict[tuple[str, str], asyncio.Queue]

    def __init__(self, s2_validator: "S2JsonSchemaValidator", model_registry: "ModelRegistry") -> None:
        self.connections = {}
        self.s2_validator = s2_validator
        self.model_registry = model_registry
        self._buffer_queue_by_origin_dest_id = {}

    def _get_buffer_queue(self, origin_id: str, dest_id: str) -> asyncio.Queue:
        return self._buffer_queue_by_origin_dest_id.setdefault((origin_id, dest_id), asyncio.Queue())

    def _consume_buffer_queue(self, origin_id: str, dest_id: str) -> list[Envelope]:
        buffer_queue = self._get_buffer_queue(origin_id, dest_id)
        del self._buffer_queue_by_origin_dest_id[(origin_id, dest_id)]

        buffered_messages = []
        while not buffer_queue.empty():
            buffered_messages.append(buffer_queue.get_nowait())

        return buffered_messages

    def get_reverse_connection(self, origin_id: str, dest_id: str) -> "Connection | None":
        return self.connections.get((dest_id, origin_id))

    async def route_s2_message(self, origin: "Connection", s2_msg: "S2Message") -> None:

        # Find destination
        dest_id = origin.dest_id
        dest = self.get_reverse_connection(origin.origin_id, origin.dest_id)

        # Determine msg type
        message_type = self.s2_validator.get_message_type(s2_msg)
        if message_type is None:
            raise ValueError('Unknown message type')

        # Validate msg
        validation_error = self.s2_validator.validate(s2_msg, message_type)
        if validation_error is None:
            LOGGER.debug('%s send valid message: %s', origin.origin_id, s2_msg)
        else:
            LOGGER.warning('%s send invalid message: %s\n Error: %s', origin.origin_id, s2_msg, validation_error)

        # Assemble envelope
        envelope = Envelope(origin, dest, message_type, s2_msg, validation_error)

        # Buffer or Route
        if dest is None:
            # LOGGER.error("Destination connection is unavailable: %s", dest_id)
            LOGGER.error("Connection %s->%s is unavailable. Buffering message.", dest_id, origin.origin_id)
            queue = self._get_buffer_queue(dest_id, origin.origin_id)
            await queue.put(envelope)
        else:
            await self.route_envelope(envelope)

    async def route_envelope(self, envelope: Envelope) -> None:
        conn = envelope.dest

        if conn is None:
            raise ValueError('Destination connection is unavailable. This envelope should not be routed.')

        dest_type = conn.get_connection_type()

        if dest_type == ConnectionType.WEBSOCKET or dest_type == ConnectionType.MODEL:
            LOGGER.debug("Envelope is forwarded to %s: %s", conn, envelope)
            await conn.receive_envelope(envelope)
        else:
            raise RuntimeError("Connection type not recognized.")

    async def receive_new_connection(self, conn: "Connection") -> None:
        self.connections[(conn.origin_id, conn.dest_id)] = conn
        buffered_messages = self._consume_buffer_queue(conn.origin_id, conn.dest_id)

        if buffered_messages:
            LOGGER.info('[%s] connection receives %s buffered messages.', conn, len(buffered_messages))

        for message in buffered_messages:
            await conn.receive_envelope(message)

        model = self.model_registry.lookup_by_id(conn.dest_id)
        if model:
            model_conn = await BUILDERS.build_model_connection(conn.dest_id, conn.origin_id, conn.s2_origin_type.reverse(), self, model)
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
