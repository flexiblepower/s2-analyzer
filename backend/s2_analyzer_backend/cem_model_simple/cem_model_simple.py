import asyncio
import datetime
import logging
import time
from typing import TYPE_CHECKING

from s2_analyzer_backend.cem_model_simple.device_model import DeviceModel
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

    def __init__(self, model_id: str, message_router: 'MessageRouter'):
        super().__init__(model_id, message_router)
        self.message_router = message_router
        self.device_models_by_rm_ids = {}

    async def receive_envelope(self, envelope: 'Envelope') -> None:
        device_model = self.device_models_by_rm_ids.get(envelope.origin.origin_id)

        if not device_model:
            LOGGER.error('Received a message from %s but this connection is'
                         'unknown to CEM model %s.', envelope.origin, self.model_id)
        else:
            LOGGER.debug('Received message %s with type %s from %s for device %s', envelope.envelope_id,
                         envelope.msg_type, envelope.origin, device_model.dev_model_id)
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
                                                                               self.message_router)
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
        timestep_start = datetime.datetime.now()
        timestep_end = timestep_start + CEM.SCHEDULE_INTERVAL

        while self._running:
            for device_model in self.device_models_by_rm_ids.values():
                new_messages = device_model.tick(timestep_start, timestep_end)

                for new_message in new_messages:
                    await self.message_router.route_s2_message(device_model.model_connection_to_rm, new_message)

            delay = timestep_end.timestamp() - time.time()
            if delay > 0:
                LOGGER.debug('CEM model %s will sleep for %s seconds until %s.', self.model_id, delay, timestep_end)
                await asyncio.sleep(delay)
            timestep_start = datetime.datetime.now()
            timestep_end = timestep_start + CEM.SCHEDULE_INTERVAL
