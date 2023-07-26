import asyncio
import datetime
import logging
import time
from typing import TYPE_CHECKING

from s2_analyzer_backend.cem_model_simple.device_model import DeviceModel
from s2_analyzer_backend.cem_model_simple.reception_status_awaiter import ReceptionStatusAwaiter
from s2_analyzer_backend.common import now_as_utc
from s2_analyzer_backend.model import Model

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection, ConnectionClosedReason
    from s2_analyzer_backend.envelope import Envelope
    from s2_analyzer_backend.router import MessageRouter

LOGGER = logging.getLogger(__name__)


class CEM(Model):
    SCHEDULE_INTERVAL = datetime.timedelta(minutes=1)

    message_router: 'MessageRouter'
    device_models_by_rm_ids: dict[str, DeviceModel]
    reception_status_awaiter: ReceptionStatusAwaiter

    def __init__(self, model_id: str, message_router: 'MessageRouter'):
        super().__init__(model_id, message_router)
        self.message_router = message_router
        self.device_models_by_rm_ids = {}
        self.reception_status_awaiter = ReceptionStatusAwaiter()

    async def receive_envelope(self, envelope: 'Envelope') -> None:
        device_model = self.device_models_by_rm_ids.get(envelope.origin.origin_id)

        if not device_model:
            LOGGER.error('Received a message from %s but this connection is unknown to CEM model %s.',
                         envelope.origin,
                         self.model_id)
        elif not envelope.is_format_valid:
            if 'message_id' in envelope.msg:
                LOGGER.error('[CEM model %s] received an format invalid message from %s. Sending reception status '
                             'and ignore.',
                             self.model_id,
                             envelope.origin.origin_id)
                await device_model.send_and_forget({'message_type': 'ReceptionStatus',
                                                    'subject_message_id': envelope.msg['message_id'],
                                                    'status': 'INVALID_MESSAGE'})
            else:
                LOGGER.error('[CEM model %s] received an format-invalid message from %s without a message id. '
                             'Ignoring.',
                             self.model_id,
                             envelope.origin.origin_id)
        elif envelope.msg_type == 'ReceptionStatus':
            LOGGER.debug('Received reception status for %s from %s for device %s',
                         envelope.msg["subject_message_id"],
                         envelope.origin,
                         device_model.dev_model_id)
            await self.reception_status_awaiter.receive_reception_status(envelope.msg)
        else:
            LOGGER.debug('Received message %s with type %s from %s for device %s',
                         envelope.envelope_id,
                         envelope.msg_type,
                         envelope.origin,
                         device_model.dev_model_id)
            await device_model.send_and_forget({'message_type': 'ReceptionStatus',
                                                'subject_message_id': envelope.msg['message_id'],
                                                'status': 'OK'})
            await device_model.receive_envelope(envelope)

    def receive_new_connection(self, new_connection: 'Connection') -> bool:
        """

        :param new_connection: The new model connection with this CEM model as origin and the RM as destination.
        :return:
        """
        if new_connection.destination_type.is_rm():
            LOGGER.info('CEM model %s has received new connection from RM %s.', self.model_id, new_connection.dest_id)
            device_model_id = f'{self.model_id}->{new_connection.dest_id}'
            self.device_models_by_rm_ids[new_connection.dest_id] = DeviceModel(device_model_id,
                                                                               new_connection,
                                                                               self.message_router,
                                                                               self.reception_status_awaiter)
            accepted = True
        else:
            LOGGER.warning('CEM model %s has received a CEM->CEM model connection (CEM: %s).'
                           'CEM to CEM connection is unsupported. Not accepting connection.', self.model_id, new_connection.dest_id)
            accepted = False

        return accepted

    def connection_has_closed(self, closed_connection: 'Connection', reason: 'ConnectionClosedReason') -> None:
        if closed_connection.dest_id in self.device_models_by_rm_ids:
            del self.device_models_by_rm_ids[closed_connection.dest_id]
            LOGGER.info('CEM model %s was notified that connection '
                        'from %s was closed due to %s.', self.model_id, closed_connection.dest_id, reason)
        else:
            LOGGER.warning('CEM model %s was notified that unknown '
                           'connection %s was closed. Not doing anything...', self.model_id, closed_connection.dest_id)

    async def entry(self) -> None:
        """Progress all device models each timestep."""
        timestep_start = now_as_utc()
        timestep_end = timestep_start + CEM.SCHEDULE_INTERVAL

        while self._running:
            ticks = [device_model.tick(timestep_start, timestep_end)
                     for device_model in self.device_models_by_rm_ids.values()]
            await asyncio.gather(*ticks)

            delay = timestep_end.timestamp() - time.time()
            if delay > 0:
                LOGGER.debug('CEM model %s will sleep for %s seconds until %s.', self.model_id, delay, timestep_end)
                await asyncio.sleep(delay)
            timestep_start = now_as_utc()
            timestep_end = timestep_start + CEM.SCHEDULE_INTERVAL
