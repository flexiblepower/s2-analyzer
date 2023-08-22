from typing import TYPE_CHECKING
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
import threading
from fastapi import WebSocketException, WebSocketDisconnect
from websockets.exceptions import ConnectionClosedOK
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.async_selectable import AsyncSelectable
from s2_analyzer_backend.reception_status_awaiter import ReceptionStatusAwaiter

if TYPE_CHECKING:
    from fastapi import WebSocket
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.envelope import Envelope, S2Message
    from s2_analyzer_backend.model import Model
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.async_application import ApplicationName
    from s2_analyzer_backend.history import MessageHistory


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
    msg_history: 'MessageHistory'

    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', msg_history: 'MessageHistory'):
        super().__init__()
        self.origin_id = origin_id
        self.dest_id = dest_id
        self.s2_origin_type = origin_type
        self.msg_router = msg_router
        self.msg_history = msg_history
        self._queue = asyncio.Queue()

    @abstractmethod
    def get_connection_type(self):
        return ConnectionType(type(self))

    @property
    def destination_type(self):
        return self.s2_origin_type.reverse()

    async def receive_envelope(self, envelope: "Envelope") -> None:
        await self._queue.put(envelope)

    def get_name(self) -> 'ApplicationName':
        return str(self)

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if self._main_task and not self._main_task.done() and not self._main_task.cancelled():
            LOGGER.info('Stopping connection from %s to %s', self.origin_id, self.dest_id)
            self._main_task.cancel('Request to stop')
        else:
            LOGGER.warning('Connection %s was already stopped!', self)


class WebSocketConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', msg_history: 'MessageHistory', websocket: 'WebSocket'):
        super().__init__(origin_id, dest_id, origin_type, msg_router, msg_history)
        self.websocket = websocket

    def __str__(self):
        return f'Websocket connection {self.origin_id}->{self.dest_id}'

    def get_connection_type(self):
        return ConnectionType.WEBSOCKET

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        try:
            async with asyncio.TaskGroup() as task_group:
                task_group.create_task(self.receiver())
                task_group.create_task(self.sender())
        except ExceptionGroup as exc_group:
            for exc in exc_group.exceptions:
                if isinstance(exc, WebSocketDisconnect):
                    threading.Thread(target=APPLICATIONS.stop_and_remove_application, args=(self,)).start()
                    #loop.run_in_executor(None, APPLICATIONS.stop_and_remove_application, self)
                    self.msg_router.connection_has_closed(self)
                    LOGGER.info('%s %s disconnected.',
                                self.s2_origin_type.name,
                                self.origin_id)
                else:
                    raise exc from exc_group

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.websocket.receive_text()
                LOGGER.debug('%s received message across websocket to %s: %s', self.origin_id, self.dest_id, message_str)
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
            except WebSocketException:
                LOGGER.exception('Connection to %s %s had an exception while receiving.',
                                self.s2_origin_type.name, self.origin_id)
            except json.JSONDecodeError:
                LOGGER.exception('Error decoding message: %s', message_str)

    async def sender(self) -> None:
        while self._running:
            envelope = await self._queue.get()

            try:
                LOGGER.debug('%s sent message across websocket to %s: %s', self.dest_id, self.origin_id, envelope)
                await self.websocket.send_text(json.dumps(envelope.msg))
                self._queue.task_done()
            except ConnectionClosedOK:
                LOGGER.warning('Could not send envelope to %s %s as connection was already closed.',
                            self.s2_origin_type.name, self.origin_id)
            except WebSocketException:
                LOGGER.exception('Connection to %s %s had an exception while sending.',
                                self.s2_origin_type.name, self.origin_id)


class ModelConnection(Connection, AsyncSelectable['Envelope']):
    model: 'Model'
    reception_status_messages: asyncio.Queue['Envelope']
    reception_status_awaiter: ReceptionStatusAwaiter

    def __init__(self,
                 origin_id: str,
                 dest_id: str,
                 origin_type: 'S2OriginType',
                 msg_router: 'MessageRouter',
                 msg_history: 'MessageHistory',
                 model: 'Model'):
        super().__init__(origin_id, dest_id, origin_type, msg_router, msg_history)
        self.model = model
        self.s2_messages = asyncio.Queue()
        self.reception_status_awaiter = ReceptionStatusAwaiter()

    def __str__(self):
        return f'Model connection {self.origin_id}->{self.dest_id}'

    def get_connection_type(self):
        return ConnectionType.MODEL

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        while self._running:
            await self.route_reception_status_messages()

    async def route_reception_status_messages(self) -> None:
        envelope = await self._queue.get()

        if envelope.msg_type == 'ReceptionStatus':
            LOGGER.debug('Received reception status for %s from %s for device %s which is forwarded to awaiter',
                         envelope.msg["subject_message_id"],
                         envelope.origin,
                         envelope.dest)
            await self.reception_status_awaiter.receive_reception_status(envelope.msg)
        else:
            LOGGER.debug('[%s] Envelope %s is not a reception status so forwarded to s2 messages queue to be retrieved '
                         'by model',
                         self,
                         envelope)
            await self.s2_messages.put(envelope)
        self._queue.task_done()

    async def retrieve_next_envelope(self) -> 'Envelope':
        return await self.s2_messages.get()

    async def send_and_await_reception_status(self, s2_message: 'S2Message') -> 'S2Message':
        return await self.reception_status_awaiter.send_and_await_reception_status(self,
                                                                                   s2_message,
                                                                                   self.msg_router,
                                                                                   True)

    async def send_and_forget(self, s2_message: 'S2Message') -> None:
        await self.msg_router.route_s2_message(self, s2_message)

    async def select_task(self) -> 'Envelope':
        envelope = await self.retrieve_next_envelope()
        self.s2_messages.task_done()
        return envelope


class ConnectionType(Enum):
    WEBSOCKET = 'WebSocketConnection'
    MODEL = 'ModelConnection'
