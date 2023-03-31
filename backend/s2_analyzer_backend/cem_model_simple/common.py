import abc
import datetime
from dataclasses import dataclass
from enum import Enum
from typing import Callable, Iterator, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from s2_analyzer_backend.envelope import Envelope, S2Message

S2_VERSION = '0.0.1-beta'


class ControlType(Enum):
    NO_SELECTION = 'NO_SELECTION'
    NO_CONTROL = 'NOT_CONTROLABLE'
    FRBC = 'FILL_RATE_BASED_CONTROL'
    DDBC = 'DEMAND_DRIVEN_BASED_CONTROL'
    PPBC = 'POWER_PROFILE_BASED_CONTROL'
    OMBC = 'OPERATION_MODE_BASED_CONTROL'
    PEBC = 'POWER_ENVELOPE_BASED_CONTROL'


class S2DeviceInitializationState(Enum):
    HAND_SHAKE = 'HandShake'
    SELECTING_CONTROL_TYPE = 'SelectingControlType'
    SELECTED_CONTROL_TYPE = 'SelectedControlType'


class CemModelS2DeviceControlStrategy(abc.ABC):
    @abc.abstractmethod
    def receive_envelope(self, envelope: 'Envelope'):
        pass

    @abc.abstractmethod
    async def tick(self, timestep_start: datetime.datetime, timestep_end: datetime.datetime) -> None:
        pass


@dataclass
class NumericalRange:
    start: float
    end: float

    @staticmethod
    def inclusive(start: float, stop: float, step: float) -> Iterator[float]:
        i = 1
        result = start

        while result < stop:
            yield result
            result = start + i * step
            i += 1
        yield stop


def get_active_s2_message(timestep_instant: datetime.datetime,
                          accessor_to_valid_from: 'Callable[[S2Message], datetime.datetime]',
                          s2_messages: 'list[S2Message]') -> 'Optional[S2Message]':
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
