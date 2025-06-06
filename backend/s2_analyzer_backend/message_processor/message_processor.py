import abc
import asyncio
from datetime import datetime
import json
from typing import Any, Literal
import uuid

from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session
from s2_analyzer_backend.device_connection.connection import (
    DebuggerFrontendWebsocketConnection,
    SessionUpdatesWebsocketConnection,
    WebsocketConnection,
)
from s2_analyzer_backend.message_processor.database import (
    Communication,
    ValidationError,
)
from s2_analyzer_backend.device_connection.origin_type import S2OriginType
from s2_analyzer_backend.async_application import LOGGER, AsyncApplication

from s2_analyzer_backend.device_connection.session_details import SessionDetails
from s2python.s2_parser import S2Parser, S2Message
from s2python.s2_validation_error import S2ValidationError
from s2_analyzer_backend.message_processor.message import (
    Message,
    MessageValidationDetails,
)
from s2_analyzer_backend.message_processor.message_type import MessageType


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
    ) -> Any:
        LOGGER.info(f"Message received: {message}")
        return message


class MessageParserProcessor(MessageProcessor):
    """A MessageProcessor implementation that uses the S2 Python package to validate a message that it receives."""

    s2_parser: S2Parser

    def __init__(self):
        self.s2_parser = S2Parser()

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> Message:
        """Validates an S2 message

        Args:
            message (Message): Raw message data to be parsed and validated.

        Returns:
            Message: The message instance received as parameter, but with validation info added.
        """
        if message is None:
            raise ValueError("Message cannot be None")

        # Non-S2 messages shouldn't be parsed.
        if message.message_type != MessageType.S2:
            return message

        s2_message = None
        validation_error = None

        if message.msg is None:
            return message

        try:
            s2_message_type = self.s2_parser.parse_message_type(message.msg)
            s2_message = self.s2_parser.parse_as_any_message(message.msg)
        except S2ValidationError as e:
            errors = None

            if e.pydantic_validation_error is not None:
                errors = e.pydantic_validation_error.errors()  # type: ignore
                LOGGER.warning(e.pydantic_validation_error.errors())
            # elif e.msg is not None:
            #     errors = [{"type": "validation_error", "loc": [], "msg": e.msg}]
            #     LOGGER.warning(f"Validation error: {e.msg}")

            if s2_message_type is None and message.msg is not None:
                s2_message_type = json.loads(message.msg).get("message_type", "Unknown")  # type: ignore

            validation_error = MessageValidationDetails(msg=e.msg, errors=errors)  # type: ignore
            # LOGGER.warning(
            #     f"Failed to parse message {message.msg} in session {message.session_id}: {e}"
            # )
            # LOGGER.warning(
            #     f"Validation errors: {validation_error.errors if validation_error else 'None'}"
            # )

        message.s2_msg = s2_message
        message.s2_msg_type = s2_message_type

        if validation_error is not None:
            LOGGER.warning(
                f"Validation error for message {message.msg} in session {message.session_id}: {validation_error}"
            )
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
            if message.timestamp is not None:
                timestamp = message.timestamp
            else:
                timestamp = datetime.now()

            db_message = Communication(
                session_id=message.session_id,
                cem_id=message.cem_id,
                rm_id=message.rm_id,
                origin=message.origin.name,
                message_type=message.message_type,
                s2_msg=json.dumps(message.msg),
                s2_msg_type=message.s2_msg_type,
                timestamp=timestamp,
                validation_errors=validation_error if validation_error else [],
            )
            session.add(db_message)

            if message.s2_validation_error:
                if message.s2_validation_error.errors and len(message.s2_validation_error.errors) > 0:
                    for error in message.s2_validation_error.errors:
                        validation_error = ValidationError(
                            type=error["type"],
                            loc=str(error["loc"]),
                            msg=error["msg"],
                            communication=db_message,
                        )
                        session.add(validation_error)
                else:
                    validation_error = ValidationError(
                        type="validation_error",
                        loc="",
                        msg=message.s2_validation_error.msg,
                        communication=db_message,
                    )
                    session.add(validation_error)
            session.commit()

            return message


class WebSocketMessageProcessor(MessageProcessor):

    connections: list[WebsocketConnection]

    def __init__(self):
        self.connections = []

    async def add_connection(self, connection: WebsocketConnection):
        """Adds a new websocket connection instance to the list of connections. Will receive any new messages."""
        LOGGER.info(f"Adding connection: {connection}")
        self.connections.append(connection)

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> Message:
        # LOGGER.warning(
        #     f"Sending message to {len(self.connections)} debugger frontends: {message}"
        # )
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

    async def close(self):
        """Stop all of the websocket connections. Closes the websockets."""
        for connection in self.connections:
            connection.stop()


class DebuggerFrontendMessageProcessor(WebSocketMessageProcessor):
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

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> Message:
        LOGGER.debug(
            f"Sending message to {len(self.connections)} debugger frontends for session {message.session_id}: {message.s2_msg_type}"
        )
        return await super().process_message(message, loop)


class SessionUpdateMessageProcessor(WebSocketMessageProcessor):

    connections: list[SessionUpdatesWebsocketConnection]

    sessions: dict[uuid.UUID, SessionDetails]

    def __init__(self):
        super().__init__()

        self.sessions = {}

    async def add_connection(self, connection):
        await super().add_connection(connection)
        LOGGER.debug("Session Update Processor Receiving connection.")

        for session in self.sessions.values():
            if session.state == "open":
                await connection.enqueue_message(session)

    async def add_or_update_session(
        self, message: Message, state: Literal["open", "closed"]
    ):
        if state == "closed" and message.session_id in self.sessions:
            session_details = self.sessions.pop(message.session_id)
            # Update the session details so they can be sent to the frontend one last time
            session_details.state = state
            session_details.end_timestamp = message.timestamp
        else:
            session_details = SessionDetails(
                session_id=message.session_id,
                cem_id=message.cem_id,
                rm_id=message.rm_id,
                state=state,
                start_timestamp=message.timestamp,
            )
            self.sessions[message.session_id] = session_details
        return session_details

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> Message:
        if message is None:
            return None

        if message.message_type == MessageType.SESSION_STARTED:
            session_details = await self.add_or_update_session(
                message=message,
                state="open",
            )
        elif message.message_type == MessageType.SESSION_ENDED:
            session_details = await self.add_or_update_session(
                message=message,
                state="closed",
            )
        elif (
            message.message_type == MessageType.S2
            and message.session_id not in self.sessions
        ):
            # Don't know if this case can happen but just for safety
            session_details = await self.add_or_update_session(
                message=message,
                state="open",
            )
        else:
            return message

        closed_connections = []
        for i, connection in enumerate(self.connections):
            if connection._running:
                await connection.enqueue_message(session_details)
            else:
                closed_connections.append(i)

        self.cleanup_closed_connections(closed_connections)

        return message


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
        Should be called by other async applications which need to have a message processed.
        """
        LOGGER.info("Message Processor Handler Receiving Message: %s", message)
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

    def stop(self):
        self._running = False
        # self._loop.call_soon_threadsafe(self.stop, loop)

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


class MessageProcessorHandlerBuilder:
    def __init__(
        self,
    ):
        self.processor_handler = MessageProcessorHandler()

    def with_message_processor(self, message_processor: MessageProcessor):
        self.processor_handler.add_message_processor(message_processor)
        return self

    def build(self):
        return self.processor_handler
