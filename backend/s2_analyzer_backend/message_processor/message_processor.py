import abc
import asyncio
from datetime import datetime
import json

from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session
from s2_analyzer_backend.device_connection.connection import (
    DebuggerFrontendWebsocketConnection,
)
from s2_analyzer_backend.message_processor.database import (
    Communication,
    ValidationError,
)
from s2_analyzer_backend.device_connection.origin_type import S2OriginType
from s2_analyzer_backend.async_application import LOGGER, AsyncApplication

from s2python.s2_parser import S2Parser, S2Message
from s2python.s2_validation_error import S2ValidationError


class MessageValidationDetails(BaseModel):
    msg: str
    errors: list[dict] | None


class Message(BaseModel):
    cem_id: str
    rm_id: str
    origin: S2OriginType
    msg: dict
    s2_msg: S2Message | None
    s2_msg_type: str | None
    s2_validation_error: MessageValidationDetails | None
    timestamp: datetime | None


class MessageProcessor(abc.ABC):
    """
    Abstract message processor.
    This is an abstract base class that defines the interface for processing messages.
    Subclasses must implement the `process_message` method to perform specific actions on the received message data.
    The message processor handler passes the result of the previous message processor into the next one. Ensure that
    the return value of the processor is useful to the next processor.
    """

    @abc.abstractmethod
    async def process_message(self, message, loop: asyncio.AbstractEventLoop) -> str:
        pass

    def close(self):
        """Method called when the message processor handler is stopped. Used for cleanup."""
        pass


class MessageLoggerProcessor(MessageProcessor):
    """Basic implementation of the MessageProcessor that just logs what it receives."""

    async def process_message(
        self, message: dict, loop: asyncio.AbstractEventLoop
    ) -> str:
        LOGGER.info(f"Message received: {message}")
        return message


class MessageParserProcessor(MessageProcessor):
    """A MessageProcessor implementation that uses the S2 Python package to validate a message that it receives."""

    s2_parser: S2Parser

    def __init__(self):
        self.s2_parser = S2Parser()

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> str:
        """Validates an S2 message

        Args:
            message (Message): Raw message data to be parsed and valdiated.

        Returns:
            Message: The message instance received as parameter, but with validation info added.
        """
        if message is None:
            raise ValueError("Message cannot be None")

        s2_message_type = self.s2_parser.parse_message_type(message.msg)

        s2_message = None
        validation_error = None
        try:
            s2_message = self.s2_parser.parse_as_any_message(message.msg)
        except S2ValidationError as e:
            errors = None
            if e.pydantic_validation_error is not None:
                errors = e.pydantic_validation_error.errors()
            validation_error = MessageValidationDetails(msg=e.msg, errors=errors)
            LOGGER.warning(f"Error parsing message: {e}")

        message.s2_msg = s2_message
        message.s2_msg_type = s2_message_type
        message.s2_validation_error = validation_error

        return message


class MessageStorageProcessor(MessageProcessor):
    """
    A MessageProcessor implementation for storing messages in the database.

    Attributes:
        engine (Engine): The database engine used for creating sessions.
    """

    def __init__(self, engine: "Engine"):
        super().__init__()
        self.engine = engine

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> Message:
        """Stores the given message data in the SQLite database using SQLModel.
        If the message contains validation errors then they are also stored.

        Args:
            message (Message): Message data to be stored. Should include message validation info from previous node.
            loop (asyncio.AbstractEventLoop): Async loop that the processor handler is running in.

        Returns:
            Message: Same message that was received as input. Nothing changed by this node.
        """
        with Session(self.engine) as session:
            validation_error = None

            db_message = Communication(
                cem_id=message.cem_id,
                rm_id=message.rm_id,
                origin=message.origin.__str__(),
                s2_msg=json.dumps(message.msg),
                s2_msg_type=message.s2_msg_type,
                timestamp=message.timestamp,
                validation_error=validation_error,
            )
            session.add(db_message)

            if message.s2_validation_error and message.s2_validation_error.errors:
                for error in message.s2_validation_error.errors:
                    validation_error = ValidationError(
                        type=error["type"],
                        loc=str(error["loc"]),
                        msg=error["msg"],
                        communication=db_message,
                    )
                    session.add(validation_error)
            session.commit()

            return message


