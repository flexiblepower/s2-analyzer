from typing import TYPE_CHECKING
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
from fastapi import WebSocketException
from websockets.exceptions import ConnectionClosedOK
#from s2_analyzer_backend.async_application import AsyncApplication

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


#class Connection(AsyncApplication, ABC):
class Connection(ABC):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter'):
        self.origin_id = origin_id
        self.dest_id = dest_id
        self.s2_origin_type = origin_type
        self.msg_router = msg_router
        ##self._queue = msg_router.get_queue(origin_id)

    @abstractmethod
    def get_connection_type(self):
        return ConnectionType(type(self))

    @property
    def destination_type(self):
        return self.s2_origin_type.reverse()

    @abstractmethod
    async def send_envelope(self, envelope: "Envelope") -> bool:
        pass

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    def get_name(self) -> 'ApplicationName':
        return f"WS Connection from {self.origin_id} to {self.dest_id}"
        

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        #THINK: who will trigger this? same as disconnection?
        pass


class WebSocketConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', websocket: 'WebSocket'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.websocket = websocket
        #TODO send msgs in queue

    def get_connection_type(self):
        return ConnectionType.WEBSOCKET

    async def accept(self) -> None:
        try:
            await self.websocket.accept()
            LOGGER.info('Received connection from %s %s.', self.s2_origin_type.name, self.origin_id)
        except WebSocketException:
            LOGGER.exception('Connection to %s %s had an exception while accepting.',
                             self.s2_origin_type.name, self.origin_id)

    async def send_envelope(self, envelope: "Envelope") -> bool:
        try:
            ##await self._queue.put(envelope)
            #TODO send msgs in queue
            await self.websocket.send_text(json.dumps(envelope.msg))
            return True
        except ConnectionClosedOK:
            LOGGER.warning('Could not send envelope to %s %s as connection was already closed.',
                           self.s2_origin_type.name, self.origin_id)
            return False
        except WebSocketException:
            LOGGER.exception('Connection to %s %s had an exception while sending.',
                             self.s2_origin_type.name, self.origin_id)
            return False

    async def receive_msg(self):
        try:
            while True:
                message_str = await self.websocket.receive_text()
                LOGGER.debug('%s sent the message: %s', self.origin_id, message_str)
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
        except WebSocketException:
            LOGGER.exception('Connection to %s %s had an exception while receiving.',
                             self.s2_origin_type.name, self.origin_id)


class ModelConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', model: 'Model'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.model = model

    def get_connection_type(self):
        return ConnectionType.MODEL

    async def send_envelope(self, envelope: 'Envelope') -> None:
        await self.model.receive_envelope(envelope)


class ConnectionType(Enum):
    WEBSOCKET = 'WebSocketConnection'
    MODEL = 'ModelConnection'
