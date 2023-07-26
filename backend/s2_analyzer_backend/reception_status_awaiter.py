import asyncio
from typing import Optional, TYPE_CHECKING

from s2_analyzer_backend.envelope import S2Message

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection
    from s2_analyzer_backend.router import MessageRouter


class ReceptionStatusAwaiter:
    received: dict[str, 'S2Message']
    awaiting: dict[str, asyncio.Event]

    def __init__(self):
        self.received = {}
        self.awaiting = {}

    async def wait_for_reception_status(self, message_id: str) -> Optional['S2Message']:
        if message_id in self.received:
            reception_status = self.received[message_id]
        else:
            if message_id in self.awaiting:
                received_event = self.awaiting[message_id]
            else:
                received_event = asyncio.Event()
                self.awaiting[message_id] = received_event

            await received_event.wait()
            reception_status = self.received.get(message_id)

            if message_id in self.awaiting:
                del self.awaiting[message_id]

        return reception_status

    async def send_and_await_reception_status(self,
                                              origin: 'Connection',
                                              s2_msg: 'S2Message',
                                              router: 'MessageRouter',
                                              raise_on_error: bool) -> 'S2Message':
        await router.route_s2_message(origin, s2_msg)
        reception_status = await self.wait_for_reception_status(s2_msg['message_id'])
        status = reception_status['status']

        if status != 'OK' and raise_on_error:
            raise RuntimeError(f'ReceptionStatus was not OK but rather {status}')

        return reception_status

    async def receive_reception_status(self, reception_status: 'S2Message') -> None:
        if reception_status.get('message_type') != 'ReceptionStatus':
            raise RuntimeError(f'Expected a ReceptionStatus but received message {reception_status}')
        message_id = reception_status['subject_message_id']

        if message_id in self.received:
            raise RuntimeError(f'ReceptationStatus for message_subject_id {message_id} has already been received!')
        else:
            self.received[message_id] = reception_status
            awaiting = self.awaiting.get(message_id)

            if awaiting:
                awaiting.set()
                del self.awaiting[message_id]
