import abc
import asyncio
from dataclasses import dataclass
from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import Engine
from sqlmodel import Session
from s2_analyzer_backend.connection import DebuggerFrontendWebsocketConnection
from s2_analyzer_backend.database import Communication, ValidationError
from s2_analyzer_backend.origin_type import S2OriginType
from s2_analyzer_backend.async_application import LOGGER, AsyncApplication

from s2python.s2_parser import S2Parser, S2Message
from s2python.s2_validation_error import S2ValidationError

class MessageValidationDetails(BaseModel):
    msg: str
    errors : list[dict] | None
    
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
    @abc.abstractmethod
    async def process_message(self, message, loop: asyncio.AbstractEventLoop) -> str:
        pass


class MessageLoggerProcessor(MessageProcessor):
    async def process_message(
        self, message: dict, loop: asyncio.AbstractEventLoop
    ) -> str:
        LOGGER.info(f"Message received: {message}")
        return message


class MessageParserProcessor(MessageProcessor):
    s2_parser: S2Parser

    def __init__(self):
        self.s2_parser = S2Parser()

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> str:
        if message is None:
            raise ValueError("Message cannot be None")

        s2_message_type = self.s2_parser.parse_message_type(message.msg)

        # if s2_message_type is None:
        #     raise ValueError("Unknown message type")

        s2_message = None
        validation_error = None
        try:
            s2_message = self.s2_parser.parse_as_any_message(message.msg)
        except S2ValidationError as e:
            LOGGER.warning(e.pydantic_validation_error.json())
            validation_error = MessageValidationDetails(msg=e.msg, errors=e.pydantic_validation_error.errors())
            # validation_error = e
            # raise ValueError(f"Error parsing message: {e}")
            # LOGGER.exception(f"Error parsing message: {e}")
            LOGGER.warning(f"Error parsing message: {e}")

        message.s2_msg = s2_message
        message.s2_msg_type = s2_message_type
        message.s2_validation_error = validation_error

        return message


class MessageStorageProcessor(MessageProcessor):
    def __init__(self, engine: "Engine"):
        super().__init__()
        self.engine = engine

    async def process_message(
        self, message: Message, loop: asyncio.AbstractEventLoop
    ) -> str:
        with Session(self.engine) as session:
            validation_error = None

            # if message.s2_validation_error:
            #     validation_error = ValidationError(
            #         error_details=str(message.s2_validation_error)
            #     )
            #     session.add(validation_error)
            #     session.commit()

            db_message = Communication(
                cem_id=message.cem_id,
                rm_id=message.rm_id,
                origin=message.origin.__str__(),
                s2_msg=message.s2_msg.to_json() if message.s2_msg else None,
                s2_msg_type=message.s2_msg_type,
                timestamp=message.timestamp,
                validation_error=validation_error,
            )

            session.add(db_message)
            session.commit()

            return message
        
class DebuggerFrontendMessageProcessor(MessageProcessor):
    connections : list[DebuggerFrontendWebsocketConnection] 

    def __init__(self):
        self.connections = []
        
    def add_connection(self, connection: DebuggerFrontendWebsocketConnection):
        LOGGER.info(f"Adding connection: {connection}")
        self.connections.append(connection)
    
    async def process_message(self, message: Message, loop: asyncio.AbstractEventLoop) -> str:
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
        for i in closed_connections:
            self.connections.pop(i)
            LOGGER.info(f"Removed closed connection at index {i}")


class MessageProcessorHandler(AsyncApplication):
    message_processors: list[MessageProcessor]
    _queue: "asyncio.Queue[Message]"

    def __init__(self):
        super().__init__()
        self._queue = asyncio.Queue()
        self.message_processors = []

    def get_name(self):
        return "Message Processor Handler"

    def add_message_processor(self, message_processor: MessageProcessor):
        self.message_processors.append(message_processor)

    def add_message_to_process(self, message: dict):
        self._queue.put_nowait(message)

    async def process_message(self, message: Message, loop: asyncio.AbstractEventLoop):
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
        if (
            self._main_task
            and not self._main_task.done()
            and not self._main_task.cancelled()
        ):
            self._main_task.cancel("Request to stop")
        else:
            LOGGER.debug("Message Processor Handler was already stopped!")
