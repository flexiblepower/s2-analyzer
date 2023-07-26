import asyncio
import datetime
import logging
import time
from typing import TYPE_CHECKING

from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.cem_model_simple.device_model import DeviceModel
from s2_analyzer_backend.common import now_as_utc
from s2_analyzer_backend.model import Model

if TYPE_CHECKING:
    from s2_analyzer_backend.connection import Connection, ConnectionClosedReason, ModelConnection
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

    def _build_device_model(self, new_connection: 'ModelConnection'):
        device_model_id = f'{self.model_id}->{new_connection.dest_id}'
        device_model = DeviceModel(device_model_id, new_connection, self.message_router)
        self.device_models_by_rm_ids[new_connection.dest_id] = device_model
        APPLICATIONS.add_and_start_application(device_model)

    def receive_new_connection(self, new_connection: 'ModelConnection') -> bool:
        """

        :param new_connection: The new model connection with this CEM model as origin and the RM as destination.
        :return:
        """
        if new_connection.destination_type.is_rm():
            LOGGER.info('CEM model %s has received new connection from RM %s.', self.model_id, new_connection.dest_id)
            self._build_device_model(new_connection)
            accepted = True
        else:
            LOGGER.warning('CEM model %s has received a CEM->CEM model connection (CEM: %s).'
                           'CEM to CEM connection is unsupported. Not accepting connection.',
                           self.model_id,
                           new_connection.dest_id)
            accepted = False

        return accepted

    def connection_has_closed(self, closed_connection: 'Connection', reason: 'ConnectionClosedReason') -> None:
        if closed_connection.dest_id in self.device_models_by_rm_ids:
            device_model = self.device_models_by_rm_ids[closed_connection.dest_id]
            APPLICATIONS.stop_and_remove_application(device_model)
            del self.device_models_by_rm_ids[closed_connection.dest_id]
            LOGGER.info('CEM model %s was notified that connection '
                        'from %s was closed due to %s.', self.model_id, closed_connection.dest_id, reason)
        else:
            LOGGER.warning('CEM model %s was notified that unknown '
                           'connection %s was closed. Not doing anything...', self.model_id, closed_connection.dest_id)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
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