class DebuggerFrontendMessageProcessor(MessageProcessor):
    """
    A MessageProcessor instance which sends any messages it receives to all connected debugger frontends.

    Attributes:
        connections (list[DebuggerFrontendWebsocketConnection]): A list of active debugger frontend websocket connections.

    Methods:
        __init__():
            Initializes the DebuggerFrontendMessageProcessor with an empty list of connections.
        add_connection(connection: DebuggerFrontendWebsocketConnection):
            Adds a new debugger frontend websocket connection to the list of connections.
        async process_message(message: Message, loop: asyncio.AbstractEventLoop) -> Message:
            Processes and sends a message to all active debugger frontend connections.
        cleanup_closed_connections(closed_connections: list[int]):
            Cleans up and removes closed connections from the list of connections.
    """

    connections: list[DebuggerFrontendWebsocketConnection]

    def __init__(self):
        self.connections = []

    def add_connection(self, connection: DebuggerFrontendWebsocketConnection):
        """Adds a new websocket connection instance to the list of connections. Will receive any new messages."""
        LOGGER.info(f"Adding connection: {connection}")
        self.connections.append(connection)

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> Message:
        LOGGER.info(f"Sending message to debugger frontends. {len(self.connections)}")
        closed_connections = []
        for i, connection in enumerate(self.connections):
            if connection._running:
                await connection.enqueue_message(message)
            else:
                closed_connections.append(i)

        self.cleanup_closed_connections(closed_connections)

        return message

    def cleanup_closed_connections(self, closed_connections: list[int]):
        """Finds any connections that are closed and removes them from the connection list.
        This could be done in a more sophisticated why by removing it when a connection is closed, however since it is
        unlikely that there will be more than a handful of connections, this simple cleanup method is fine.
        Doing it another way just adds unnecessary complexity."""
        for i in closed_connections:
            self.connections.pop(i)
            LOGGER.info(f"Removed closed connection at index {i}")

    def close(self):
        """Stop all of the websocket connections. Closes the websockets."""
        for connection in self.connections:
            connection.stop()


class MessageProcessorHandler(AsyncApplication):
    """An async application instance which processes messages by passing them through each of the MessageProcessor instances that has been added to it.
    Uses a blocking queue to buffer messages.
    """

    message_processors: list[MessageProcessor]
    _queue: "asyncio.Queue[Message]"

    def __init__(self):
        super().__init__()
        self._queue = asyncio.Queue()
        self.message_processors = []

    def get_name(self):
        """Required by AsyncApplication"""
        return "Message Processor Handler"

    def add_message_processor(self, message_processor: MessageProcessor):
        self.message_processors.append(message_processor)

    def add_message_to_process(self, message: Message):
        """Added a new message to the queue to be processed when the previous messages are done.
        Should be called by other async applications which need to have a message processed."""
        self._queue.put_nowait(message)

    async def process_message(self, message: Message, loop: asyncio.AbstractEventLoop):
        """Performs the processing of a message by passing it through each message processor in sequence.
        The result of the previous message processor is the input of the next.

        Args:
            message (Message): The message to be processed.
            loop: The async app loop.
        """
        result = message
        for message_processor in self.message_processors:
            result = await message_processor.process_message(result, loop)

    async def main_task(self, loop: asyncio.AbstractEventLoop):
        while self._running:
            message = await self._queue.get()
            await self.process_message(message, loop)

    def stop(self, loop: asyncio.AbstractEventLoop):
        self._running = False
        self._loop.call_soon_threadsafe(self.stop, loop)

        # Cleanup the message processors.
        for processor in self.message_processors:
            processor.close()

        if (
            self._main_task
            and not self._main_task.done()
            and not self._main_task.cancelled()
        ):
            self._main_task.cancel("Request to stop")
        else:
            LOGGER.debug("Message Processor Handler was already stopped!")
