import abc
import asyncio
from typing import TYPE_CHECKING
import logging
from enum import Enum
from s2_analyzer_backend.async_application import AsyncApplication

if TYPE_CHECKING:
    from s2_analyzer_backend.envelope import Envelope
    from s2_analyzer_backend.connection import ModelConnection
    from s2_analyzer_backend.async_application import ApplicationName
    from s2_analyzer_backend.router import MessageRouter

LOGGER = logging.getLogger(__name__)


class ConnectionClosedReason(Enum):
    DISCONNECT = 'disconnect'
    TIMEOUT = 'timeout'


class Model(AsyncApplication):
    model_id: str
    msg_router: "MessageRouter"
    _running: bool
    _task: asyncio.Task

    def __init__(self, model_id: str, msg_router: "MessageRouter") -> None:
        super().__init__()
        self.model_id = model_id
        self.msg_router = msg_router
        self._running = False

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        self._running = True
        self._task = loop.create_task(self.entry())
        try:
            await self._task
        except asyncio.exceptions.CancelledError as e:
            LOGGER.info('Shutdown %s.', self.get_name())
            raise e

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._task.cancel('Request to stop')
        self._running = False

    def get_name(self) -> "ApplicationName":
        return self.model_id

    @abc.abstractmethod
    async def entry(self) -> None:
        pass

    @abc.abstractmethod
    async def receive_envelope(self, envelope: "Envelope") -> None:
        pass

    @abc.abstractmethod
    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        pass

    @abc.abstractmethod
    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        pass


class DummyModel(Model):
    _connections: "list[ModelConnection]"

    def __init__(self, model_id: str, msg_router: "MessageRouter") -> None:
        super().__init__(model_id, msg_router)
        self._connections = []

    async def entry(self) -> None:
        while self._running:
            await asyncio.sleep(1)
            for connection in self._connections:
                # await self.msg_router.route_s2_message(c, f"Hi {c.dest_id}, this is {c.origin_id}!")
                await self.msg_router.route_s2_message(connection, {"message_type": "FRBC.ActuatorStatus",
                                                                    "message_id": "1234",
                                                                    "active_operation_mode_id": "1234",
                                                                    "operation_mode_factor": 0.5,
                                                                    "previous_operation_mode_id": "4321"})

    async def receive_envelope(self, envelope: "Envelope") -> None:
        print("Model %s received following envelope: %s", self.model_id, envelope)

    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        LOGGER.info("Model %s: received connection from %s.", self.model_id, new_connection.dest_id)
        self._connections.append(new_connection)

    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        LOGGER.info("Model %s: connection with %s has closed.", self.model_id, closed_connection.dest_id)
        self._connections.remove(closed_connection)


class ModelRegistry:
    def __init__(self) -> None:
        self.models: list[Model] = []

    def add_model(self, model: Model) -> None:
        self.models.append(model)

    def remove_model(self, model: Model) -> None:
        self.models.remove(model)

    def lookup_by_id(self, model_id: str) -> 'Model|None':
        for model in self.models:
            if model.model_id == model_id:
                return model
        return None
