import datetime
import logging
from typing import Optional, Callable, Awaitable
import uuid

from s2_analyzer_backend.cem_model_simple.common import (CemModelS2DeviceControlStrategy,
                                                         ControlType,
                                                         S2DeviceInitializationState,
                                                         S2_VERSION)
from s2_analyzer_backend.cem_model_simple.strategies import SUPPORTED_CONTROL_TYPES
from s2_analyzer_backend.connection import Connection
from s2_analyzer_backend.envelope import Envelope, S2Message
from s2_analyzer_backend.router import MessageRouter


LOGGER = logging.getLogger(__name__)


class DeviceModel:
    id: str
    model_connection_to_rm: Connection
    message_router: MessageRouter
    initialization_state: S2DeviceInitializationState
    control_type: ControlType
    control_type_strategy: Optional[CemModelS2DeviceControlStrategy]

    handshake_send: Optional[S2Message]
    handshake_received: Optional[S2Message]
    handshake_response_send: Optional[S2Message]

    resource_manager_details_received: Optional[S2Message]
    power_measurements_received: list[S2Message]
    power_forecasts_received: list[S2Message]

    s2_msg_type_to_callable: dict[str, Callable[[Envelope], Awaitable[None]]]

    def __init__(self,
                 id: str,
                 model_connection_to_rm: Connection,
                 message_router: MessageRouter):
        self.id = id
        self.model_connection_to_rm = model_connection_to_rm
        self.message_router = message_router
        self.initialization_state = S2DeviceInitializationState.HandShake
        self.control_type = ControlType.NoSelection
        self.control_type_strategy = None

        self.handshake_send = None
        self.handshake_received = None
        self.handshake_response_send = None

        self.resource_manager_details_received = None
        self.power_measurements_received = []
        self.power_forecasts_received = []

        self.s2_msg_type_to_callable = {
            'Handshake': self.handle_handshake,
            'ResourceManagerDetails': self.handle_resource_manager_details,
            'PowerForecast': self.handle_power_forecast,
            'PowerMeasurement': self.handle_power_measurement,
        }

    @property
    def rm_id(self):
        return self.model_connection_to_rm.dest_id

    async def receive_envelope(self, envelope: Envelope) -> None:
        handle = self.s2_msg_type_to_callable.get(envelope.msg_type)
        if handle:
            await handle(envelope)
        elif self.control_type_strategy:
            LOGGER.debug(f'CEM device model {self.id} forwarded envelope to control '
                         f'strategy {self.control_type_strategy}')
            self.control_type_strategy.receive_envelope(envelope)
        else:
            LOGGER.warning(f'Received a message of type {envelope.msg_type} which CEM model {self.id} '
                           f'connected to RM {self.rm_id} is unable to handle. Ignoring message.')

    async def handle_handshake(self, envelope: Envelope) -> None:
        self.handshake_received = envelope.msg

        if S2_VERSION in self.handshake_received.get('supported_protocol_versions', []):
            self.handshake_send = {
                'message_type': 'Handshake',
                'message_id': str(uuid.uuid4()),
                'role': 'CEM',
                'supported_protocol_versions': [S2_VERSION]
            }
            await self.message_router.route_s2_message(self.model_connection_to_rm, self.handshake_send)

            self.handshake_response_send = {
                'message_type': 'HandshakeResponse',
                'message_id': str(uuid.uuid4()),
                'selected_protocol_version': S2_VERSION
            }
            await self.message_router.route_s2_message(self.model_connection_to_rm, self.handshake_response_send)
            self.initialization_state = S2DeviceInitializationState.SelectingControlType
        else:
            pass
            # TODO close the connection somehow

    async def handle_resource_manager_details(self, envelope: Envelope) -> None:
        self.resource_manager_details_received = envelope.msg

        available_control_types = self.resource_manager_details_received.get('available_control_types', [])
        selected_control_type = next((ct
                                      for ct in SUPPORTED_CONTROL_TYPES.keys()
                                      if ct.value in available_control_types), None)

        if selected_control_type:
            await self.message_router.route_s2_message(self.model_connection_to_rm, {
                'message_type': 'SelectControlType',
                'message_id': str(uuid.uuid4()),
                'control_type': selected_control_type.value
            })
            self.initialization_state = S2DeviceInitializationState.SelectedControlType
            self.control_type = selected_control_type
            control_type_strategy = SUPPORTED_CONTROL_TYPES.get(self.control_type)
            LOGGER.info(f'Model {self.id} has set control type {self.control_type}.')
            if control_type_strategy:
                self.control_type_strategy = control_type_strategy(self)
            LOGGER.debug(f'Model {self.id} has set control type strategy {self.control_type_strategy}.')
        else:
            pass
            # TODO Terminate the session? Close the connection somehow?

    async def handle_power_forecast(self, envelope: Envelope) -> None:
        self.power_forecasts_received.append(envelope.msg)

    async def handle_power_measurement(self, envelope: Envelope) -> None:
        self.power_measurements_received.append(envelope.msg)

    def tick(self, timestep_start: datetime.datetime, timestep_end: datetime.datetime) -> list[S2Message]:
        if self.control_type_strategy:
            return self.control_type_strategy.tick(timestep_start, timestep_end)
        else:
            return []