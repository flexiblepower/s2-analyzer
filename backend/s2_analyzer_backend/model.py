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


class Model(abc.ABC, AsyncApplication):
    id: str
    msg_router: "MessageRouter"
    _running: bool

    def __init__(self, id: str, msg_router: "MessageRouter") -> None:
        super().__init__()
        self.id = id
        self.msg_router = msg_router
        self._running = False

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        self._running = True
        await self.tick()

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._running = False

    @abc.abstractmethod
    async def entry(self) -> None:
        pass

    @abc.abstractmethod
    def get_name(self) -> "ApplicationName":
        pass

    @abc.abstractmethod
    def receive_envelope(self, envelope: "Envelope") -> None:
        pass

    @abc.abstractmethod
    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        pass

    @abc.abstractmethod
    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        pass


class DummyModel(Model):
    _connections: "list[ModelConnection]"

    def __init__(self, id: str, msg_router: "MessageRouter") -> None:
        super().__init__(id, msg_router)
        self._connections = []

    async def entry(self) -> None:
        while self._running:
            await asyncio.sleep(1)
            for c in self._connections:
                #await self.msg_router.route_s2_message(c, f"Hi {c.dest_id}, this is {c.origin_id}!")
                await self.msg_router.route_s2_message(c, {"message_type": "FRBC.ActuatorStatus",
                                                           "message_id": "1234",
                                                           "active_operation_mode_id": "1234",
                                                           "operation_mode_factor": 0.5,
                                                           "previous_operation_mode_id": "4321"})

    def get_name(self) -> "ApplicationName":
        return f'Model: {self.id}'

    def receive_envelope(self, envelope: "Envelope") -> None:
        print(f"Model {self.id} received following envelope: {envelope}")

    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        LOGGER.info(f"Model {self.id}: received connection from {new_connection.dest_id}.")
        self._connections.append(new_connection)

    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        LOGGER.info(f"Model {self.id}: connection with {closed_connection.dest_id} has closed.")
        self._connections.remove(closed_connection)


class ModelRegistry:
    def __init__(self) -> None:
        self.models: list[Model] = []
    
    def add_model(self, model: Model) -> None:
        self.models.append(model)

    def remove_model(self, model: Model) -> None:
        self.models.remove(model)

    def lookup_by_id(self, id: str) -> 'Model|None':
        for m in self.models:
            if m.id == id:
                return m
        return None