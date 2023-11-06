import asyncio
from typing import TYPE_CHECKING
import logging

from s2python.s2_parser import S2Parser
from s2python.s2_validation_error import S2ValidationError

from s2_analyzer_backend.envelope import Envelope
from s2_analyzer_backend.connection import ConnectionType, ModelConnection
from s2_analyzer_backend.model import ConnectionClosedReason
from s2_analyzer_backend.globals import BUILDERS

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection
    from s2_analyzer_backend.model import ModelRegistry


LOGGER = logging.getLogger(__name__)


class MessageRouter:
    connections: dict[tuple[str, str], "Connection"]
    s2_parser: "S2Parser"
    model_registry: "ModelRegistry"
    _buffer_queue_by_origin_dest_id: dict[tuple[str, str], asyncio.Queue]

    def __init__(self, model_registry: "ModelRegistry") -> None:
        self.connections = {}
        self.s2_parser = S2Parser()
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
            buffer_queue.task_done()

        return buffered_messages

    def get_reverse_connection(self, origin_id: str, dest_id: str) -> "Connection | None":
        return self.connections.get((dest_id, origin_id))

    async def route_s2_message(self, origin: "Connection", s2_json_msg: dict) -> None:

        # Find destination
        dest_id = origin.dest_id
        dest = self.get_reverse_connection(origin.origin_id, origin.dest_id)

        # Determine msg type
        message_type = self.s2_parser.parse_message_type(s2_json_msg)
        if message_type is None:
            raise ValueError('Unknown message type')

        # Parse msg
        validation_error = None
        s2_msg = None
        try:
            s2_msg = self.s2_parser.parse_as_any_message(s2_json_msg)
        except S2ValidationError as e:
            validation_error = e
            LOGGER.warning('%s send invalid message: %s\n Error: %s', origin.origin_id, s2_msg, validation_error)
            origin.msg_history.receive_line(f"[Message validation not successful][Sender: {origin.s2_origin_type.value} {origin.origin_id}][Receiver: {origin.destination_type.value} {origin.dest_id}] Message: {str(s2_json_msg)} Issue:\n{str(validation_error)}")
        else:
            LOGGER.debug('%s send valid message: %s', origin.origin_id, s2_msg)

        # Assemble envelope
        envelope = Envelope(origin, dest, message_type, s2_json_msg, validation_error)

        # Buffer or Route
        if dest is None:
            # LOGGER.error("Destination connection is unavailable: %s", dest_id)
            LOGGER.error("Connection %s->%s is unavailable. Buffering message.", dest_id, origin.origin_id)
            queue = self._get_buffer_queue(dest_id, origin.origin_id)
            await queue.put(envelope)
            origin.msg_history.receive_line(f"[Message buffered][Sender: {origin.s2_origin_type.value} {origin.origin_id}][Receiver: {origin.destination_type.value} {origin.dest_id}] Message: {str(s2_json_msg)}")
        else:
            await self.route_envelope(envelope)

    async def _forward_envelope_to_connect(self, envelope: Envelope, conn: "Connection") -> None:
        LOGGER.debug("Envelope is forwarded to %s: %s", conn, envelope)
        conn.msg_history.receive_line(f"[Message forwarded][Sender: {conn.s2_origin_type.value} {conn.origin_id}][Receiver: {conn.destination_type.value} {conn.dest_id}] Message: {str(envelope.msg)}")
        await conn.receive_envelope(envelope)

    async def route_envelope(self, envelope: Envelope) -> None:
        conn = envelope.dest

        if conn is None:
            raise ValueError('Destination connection is unavailable. This envelope should not be routed.')

        dest_type = conn.get_connection_type()

        if dest_type == ConnectionType.WEBSOCKET or dest_type == ConnectionType.MODEL:
            await self._forward_envelope_to_connect(envelope, conn)
        else:
            raise RuntimeError("Connection type not recognized.")

    async def receive_new_connection(self, conn: "Connection") -> None:
        self.connections[(conn.origin_id, conn.dest_id)] = conn
        conn.msg_history.receive_line(f"Connection initiated from '{conn.origin_id}' to S2-analyzer.")

        buffered_messages = self._consume_buffer_queue(conn.origin_id, conn.dest_id)

        if buffered_messages:
            LOGGER.info('[%s] connection receives %s buffered messages.', conn, len(buffered_messages))

        for message in buffered_messages:
            await self._forward_envelope_to_connect(message, conn)

        model = self.model_registry.lookup_by_id(conn.dest_id)
        if model:
            model_conn = await BUILDERS.build_model_connection(conn.dest_id, conn.origin_id, conn.s2_origin_type.reverse(), self, model)
            model.receive_new_connection(model_conn)

    def connection_has_closed(self, conn: "Connection") -> None:
        del self.connections[(conn.origin_id, conn.dest_id)]
        conn.msg_history.receive_line(f"Connection from '{conn.origin_id}' to S2-analyzer has closed.")

        model = self.model_registry.lookup_by_id(conn.dest_id)
        if model:
            model_conn = self.get_reverse_connection(conn.origin_id, conn.dest_id)
            if isinstance(model_conn, ModelConnection):
                model.connection_has_closed(model_conn, ConnectionClosedReason.DISCONNECT)
                del self.connections[(model_conn.origin_id, model_conn.dest_id)]
                model_conn.msg_history.receive_line(f"Connection from '{model_conn.origin_id}' to S2-analyzer has closed.")
            else:
                raise ValueError("Unexpected destination connection type")
