from typing import TYPE_CHECKING
from abc import ABC, abstractmethod
from enum import Enum
import json
from fastapi import WebSocketException
import logging
from websockets.exceptions import ConnectionClosedOK

if TYPE_CHECKING:
    from fastapi import WebSocket
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.envelope import Envelope
    from s2_analyzer_backend.model import Model
    from s2_analyzer_backend.origin_type import S2OriginType


LOGGER = logging.getLogger(__name__)


class ConnectionClosedReason(Enum):
    TIMEOUT = 'timeout',
    DISCONNECT = 'disconnect'


class Connection(ABC):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter'):
        self.origin_id = origin_id
        self.dest_id = dest_id
        self.s2_origin_type = origin_type
        self.msg_router = msg_router

    # @abstractmethod
    def get_connection_type(self):
        return ConnectionType(type(self))

    @property
    def destination_type(self):
        return self.s2_origin_type.reverse()

    @abstractmethod
    async def send_envelope(self, envelope: "Envelope") -> bool:
        pass


class WebSocketConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', ws: 'WebSocket'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.ws = ws

    async def accept(self) -> None:
        try:
            await self.ws.accept()
            LOGGER.info(f'Received connection from {self.s2_origin_type.name} {self.origin_id}')
        except WebSocketException as e:
            LOGGER.exception(f'Connection to {self.s2_origin_type.name} {self.origin_id} had an exception:', e)

    async def send_envelope(self, envelope: "Envelope") -> bool:
        try:
            await self.ws.send_text(json.dumps(envelope.msg))
        except ConnectionClosedOK:
            LOGGER.warning(f'Could not send envelope to {self.s2_origin_type.name} {self.origin_id} as connection was '
                           f'already closed.')
        except WebSocketException as e:
            LOGGER.exception(f'Connection to {self.s2_origin_type.name} {self.origin_id} had an exception:', e)

    async def receive_msg(self):
        try:
            while True:
                message_str = await self.ws.receive_text()
                LOGGER.debug(f'{self.origin_id} sent the message: {message_str}')
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
        except WebSocketException as e:
            LOGGER.exception(f'Connection to {self.s2_origin_type.name} {self.origin_id} had an exception:', e)


class ModelConnection(Connection):
    def __init__(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', model: 'Model'):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.model = model

    async def send_envelope(self, envelope: 'Envelope') -> bool:
        await self.model.receive_envelope(envelope)


class ConnectionType(Enum):
    WEBSOCKET = WebSocketConnection
    MODEL = ModelConnection
