from datetime import datetime
from typing import TYPE_CHECKING
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
import threading
from uuid import UUID
from fastapi import WebSocketException, WebSocketDisconnect
from websockets.exceptions import ConnectionClosedOK
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_application import APPLICATIONS

if TYPE_CHECKING:
    from fastapi import WebSocket
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.envelope import Envelope, S2Message
    from backend.mocks.model import Model
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.async_application import ApplicationName
    from s2_analyzer_backend.history import MessageHistory
    from s2_analyzer_backend.message_processor import Message


LOGGER = logging.getLogger(__name__)


class ConnectionClosedReason(Enum):
    TIMEOUT = "timeout"
    DISCONNECT = "disconnect"


class Connection(AsyncApplication, ABC):
    origin_id: str
    dest_id: str
    s2_origin_type: "S2OriginType"
    msg_router: "MessageRouter"
    _queue: "asyncio.Queue[Envelope]"

    def __init__(
        self,
        origin_id: str,
        dest_id: str,
        origin_type: "S2OriginType",
        msg_router: "MessageRouter",
    ):
        super().__init__()
        self.origin_id = origin_id
        self.dest_id = dest_id
        self.s2_origin_type = origin_type
        self.msg_router = msg_router
        self._queue = asyncio.Queue()

    @abstractmethod
    def get_connection_type(self):
        return ConnectionType(type(self))

    @property
    def destination_type(self):
        return self.s2_origin_type.reverse()

    async def receive_envelope(self, envelope: "Envelope") -> None:
        await self._queue.put(envelope)

    def get_name(self) -> "ApplicationName":
        return str(self)

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if (
            self._main_task
            and not self._main_task.done()
            and not self._main_task.cancelled()
        ):
            LOGGER.info(
                "Stopping connection from %s to %s", self.origin_id, self.dest_id
            )
            self._main_task.cancel("Request to stop")
        else:
            LOGGER.warning("Connection %s was already stopped!", self)


class WebSocketConnection(Connection):
    def __init__(
        self,
        origin_id: str,
        dest_id: str,
        origin_type: "S2OriginType",
        msg_router: "MessageRouter",
        websocket: "WebSocket",
    ):
        super().__init__(origin_id, dest_id, origin_type, msg_router)
        self.websocket = websocket

    def __str__(self):
        return f"Websocket connection {self.origin_id}->{self.dest_id}"

    def get_connection_type(self):
        return ConnectionType.WEBSOCKET

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        try:
            async with asyncio.TaskGroup() as task_group:
                task_group.create_task(self.receiver())
                task_group.create_task(self.sender())
        except ExceptionGroup as exc_group:
            for exc in exc_group.exceptions:
                if isinstance(exc, WebSocketDisconnect):
                    threading.Thread(
                        target=APPLICATIONS.stop_and_remove_application, args=(self,)
                    ).start()
                    # loop.run_in_executor(None, APPLICATIONS.stop_and_remove_application, self)
                    self.msg_router.connection_has_closed(self)
                    LOGGER.info(
                        "%s %s disconnected.", self.s2_origin_type.name, self.origin_id
                    )
                else:
                    raise exc from exc_group
        finally:
            # self.msg_history.notify_terminated_conn(self)
            pass

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.websocket.receive_text()
                LOGGER.debug(
                    "%s received message across websocket to %s: %s",
                    self.origin_id,
                    self.dest_id,
                    message_str,
                )
                # self.msg_history.receive_line(f"[Message received][Sender: {self.s2_origin_type.value} {self.origin_id}][Receiver: {self.destination_type.value} {self.dest_id}] Message: {message_str}")
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
            except WebSocketException:
                LOGGER.exception(
                    "Connection to %s %s had an exception while receiving.",
                    self.s2_origin_type.name,
                    self.origin_id,
                )
            except json.JSONDecodeError:
                LOGGER.exception("Error decoding message: %s", message_str)

    async def sender(self) -> None:
        while self._running:
            envelope = await self._queue.get()

            try:
                LOGGER.debug(
                    "%s sent message across websocket to %s: %s",
                    self.dest_id,
                    self.origin_id,
                    envelope,
                )
                await self.websocket.send_text(json.dumps(envelope.msg))
                self._queue.task_done()
            except ConnectionClosedOK:
                LOGGER.warning(
                    "Could not send envelope to %s %s as connection was already closed.",
                    self.s2_origin_type.name,
                    self.origin_id,
                )
            except WebSocketException:
                LOGGER.exception(
                    "Connection to %s %s had an exception while sending.",
                    self.s2_origin_type.name,
                    self.origin_id,
                )


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            # Convert UUID to a string
            return str(obj)
        elif isinstance(obj, datetime):
            # Convert datetime to ISO 8601 string format
            return obj.isoformat()
        # Call the default method for other types
        return super().default(obj)


class DebuggerFrontendWebsocketConnection(AsyncApplication):
    _queue: "asyncio.Queue[Message]"

    def __init__(self, websocket: "WebSocket"):
        self.websocket = websocket
        self._queue = asyncio.Queue()

    def get_name(self) -> "ApplicationName":
        return str(self)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        try:
            async with asyncio.TaskGroup() as task_group:
                task_group.create_task(self.receiver())
                task_group.create_task(self.sender())
        except ExceptionGroup as exc_group:
            for exc in exc_group.exceptions:
                if isinstance(exc, WebSocketDisconnect):
                    threading.Thread(
                        target=APPLICATIONS.stop_and_remove_application, args=(self,)
                    ).start()
                    loop.run_in_executor(
                        None, APPLICATIONS.stop_and_remove_application, self
                    )
                else:
                    raise exc from exc_group
        finally:
            pass

    async def enqueue_message(self, message: "Message") -> None:
        await self._queue.put(message)

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.websocket.receive_text()
                LOGGER.debug("Received message across websocket: %s", message_str)
                message = json.loads(message_str)

                # TODO: Do something with message? Or just block.

            except WebSocketException:
                LOGGER.exception(
                    "Connection to debugger frontend had an exception while receiving."
                )
            except json.JSONDecodeError:
                LOGGER.exception("Error decoding message: %s", message_str)

    async def sender(self) -> None:
        while self._running:
            message: Message = await self._queue.get()

            LOGGER.info(message.model_dump_json())
            # content = {
            #     "cem_id": message.cem_id,
            #     "rm_id": message.rm_id,
            #     "origin": message.origin.__str__(),
            #     "message": message.s2_msg.to_dict() if message.s2_msg else None,
            #     "message_type": message.s2_msg_type,
            #     # "timestamp": message.timestamp,
            # }

            try:
                await self.websocket.send_text(message.model_dump_json())
                LOGGER.debug(
                    "Sent message across websocket to frontend",
                )
                self._queue.task_done()
            except ConnectionClosedOK:
                LOGGER.warning(
                    "Could not send message to debugger frontend as connection was already closed."
                )
            except WebSocketException:
                LOGGER.exception(
                    "Connection to debugger frontend had an exception while sending."
                )

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if (
            self._main_task
            and not self._main_task.done()
            and not self._main_task.cancelled()
        ):
            LOGGER.info("Stopping connection to debugger frontend.")
            self._main_task.cancel("Request to stop")
        else:
            LOGGER.warning("Connection %s was already stopped!", self)


class ConnectionType(Enum):
    WEBSOCKET = "WebSocketConnection"
    MODEL = "ModelConnection"
