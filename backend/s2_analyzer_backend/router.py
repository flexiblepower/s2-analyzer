import asyncio
import typing
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

    ##def __init__(self, s2_validator: "S2JsonSchemaValidator", model_registry: "ModelRegistry", apps: "AsyncApplications") -> None:
    def __init__(self, s2_validator: "S2JsonSchemaValidator", model_registry: "ModelRegistry") -> None:
        self.connections: dict[tuple[str, str], "Connection"] = {}
        self.s2_validator = s2_validator
        self.model_registry: ModelRegistry = model_registry
        self.background_tasks = set()
        self._queue_dict: dict[str, asyncio.Queue] = {}

    def perform_as_background_task(self, coroutine: typing.Coroutine) -> None:
        task = asyncio.create_task(coroutine)
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)

    def get_queue(self, conn_id: str) -> asyncio.Queue:
        return self._queue_dict.setdefault(conn_id, asyncio.Queue())

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
            LOGGER.error("Destination connection is unavailable: %s. Buffering message.", dest_id)
            queue = self._queue_dict.setdefault(dest_id, asyncio.Queue())
            await queue.put(envelope)
        else:
            await self.route_envelope(envelope)

    async def route_envelope(self, envelope: Envelope) -> None:
        conn = envelope.dest

        if conn is None:
            raise ValueError('Destination connection is unavailable. This envelope should not be routed.')

        dest_type = conn.get_connection_type()

        if dest_type == ConnectionType.WEBSOCKET or dest_type == ConnectionType.MODEL:
            LOGGER.debug(f"Envelope is forwarded to {conn}:  {envelope}")
            await conn.send_envelope(envelope)
        else:
            raise RuntimeError("Connection type not recognized.")

    def receive_new_connection(self, conn: "Connection") -> None:
        self.connections[(conn.origin_id, conn.dest_id)] = conn

        model = self.model_registry.lookup_by_id(conn.dest_id)
        if model:
            model_conn = BUILDERS.build_model_connection(conn.dest_id, conn.origin_id, conn.s2_origin_type.reverse(), self, model)
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
