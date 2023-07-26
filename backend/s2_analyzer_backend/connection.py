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
    _running: bool

    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter'):
        super().__init__()
        self.origin_id = origin_id
        self.dest_id = dest_id
        self.s2_origin_type = origin_type
        self.msg_router = msg_router
        self._queue = msg_router.get_queue(origin_id)
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

    def get_name(self) -> 'ApplicationName':
        return f"Connection from {self.origin_id} to {self.dest_id}"

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if self._main_task:
            LOGGER.info('Stopping connection from %s to %s', self.origin_id, self.dest_id)
            self._main_task.cancel('Request to stop')


class WebSocketConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', websocket: 'WebSocket'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.websocket = websocket

    def get_connection_type(self):
        return ConnectionType.WEBSOCKET
    
    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        try:
            async with asyncio.TaskGroup() as tg:
                tg.create_task(self.receiver())
                tg.create_task(self.sender())
            #await asyncio.gather(self.receiver(), self.sender(), return_exceptions=True)
        except WebSocketDisconnect:
            print('WEBSOCKET DISCONNECT DID BUBBLE UP!')
            threading.Thread(target=APPLICATIONS.stop_and_remove_application,args=(self,)).start()
            self.msg_router.connection_has_closed(self)
            LOGGER.info('%s %s disconnected.',
                        self.s2_origin_type.name,
                        self.origin_id)
        except Exception as e:
            print('CONNECTION MAIN TASK EXCEPTION')
            import traceback
            traceback.print_exception(e)
            raise e

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                print('BEFORE READ')
                message_str = await self.websocket.receive_text()
                print('AFTER READ')
                LOGGER.debug('%s sent the message: %s', self.origin_id, message_str)
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
                print('AFTER ROUTE READ')
            except WebSocketException:
                LOGGER.exception('Connection to %s %s had an exception while receiving.',
                                self.s2_origin_type.name, self.origin_id)
            except json.JSONDecodeError:
                LOGGER.exception('Error decoding message: %s', message_str)
            except Exception as e:
                print('SOMETHING HAPPENED ON CONNECTION', self, e)
                import traceback
                traceback.print_exception(e)
                raise e

    async def sender(self) -> None:
        while self._running:
            LOGGER.debug("START OF SENDING LOOP")
            envelope = await self._queue.get()

            try:
                print('SENDING ENVELOPE', envelope)
                await self.websocket.send_text(json.dumps(envelope.msg))
                print('AFTER SEND')
                self._queue.task_done()
            except ConnectionClosedOK:
                LOGGER.warning('Could not send envelope to %s %s as connection was already closed.',
                            self.s2_origin_type.name, self.origin_id)
            except WebSocketException:
                LOGGER.exception('Connection to %s %s had an exception while sending.',
                                self.s2_origin_type.name, self.origin_id)
            LOGGER.debug("END OF SENDING LOOP")
        LOGGER.debug("TERMINATED SENDING LOOP")


class ModelConnection(Connection, AsyncSelectable['Envelope']):
    model: 'Model'
    reception_status_messages: asyncio.Queue['Envelope']
    reception_status_awaiter: ReceptionStatusAwaiter

    def __init__(self,
                 origin_id: str,
                 dest_id: str,
                 origin_type: 'S2OriginType',
                 msg_router: 'MessageRouter',
                 model: 'Model'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.model = model
        self.s2_messages = asyncio.Queue()
        self.reception_status_awaiter = ReceptionStatusAwaiter()

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
            LOGGER.debug('Envelope %s is not a reception status so forwarded to s2 messages queue to be retrieved by '
                         'model',
                         envelope)
            await self.s2_messages.put(envelope)

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
        return await self.retrieve_next_envelope()


class ConnectionType(Enum):
    WEBSOCKET = 'WebSocketConnection'
    MODEL = 'ModelConnection'
