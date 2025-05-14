import asyncio
from datetime import datetime
from typing import TYPE_CHECKING
import logging

from s2python.s2_parser import S2Parser

from s2_analyzer_backend.device_connection.origin_type import S2OriginType
from s2_analyzer_backend.message_processor.message_processor import (
    Message,
    MessageProcessorHandler,
)
from s2_analyzer_backend.device_connection.envelope import Envelope

if TYPE_CHECKING:
    from s2_analyzer_backend.device_connection.connection import Connection


LOGGER = logging.getLogger(__name__)


class MessageRouter:
    """Routes messages received from a CEM or RM device to the destination
    device based on the connection information."""

    connections: dict[tuple[str, str], "Connection"]
    _buffer_queue_by_origin_dest_id: dict[tuple[str, str], asyncio.Queue]

    def __init__(self, msg_processor_handler: MessageProcessorHandler) -> None:
        self.connections = {}
        self._buffer_queue_by_origin_dest_id = {}
        
        # Dependency injection of message processor handler
        self._msg_processor_handler = msg_processor_handler

    def _get_buffer_queue(self, origin_id: str, dest_id: str) -> asyncio.Queue:
        return self._buffer_queue_by_origin_dest_id.setdefault(
            (origin_id, dest_id), asyncio.Queue()
        )

    def _consume_buffer_queue(self, origin_id: str, dest_id: str) -> list[Envelope]:
        buffer_queue = self._get_buffer_queue(origin_id, dest_id)
        del self._buffer_queue_by_origin_dest_id[(origin_id, dest_id)]

        buffered_messages = []
        while not buffer_queue.empty():
            buffered_messages.append(buffer_queue.get_nowait())
            buffer_queue.task_done()

        return buffered_messages

    def get_reverse_connection(
        self, origin_id: str, dest_id: str
    ) -> "Connection | None":
        return self.connections.get((dest_id, origin_id))

    async def route_s2_message(self, origin: "Connection", s2_json_msg: dict) -> None:
        """Performs the routing of the message. Also passes the received message to the
        MessageProcessorHandler so that the processing pipeline can be executed on the message."""

        # Find destination
        dest_id = origin.dest_id
        dest = self.get_reverse_connection(origin.origin_id, origin.dest_id)

        # Prepare the message to be processed
        message = Message(
            cem_id=origin.origin_id if origin.s2_origin_type.is_cem() else dest_id,
            rm_id=origin.origin_id if origin.s2_origin_type.is_rm() else dest_id,
            origin=origin.s2_origin_type,
            msg=s2_json_msg,
            s2_msg=None,
            s2_msg_type=None,
            s2_validation_error=None,
            timestamp=datetime.now(),
        )

        # Add the message to the processor handler's queue so that it can be processed when possible.
        self._msg_processor_handler.add_message_to_process(message)

        # Prepare envelope to forward message to destination
        envelope = Envelope(origin, dest, s2_json_msg)

        # Send message to destination.
        # If the receiving connection is not yet open, then buffer the message so it can be sent when the device connects.
        # IF the receiving connection is open then send the message.
        if dest is None:
            LOGGER.error(
                "Connection %s->%s is unavailable. Buffering message.",
                dest_id,
                origin.origin_id,
            )
            queue = self._get_buffer_queue(dest_id, origin.origin_id)
            await queue.put(envelope)
        else:
            await self.route_envelope(envelope)

    async def _forward_envelope_to_connect(
        self, envelope: Envelope, conn: "Connection"
    ) -> None:
        LOGGER.debug("Envelope is forwarded to %s: %s", conn, envelope)
        await conn.receive_envelope(envelope)

    async def route_envelope(self, envelope: Envelope) -> None:
        conn = envelope.dest

        if conn is None:
            raise ValueError(
                "Destination connection is unavailable. This envelope should not be routed."
            )

        await self._forward_envelope_to_connect(envelope, conn)

    async def receive_new_connection(self, conn: "Connection") -> None:
        """Stores a new connection in the lookup table to be used for routing messages."""
        self.connections[(conn.origin_id, conn.dest_id)] = conn

        buffered_messages = self._consume_buffer_queue(conn.origin_id, conn.dest_id)

        if buffered_messages:
            LOGGER.info(
                "[%s] connection receives %s buffered messages.",
                conn,
                len(buffered_messages),
            )

        for message in buffered_messages:
            await self._forward_envelope_to_connect(message, conn)

    def connection_has_closed(self, conn: "Connection") -> None:
        del self.connections[(conn.origin_id, conn.dest_id)]

    async def inject_message(self, origin_id, dest_id, message: dict):
        """Injects a message into the communication between two devices. At least one of the devices must be connected for this to work."""
        origin = self.connections.get((origin_id, dest_id))

        await self.route_s2_message(origin, message)
