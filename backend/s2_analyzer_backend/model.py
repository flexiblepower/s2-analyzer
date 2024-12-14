import abc
import asyncio
from typing import TYPE_CHECKING
import logging
from enum import Enum
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_selectable import AsyncSelect

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

    def __init__(self, model_id: str, msg_router: "MessageRouter") -> None:
        super().__init__()
        self.model_id = model_id
        self.msg_router = msg_router

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._main_task.cancel('Request to stop')

    def get_name(self) -> "ApplicationName":
        return self.model_id

    @abc.abstractmethod
    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        pass

    @abc.abstractmethod
    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        pass


class DummyModel(Model):
    _connections: "list[ModelConnection]"
    _select_on_connections: AsyncSelect['Envelope']

    def __init__(self, model_id: str, msg_router: "MessageRouter") -> None:
        super().__init__(model_id, msg_router)
        self._connections = []
        self._select_on_connections = AsyncSelect(self._connections)

    '''Gordei: Random testing code commented out'''
    # async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:  
    #     await asyncio.gather(self.reply_task(), self.receive_task())

    # async def reply_task(self):
    #     while self._running:
    #         await asyncio.sleep(1)
    #         for connection in self._connections:
    #             # await connection.send_and_forget(f"Hi {connection.dest_id}, this is {connection.origin_id}!")
    #             await connection.send_and_forget({"message_type": "FRBC.ActuatorStatus",
    #                                               "message_id": "1234",
    #                                               "active_operation_mode_id": "1234",
    #                                               "operation_mode_factor": 0.5,
    #                                               "previous_operation_mode_id": "4321"})

    # async def receive_task(self):
    #     select = AsyncSelect(self._connections)
    #     while self._running:
    #         connections, _ = await select.select()
    #         for connection in connections:
    #             await self.receive_envelope(connection.retrieve_last_select_result())

    # async def receive_envelope(self, envelope: "Envelope") -> None:
    #     print("Model %s received following envelope: %s", self.model_id, envelope)

    def receive_new_connection(self, new_connection: "ModelConnection") -> None:
        LOGGER.info("Model %s: received connection from %s.", self.model_id, new_connection.dest_id)
        self._connections.append(new_connection)
        self._select_on_connections.add_selectable(new_connection)

    def connection_has_closed(self, closed_connection: "ModelConnection", reason: ConnectionClosedReason) -> None:
        LOGGER.info("Model %s: connection with %s has closed.", self.model_id, closed_connection.dest_id)
        self._connections.remove(closed_connection)
        self._select_on_connections.remove_selectable(closed_connection)


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
