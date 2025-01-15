'''Moved class from s2_analyzer_backend.connection as it pretains to simulating devices. Not refactored'''

from typing import TYPE_CHECKING
import asyncio
import logging
from s2_analyzer_backend.connection import Connection
from s2_analyzer_backend.async_selectable import AsyncSelectable
from backend.mocks.reception_status_awaiter import ReceptionStatusAwaiter

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.envelope import Envelope, S2Message
    from backend.mocks.model import Model
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.history import MessageHistory

LOGGER = logging.getLogger(__name__)

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
        try:
            while self._running:
                await self.route_reception_status_messages()
        finally:
            self.msg_history.notify_terminated_conn(self)

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
                                                                                   True)

    async def send_and_forget(self, s2_message: 'S2Message') -> None:
        self.msg_history.receive_line(f"[Message received][Sender: {self.s2_origin_type.value} {self.origin_id}][Receiver: {self.destination_type.value} {self.dest_id}] Message: {s2_message}")
        await self.msg_router.route_s2_message(self, s2_message)

    async def select_task(self) -> 'Envelope':
        envelope = await self.retrieve_next_envelope()
        self.s2_messages.task_done()
        return envelope