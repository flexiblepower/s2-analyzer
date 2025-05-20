import abc

import logging
from typing import Generic, TypeVar

logger = logging.getLogger(__name__)


class ConnectionError(Exception):
    """Base exception for websocket wrapper errors."""


class ConnectionClosed(ConnectionError):
    """Raised when attempting to use a closed websocket."""


class ConnectionProtocolError(ConnectionError):
    """Raised for protocol errors."""


# The generic type that the messages sent and received should have.
T = TypeVar("T")


class ConnectionAdapter(Generic[T], abc.ABC):
    """
    On server we use FastAPI's websocket and on local we use the websockets package.
    These have slightly different interfaces so this adapter allows wrapping of the different websocket implementations.
    """

    @abc.abstractmethod
    async def receive(self) -> T:
        """
        Receive a message from the websocket.
        Raises:
            ConnectionClosed: if the connection is closed.
            ConnectionError: for other errors.
        """
        pass

    @abc.abstractmethod
    async def send(self, message: T):
        """
        Send a message over the websocket.
        Raises:
            ConnectionClosed: if the connection is closed.
            ConnectionError: for other errors.
        """
        pass

    @property
    @abc.abstractmethod
    def open(self) -> bool:
        """
        Returns True if the connection is open.
        """
        pass

    @abc.abstractmethod
    async def close(self, code: int = 1000, reason: str = ""):
        """
        Close the connection.
        Raises:
            ConnectionError: if closing fails.
        """
        pass
