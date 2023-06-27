from typing import TYPE_CHECKING
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
import threading
import typing
from fastapi import WebSocketException, WebSocketDisconnect
from websockets.exceptions import ConnectionClosedOK
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_application import APPLICATIONS

if TYPE_CHECKING:
    from fastapi import WebSocket
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.envelope import Envelope
    from s2_analyzer_backend.model import Model
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.async_application import ApplicationName


LOGGER = logging.getLogger(__name__)


class ConnectionClosedReason(Enum):
    TIMEOUT = 'timeout'
    DISCONNECT = 'disconnect'


class Connection(AsyncApplication, ABC):
    origin_id: str
    dest_id: str
    s2_origin_type: 'S2OriginType'
    msg_router: 'MessageRouter'
    _queue: 'asyncio.Queue[Envelope]'
    _task: 'None | asyncio.Task'
    _running: bool

    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter'):
        self.origin_id = origin_id
        self.dest_id = dest_id
        self.s2_origin_type = origin_type
        self.msg_router = msg_router
        self._queue = msg_router.get_queue(origin_id)
        self._running = False
        self._task = None
        self.get_old_messages()

    def get_old_messages(self):
        while not self._queue.empty():
            envelope: 'Envelope' = self._queue.get_nowait()
            envelope.dest = self

    @abstractmethod
    def get_connection_type(self):
        return ConnectionType(type(self))

    @property
    def destination_type(self):
        return self.s2_origin_type.reverse()

    async def send_envelope(self, envelope: "Envelope") -> None:
        await self._queue.put(envelope)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> typing.Coroutine:
        return self._entry()

    async def _entry(self) -> None:
        self._running = True
        await self.entry()

    @abstractmethod
    async def entry(self) -> None:
        pass

    def get_name(self) -> 'ApplicationName':
        return f"Connection from {self.origin_id} to {self.dest_id}"

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._task.cancel('Request to stop')
        self._running = False

    async def wait_till_stopped(self, timeout: 'None | float'=None) -> None:
        await asyncio.wait(self._task,
                           timeout=timeout,
                           return_when=asyncio.ALL_COMPLETED)


class WebSocketConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', websocket: 'WebSocket'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.websocket = websocket

    def get_connection_type(self):
        return ConnectionType.WEBSOCKET
    
    async def entry(self) -> None:
        try:
            await asyncio.gather(self.receiver(), self.sender())
        except WebSocketDisconnect:
            threading.Thread(target=APPLICATIONS.stop_and_remove_application,args=(self,)).start()
            self.msg_router.connection_has_closed(self)
            LOGGER.info('%s %s disconnected.',
                        self.s2_origin_type.name,
                        self.origin_id)

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.websocket.receive_text()
                LOGGER.debug('%s sent the message: %s', self.origin_id, message_str)
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
            except WebSocketException:
                LOGGER.exception('Connection to %s %s had an exception while receiving.',
                                self.s2_origin_type.name, self.origin_id)
            except json.JSONDecodeError:
                LOGGER.exception('Error decoding message: %s', message_str)

    async def sender(self) -> None:
        while self._running:
            LOGGER.debug("START OF SENDING LOOP")
            envelope = await self._queue.get()

            try:
                await self.websocket.send_text(json.dumps(envelope.msg))
                self._queue.task_done()
            except ConnectionClosedOK:
                LOGGER.warning('Could not send envelope to %s %s as connection was already closed.',
                            self.s2_origin_type.name, self.origin_id)
            except WebSocketException:
                LOGGER.exception('Connection to %s %s had an exception while sending.',
                                self.s2_origin_type.name, self.origin_id)
            LOGGER.debug("END OF SENDING LOOP")
        LOGGER.debug("TERMINATED SENDING LOOP")


class ModelConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', model: 'Model'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.model = model
        self.background_tasks = set()
    
    def perform_as_background_task(self, coroutine: typing.Coroutine) -> None:
        task = asyncio.create_task(coroutine)
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)

    def get_connection_type(self):
        return ConnectionType.MODEL
    
    async def entry(self) -> None:
        while self._running:
            await self.sender()

    async def sender(self) -> None:
        envelope: "Envelope" = await self._queue.get()
        LOGGER.debug("BEFORE RECEIVE")
        self.perform_as_background_task(self.model.receive_envelope(envelope))
        LOGGER.debug(f"RECEIVED at model connection {envelope}")


class ConnectionType(Enum):
    WEBSOCKET = 'WebSocketConnection'
    MODEL = 'ModelConnection'
