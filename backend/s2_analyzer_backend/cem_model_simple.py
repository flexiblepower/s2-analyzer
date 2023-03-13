import abc
import asyncio
from collections import OrderedDict
import datetime
from enum import Enum
import itertools
import logging
import time
from typing import Optional, Callable, Iterator, Awaitable
import uuid

from s2_analyzer_backend.connection import Connection, S2OriginType, ConnectionClosedReason
from s2_analyzer_backend.envelope import Envelope, S2Message
from s2_analyzer_backend.model import Model
from s2_analyzer_backend.router import MessageRouter

LOGGER = logging.getLogger(__name__)

S2_VERSION = '0.0.1-beta'


class ControlType(Enum):
    NoSelection = 'NO_SELECTION'
    NoControl = 'NOT_CONTROLABLE'
    FRBC = 'FILL_RATE_BASED_CONTROL'
    DDBC = 'DEMAND_DRIVEN_BASED_CONTROL'
    PPBC = 'POWER_PROFILE_BASED_CONTROL'
    OMBC = 'OPERATION_MODE_BASED_CONTROL'
    PEBC = 'POWER_ENVELOPE_BASED_CONTROL'


class S2DeviceInitializationState(Enum):
    HandShake = 'HandShake'
    SelectingControlType = 'SelectingControlType'
    SelectedControlType = 'SelectedControlType'


class CemModelS2DeviceControlStrategy(abc.ABC):
    @abc.abstractmethod
    def receive_envelope(self, envelope: Envelope):
        pass

    @abc.abstractmethod
    def tick(self, timestep_start: datetime.datetime, timestep_end: datetime.datetime):
        pass


class NumericalRange:
    start: float
    end: float

    def __init__(self, start: float, end: float):
        self.start = start
        self.end = end

    @staticmethod
    def inclusive(start: float, stop: float, step: float) -> Iterator[float]:
        i = 1
        result = start

        while result < stop:
            yield result
            result = start + i * step
            i += 1
        yield stop


class FRBCStrategy(CemModelS2DeviceControlStrategy):
    OM_STEP_RESOLUTION = 0.1
    DELAY_IN_INSTRUCTIONS = datetime.timedelta(seconds=2)

    s2_device_model: 'DeviceModel'

    system_descriptions: list[S2Message]
    actuator_status_per_actuator_id: dict[str, S2Message]
    fill_level_target_profiles: list[S2Message]
    leakage_behaviours: list[S2Message]
    usage_forecasts: list[S2Message]

    instructions_send: list[S2Message]

    timers_started_at: dict[str, datetime.datetime]
    expected_fill_level_at_end_of_timestep: Optional[float]

    s2_msg_type_to_callable: dict[str, Callable[[Envelope], None]]

    def __init__(self, s2_device_model: 'DeviceModel'):
        self.s2_device_model = s2_device_model

        self.s2_msg_type_to_callable = {
            'FRBC.SystemDescription': self.handle_system_description,
            'FRBC.ActuatorStatus': self.handle_actuator_status,
            'FRBC.FillLevelTargetProfile': self.handle_fill_level_target_profile,
            'FRBC.LeakageBehaviour': self.handle_leakage_behaviour,
            'FRBC.UsageForecast': self.handle_usage_forecast,
            'FRBC.StorageStatus': self.handle_storage_status
        }

        self.system_descriptions = []
        self.actuator_status_per_actuator_id = {}
        self.fill_level_target_profiles = []
        self.leakage_behaviours = []
        self.usage_forecasts = []
        self.instructions_send = []
        self.timers_started_at = {}
        self.expected_fill_level_at_end_of_timestep = None

    def receive_envelope(self, envelope: Envelope):
        handle = self.s2_msg_type_to_callable.get(envelope.msg_type)
        if handle:
            handle(envelope)
        else:
            LOGGER.warning(f'Received a message of type {envelope.msg_type} which CEM device '
                           f'model {self.s2_device_model.id} connected to RM {self.s2_device_model.rm_id} is '
                           f'unable to handle. Ignoring message.')

    def handle_system_description(self, envelope: Envelope) -> None:
        self.system_descriptions.append(envelope.msg)

    def handle_actuator_status(self, envelope: Envelope) -> None:
        actuator_id = envelope.msg['actuator_id']
        self.actuator_status_per_actuator_id[actuator_id] = envelope.msg

    def handle_fill_level_target_profile(self, envelope: Envelope) -> None:
        self.fill_level_target_profiles.append(envelope.msg)

    def handle_leakage_behaviour(self, envelope: Envelope) -> None:
        self.leakage_behaviours.append(envelope.msg)

    def handle_usage_forecast(self, envelope: Envelope) -> None:
        self.usage_forecasts.append(envelope.msg)

    def handle_storage_status(self, envelope: Envelope) -> None:
        self.expected_fill_level_at_end_of_timestep = envelope.msg['present_fill_level']

    def tick(self, timestep_start: datetime.datetime, timestep_end: datetime.datetime) -> list[S2Message]:
        LOGGER.debug(f'[{self.s2_device_model.id}] tick starts.')
        active_system_description = FRBCStrategy.get_active_s2_message(timestep_start,
                                                                       lambda m: datetime.datetime.fromisoformat(m['valid_from']),
                                                                       self.system_descriptions)
        LOGGER.debug(f'[{self.s2_device_model.id}] Active system description: {active_system_description}.')
        storage_description = active_system_description['storage']
        allowed_fill_level_range = storage_description['fill_level_range']
        fill_level_at_start_of_timestep = self.expected_fill_level_at_end_of_timestep
        LOGGER.debug(f'[{self.s2_device_model.id}] Fill level at start of'
                     f'timestep: {fill_level_at_start_of_timestep}.')

        active_fill_level_target_profile = FRBCStrategy.get_active_s2_message(timestep_end,
                                                                              lambda m: datetime.datetime.fromisoformat(m['start_time']),
                                                                              self.fill_level_target_profiles)

        if active_system_description and fill_level_at_start_of_timestep is not None and active_fill_level_target_profile:
            expected_fill_level_range_at_end_of_timestep = self.get_expected_fill_level_at_end_of_timestep(fill_level_at_start_of_timestep,
                                                                                                           timestep_end,
                                                                                                           active_fill_level_target_profile)
            target_fill_level_range_at_end_of_timestep = range(max(allowed_fill_level_range['start_of_range'],
                                                                   expected_fill_level_range_at_end_of_timestep.start),
                                                               min(allowed_fill_level_range['end_of_range'],
                                                                   expected_fill_level_range_at_end_of_timestep.end))
            expected_usage_during_timestep = self.get_expected_usage_during_timestep(timestep_start, timestep_end)
            expected_leakage_during_timestep = self.get_expected_leakage_during_timestep(fill_level_at_start_of_timestep,
                                                                                         timestep_start,
                                                                                         timestep_end)

            fill_level_if_no_action = fill_level_at_start_of_timestep + expected_usage_during_timestep + expected_leakage_during_timestep

            if target_fill_level_range_at_end_of_timestep.start <= fill_level_if_no_action < target_fill_level_range_at_end_of_timestep.stop:
                actuate_fill_level = 0
            elif fill_level_if_no_action < target_fill_level_range_at_end_of_timestep.start:
                actuate_fill_level = target_fill_level_range_at_end_of_timestep.start - fill_level_if_no_action
            else:
                actuate_fill_level = target_fill_level_range_at_end_of_timestep.stop - fill_level_if_no_action

            LOGGER.debug(f'[{self.s2_device_model.id}] '
                         f'Expected end fill level: {expected_leakage_during_timestep}\n'
                         f'    Allowed fill range: {allowed_fill_level_range}\n'
                         f'    Expected usage: {expected_usage_during_timestep}\n'
                         f'    Expected leakage: {expected_leakage_during_timestep}\n'
                         f'    Fill level on noop: {fill_level_if_no_action}\n'
                         f'    Actuate fill level: {actuate_fill_level}')

            instructions = self.find_instructions_to_reach_fill_level_target(fill_level_at_start_of_timestep,
                                                                             actuate_fill_level,
                                                                             active_system_description,
                                                                             timestep_end - timestep_start,
                                                                             timestep_start)
            LOGGER.debug(f'[{self.s2_device_model.id}] Resulting instructions:')
            LOGGER.debug(f'[{self.s2_device_model.id}] tick ends.')
        else:
            LOGGER.debug(f'[{self.s2_device_model.id}] No new instructions generated as:')

            if not active_system_description:
                LOGGER.debug(f'[{self.s2_device_model.id}]     No active system description.')

            if fill_level_at_start_of_timestep is None:
                LOGGER.debug(f'[{self.s2_device_model.id}]     No fill level status available.')

            if not active_fill_level_target_profile:
                LOGGER.debug(f'[{self.s2_device_model.id}]     No active fill level target.')

            instructions = []

        return instructions
        # TODO UNIT TESTSSSSSSS

    def get_expected_fill_level_at_end_of_timestep(self,
                                                   fill_level_at_start_of_timestep: float,
                                                   timestep_end: datetime.datetime,
                                                   active_fill_level_target_profile: S2Message) -> NumericalRange:
        expected_fill_level_at_end = None
        current_start = datetime.datetime.fromisoformat(active_fill_level_target_profile['start_time'])
        for fill_level_element in active_fill_level_target_profile['elements']:
            duration = datetime.timedelta(milliseconds=fill_level_element['duration'])
            current_end = current_start + duration

            if current_start <= timestep_end < current_end:
                fill_level_range = fill_level_element['fill_level_range']
                expected_fill_level_at_end = NumericalRange(fill_level_range['start_of_range'],
                                                            fill_level_range['end_of_range'])
                break

            current_start = current_start + duration

        if expected_fill_level_at_end is None:
            expected_fill_level_at_end = NumericalRange(fill_level_at_start_of_timestep,
                                                        fill_level_at_start_of_timestep)

        return expected_fill_level_at_end

    def get_expected_usage_during_timestep(self,
                                           timestep_start: datetime.datetime,
                                           timestep_end: datetime.datetime) -> float:
        expected_usage = 0.0
        for usage_forecast in self.usage_forecasts:
            current_start = datetime.datetime.fromisoformat(usage_forecast['start_time'])

            for usage_element in usage_forecast['elements']:
                duration = datetime.timedelta(milliseconds=usage_element['duration'])
                current_end = current_start + duration

                if current_end > timestep_start and current_start < timestep_end:
                    # There is overlap
                    usage_in_timestep_start = max(current_start, timestep_start)
                    usage_in_timestep_end = min(current_end, timestep_end)
                    usage_duration = usage_in_timestep_end - usage_in_timestep_start

                    expected_usage = expected_usage + usage_duration.total_seconds() * usage_element['usage_rate_expected']

        return expected_usage

    def get_expected_leakage_during_timestep(self,
                                             fill_level_at_start_of_timestep: float,
                                             timestep_start: datetime.datetime,
                                             timestep_end: datetime.datetime) -> float:
        expected_leakage = 0.0
        active_leakage_behaviour = FRBCStrategy.get_active_s2_message(timestep_start,
                                                                      lambda m: datetime.datetime.fromisoformat(m['valid_from']),
                                                                      self.leakage_behaviours)
        if active_leakage_behaviour:
            for leakage_element in active_leakage_behaviour['elements']:
                leakage_fill_range = leakage_element['fill_level_range']
                if leakage_fill_range['start_of_range'] <= fill_level_at_start_of_timestep < leakage_fill_range['end_of_range']:
                    expected_leakage = (timestep_end - timestep_start) * leakage_element['leakage_rate']

        return expected_leakage

    def find_instructions_to_reach_fill_level_target(self,
                                                     current_fill_level: float,
                                                     actuate_fill_level: float,
                                                     active_system_description: S2Message,
                                                     duration: datetime.timedelta,
                                                     start_of_timestep: datetime.datetime) -> list[S2Message]:
        actuator_om_omfactor = self.choose_operation_modes_to_reach_fill_level_target(current_fill_level,
                                                                                      actuate_fill_level,
                                                                                      active_system_description,
                                                                                      duration)
        start_of_instruction = start_of_timestep + self.DELAY_IN_INSTRUCTIONS
        instructions = []

        for actuator, om, om_factor in actuator_om_omfactor:
            instructions.append({
                'message_type': 'FRBC.Instruction',
                'message_id': str(uuid.uuid4()),
                'id': str(uuid.uuid4()),
                'actuator_id': actuator['id'],
                'operation_mode': om['id'],
                'operation_mode_factor': om_factor,
                'execution_time': start_of_instruction.isoformat(),
                'abnormal_condition': False
            })

        return instructions

    def choose_operation_modes_to_reach_fill_level_target(self,
                                                          current_fill_level: float,
                                                          actuate_fill_level: float,
                                                          active_system_description: S2Message,
                                                          duration: datetime.timedelta) -> list[tuple[S2Message, S2Message, float]]:
        """

        :param current_fill_level:
        :param actuate_fill_level:
        :param active_system_description:
        :param duration:
        :return: A list of tuples containing an actuator description, om description and om factor.
        """
        reachable_operation_mode_ids_per_actuator_id = {}
        duration_seconds = duration.total_seconds()

        for actuator in active_system_description['actuators']:
            actuator_status = self.actuator_status_per_actuator_id[actuator['id']]
            reachable_operation_modes = self.get_reachable_operation_modes_for_actuator(actuator_status, actuator)
            reachable_operation_mode_ids_per_actuator_id[actuator['id']] = [(actuator,
                                                                             om,
                                                                             self.get_active_operation_mode_element(current_fill_level,
                                                                                                                    om))
                                                                            for om in reachable_operation_modes]
        current_best_combination = None
        current_best_fill_rate = None
        for actuator_combination in itertools.product(*reachable_operation_mode_ids_per_actuator_id.values()):
            operation_mode_factors = []
            for actuator, om, om_element in actuator_combination:
                begin_factor = om_element['fill_level_range']['start_of_range']
                end_factor = om_element['fill_level_range']['end_of_range']
                all_factors = list(NumericalRange.inclusive(begin_factor, end_factor, self.OM_STEP_RESOLUTION))
                # TODO move all_factors to previous for-loop into the tuple so it is not repeated so often
                operation_mode_factors.append(all_factors)
            
            for om_factors in itertools.product(*operation_mode_factors):
                would_actuate_fill_level = 0
                combination = []
                for (om_factor), (actuator, om, om_element) in zip(om_factors, actuator_combination):
                    would_actuate_fill_level += self.get_fill_rate_for_operation_mode_element(om_element,
                                                                                              om_factor) * duration_seconds
                    combination.append((actuator, om, om_factor))
                if current_best_fill_rate is None:
                    current_best_combination = combination
                    current_best_fill_rate = would_actuate_fill_level
                elif abs(actuate_fill_level - would_actuate_fill_level) < abs(actuate_fill_level - current_best_fill_rate):
                    current_best_combination = combination
                    current_best_fill_rate = would_actuate_fill_level

        return current_best_combination

    @staticmethod
    def get_fill_rate_for_operation_mode_element(om_element: S2Message,
                                                 om_factor: float) -> float:
        om_0_fill_rate = om_element['fill_rate']['start_of_range']
        om_1_fill_rate = om_element['fill_rate']['end_of_range']
        return om_factor * (om_1_fill_rate - om_0_fill_rate) + om_0_fill_rate

    @staticmethod
    def get_active_operation_mode_element(current_fill_level: float,
                                          om_description: S2Message) -> Optional[S2Message]:
        result_element = None
        for om_element in om_description['elements']:
            fill_level_range = om_element['fill_level_range']
            if fill_level_range['start_of_range'] <= current_fill_level < fill_level_range['end_of_range']:
                result_element = om_element
                break
        return result_element

    @staticmethod
    def get_reachable_operation_modes_for_actuator(actuator_status: S2Message,
                                                   actuator_description: S2Message) -> list[S2Message]:
        om_descriptions_by_ids = {om['id']: om for om in actuator_description['operation_modes']}
        current_operation_mode_id = actuator_status['active_operation_mode_id']
        reachable_operation_mode_ids = [om_descriptions_by_ids[current_operation_mode_id]]

        for transition in actuator_description['transitions']:
            if current_operation_mode_id == transition['from']:
                # TODO look at timers
                reachable_operation_mode_ids.append(om_descriptions_by_ids[transition['to']])

        return reachable_operation_mode_ids

    @staticmethod
    def get_active_s2_message(timestep_instant: datetime.datetime,
                              accessor_to_valid_from: Callable[[S2Message], datetime.datetime],
                              s2_messages: list[S2Message]) -> Optional[S2Message]:
        """ Searches for the S2 message which is closest to timestep_instant but before timestep_instant.

        In other words, it searches for the youngest, active S2 message using an anonymous accessor to retrieve the
        valid_from timestep from the message.

        :param timestep_instant: Current time. Any S2 message with a valid from after this value is
            considered non-active.
        :param accessor_to_valid_from: Retrieves the valid_from timestamp from the S2 message.
        :param s2_messages: The list of S2 messages to search through.
        :return: The youngest but active S2 message from the list of S2 messages.
        """
        youngest_active = None

        for s2_message in s2_messages:
            valid_from = accessor_to_valid_from(s2_message)

            if valid_from <= timestep_instant:
                if youngest_active is None or valid_from > accessor_to_valid_from(youngest_active):
                    youngest_active = s2_message

        return youngest_active


# List of priority. Earlier in the list means higher preferences over later items in the list.
SUPPORTED_CONTROL_TYPES = OrderedDict([(ControlType.FRBC, FRBCStrategy),
                                       (ControlType.NoSelection, None),
                                       (ControlType.NoControl, None)])


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


class CEM(Model):
    SCHEDULE_INTERVAL = datetime.timedelta(minutes=1)

    message_router: MessageRouter
    device_models_by_rm_ids: dict[str, DeviceModel]

    def __init__(self, id: str, message_router: MessageRouter):
        super().__init__(id, message_router)
        self.message_router = message_router
        self.device_models_by_rm_ids = {}

    async def receive_envelope(self, envelope: Envelope) -> None:
        device_model = self.device_models_by_rm_ids.get(envelope.origin.origin_id)

        if not device_model:
            LOGGER.error(f'Received a message from {envelope.origin} but this connection is unknown to CEM '
                         f'model {self.id}.')
        else:
            LOGGER.debug(f'Received message {envelope.id} with type {envelope.msg_type} from {envelope.origin} for '
                         f'device {device_model.id}')
            await device_model.receive_envelope(envelope)

    def receive_new_connection(self, new_connection: Connection) -> bool:
        """

        :param new_connection: The new model connection with this CEM model as origin and the RM as destination.
        :return:
        """
        if new_connection.destination_type == S2OriginType.RM:
            LOGGER.info(f'CEM model {self.id} has received new connection from RM {new_connection.dest_id}.')
            device_model_id = f'{self.id}->{new_connection.dest_id}'
            self.device_models_by_rm_ids[new_connection.dest_id] = DeviceModel(device_model_id,
                                                                               new_connection,
                                                                               self.message_router)
            accepted = True
        else:
            LOGGER.warning(f'CEM model {self.id} has received a CEM->CEM model connection '
                           f'(CEM: {new_connection.dest_id}).'
                           f'CEM to CEM connection is unsupported. Not accepting connection.')
            accepted = False

        return accepted

    def connection_has_closed(self, closed_connection: Connection, reason: ConnectionClosedReason) -> None:
        if closed_connection.origin_id in self.device_models_by_rm_ids:
            del self.device_models_by_rm_ids[closed_connection.origin_id]
            LOGGER.info(f'CEM model {self.id} was notified that connection '
                        f'from {closed_connection.origin_id} was closed due to {reason}.')
        else:
            LOGGER.warning(f'CEM model {self.id} was notified that unknown '
                           f'connection {closed_connection.origin_id} was closed. Not doing anything...')

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
                LOGGER.debug(f'CEM model {self.id} will sleep for {delay} seconds until {timestep_end}.')
                await asyncio.sleep(delay)
            timestep_start = datetime.datetime.now()
            timestep_end = timestep_start + CEM.SCHEDULE_INTERVAL
