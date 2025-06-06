import abc
from builtins import ExceptionGroup
from datetime import datetime
import traceback
from typing import TYPE_CHECKING, Generic, Optional, TypeVar
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
import threading
from uuid import UUID
import uuid

from fastapi import WebSocketException, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from pydantic import BaseModel
from websockets.exceptions import ConnectionClosedOK
from s2_analyzer_backend.device_connection.session_details import SessionDetails
from s2_analyzer_backend.endpoints.history_filter import HistoryFilter
from s2_analyzer_backend.device_connection.connection_adapter.adapter import (
    ConnectionAdapter,
    ConnectionClosed,
    ConnectionProtocolError,
)
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_application import APPLICATIONS

from s2_analyzer_backend.message_processor.message import (
    Message,
    MessageValidationDetails,
)
from s2_analyzer_backend.device_connection.origin_type import S2OriginType

if TYPE_CHECKING:
    from fastapi import WebSocket
    from s2_analyzer_backend.device_connection.router import MessageRouter
    from s2_analyzer_backend.device_connection.envelope import Envelope
    from s2_analyzer_backend.async_application import ApplicationName


LOGGER = logging.getLogger(__name__)


class ConnectionClosedReason(Enum):
    TIMEOUT = "timeout"
    DISCONNECT = "disconnect"


class S2Connection(AsyncApplication):
    conn_adapter: ConnectionAdapter

    origin_id: str
    dest_id: str

    s2_origin_type: "S2OriginType"

    msg_router: "MessageRouter"

    _queue: "asyncio.Queue[Envelope]"

    def __init__(
        self,
        conn_adapter: ConnectionAdapter,
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

        self.conn_adapter = conn_adapter

        self._queue = asyncio.Queue()

        self._ready_event = asyncio.Event()

    @property
    def cem_id(self):
        if self.s2_origin_type.is_cem():
            return self.origin_id
        else:
            return self.dest_id

    @property
    def rm_id(self):
        if self.s2_origin_type.is_cem():
            return self.dest_id
        else:
            return self.origin_id

    async def receive_envelope(self, envelope: "Envelope") -> None:
        await self._queue.put(envelope)

    def get_name(self) -> "ApplicationName":
        return str(self)

    def stop(self) -> None:
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

    def __str__(self):
        return f"Websocket Connection {self.origin_id}->{self.dest_id} ({self.s2_origin_type.name})"

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
            LOGGER.info("Exiting main task.")
            await self.conn_adapter.close()
            self.msg_router.connection_has_closed(self)
            pass

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.conn_adapter.receive()

                # self.msg_history.receive_line(f"[Message received][Sender: {self.s2_origin_type.value} {self.origin_id}][Receiver: {self.destination_type.value} {self.dest_id}] Message: {message_str}")
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
            except ConnectionProtocolError:
                self.stop()
                return
            except ConnectionClosed as e:
                LOGGER.exception(
                    "Connection to %s %s had an exception while receiving: %s",
                    self.s2_origin_type.name,
                    self.origin_id,
                    e,
                )
                # Stop the connection once the connection adapter closes.
                self.stop()
                return
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
                await self.conn_adapter.send(json.dumps(envelope.msg))
                self._queue.task_done()
            except ConnectionProtocolError:
                self.stop()
                return
            except ConnectionClosed:
                # LOGGER.warning(
                #     "Could not send envelope to %s %s as connection was already closed.",
                #     self.s2_origin_type.name,
                #     self.origin_id,
                # )
                # Stop the connection once the connection adapter closes.
                self.stop()
                return


class DebuggerMessageFilter(BaseModel):
    session_id: Optional[str] = None
    include_session_history: bool = False

    rm_id: Optional[str] = None
    cem_id: Optional[str] = None


T = TypeVar("T")


class WebsocketConnection(Generic[T], AsyncApplication):
    _queue: "asyncio.Queue[T]"

    connected = True

    def __init__(
        self,
        websocket: "WebSocket",
    ):
        super().__init__()
        self.websocket = websocket
        self._queue = asyncio.Queue()

    def get_name(self) -> "ApplicationName":
        return str(self)

    def create_tasks(self, task_group: asyncio.TaskGroup):
        task_group.create_task(self.receiver())
        task_group.create_task(self.sender())

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        try:
            async with asyncio.TaskGroup() as task_group:
                self.create_tasks(task_group)
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
            if self.websocket.client_state != WebSocketState.DISCONNECTED:
                await self.websocket.close()
        LOGGER.warning("Exiting Main Loop.")

    def include_message(self, message: T) -> bool:
        return True

    async def enqueue_message(self, message: T) -> None:
        if self.include_message(message):
            await self._queue.put(message)

    async def handle_incoming(self, message_str: str):
        if message_str == "ping":
            LOGGER.debug("Received ping message from frontend.")
            await self.websocket.send_text("pong")
        else:
            LOGGER.debug(
                "Received message across websocket. Ignoring it.: %s",
                message_str,
            )

        # Do something with message? Or just block.

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.websocket.receive_text()

                await self.handle_incoming(message_str)
            except WebSocketException:
                LOGGER.exception(
                    "Connection to debugger frontend had an exception while receiving."
                )
                self.connected = False
            except json.JSONDecodeError:
                LOGGER.exception("Error decoding message: %s", message_str)
        LOGGER.warning("RECEIVER DONE")

    @abc.abstractmethod
    async def serialize_message(self, message: T) -> str:
        return message

    async def sender(self) -> None:
        while self._running:
            message: T = await self._queue.get()

            try:
                serialized_message = await self.serialize_message(message)

                await self.websocket.send_text(serialized_message)
                LOGGER.debug(
                    "Sent message across websocket to frontend",
                )
                self._queue.task_done()
            except ConnectionClosedOK:
                LOGGER.warning(
                    "Could not send message to debugger frontend as connection was already closed."
                )
                self.connected = False
            except WebSocketException:
                LOGGER.exception(
                    "Connection to debugger frontend had an exception while sending."
                )
        LOGGER.warning("SENDER DONE")

    def stop(self) -> None:
        LOGGER.warning("EXITING Websocket connection")
        if (
            self._main_task
            and not self._main_task.done()
            and not self._main_task.cancelled()
        ):
            LOGGER.info("Stopping connection to debugger frontend.")
            self._main_task.cancel("Request to stop")
        else:
            LOGGER.warning("Connection %s was already stopped!", self)


class DebuggerFrontendWebsocketConnection(WebsocketConnection[Message]):
    filters: Optional[DebuggerMessageFilter]

    def __init__(
        self,
        websocket: "WebSocket",
        history_filter: HistoryFilter,
        filters: DebuggerMessageFilter,
    ):
        super().__init__(websocket)

        self.history_filter = history_filter
        self.filters = filters

    async def send_session_history(self):
        if (
            self.filters is not None
            and self.filters.session_id is not None
            and self.filters.include_session_history
        ):
            LOGGER.warning(
                "Sending session history for session %s", self.filters.session_id
            )
            for communication in self.history_filter.get_s2_session_history(
                uuid.UUID(self.filters.session_id)
            ):
                LOGGER.warning(communication.validation_errors)
                validation_error = None
                if (
                    communication.validation_errors is not None
                    and len(communication.validation_errors) > 0
                ):
                    comm_validation_error = communication.validation_errors[0]
                    validation_error = MessageValidationDetails(
                        msg=comm_validation_error.msg,
                        errors=[
                            {
                                "type": comm_validation_error.type,
                                "loc": comm_validation_error.loc,
                                "msg": comm_validation_error.msg,
                            }
                        ],
                    )
                    LOGGER.warning(
                        "Validation error for message %s: %s",
                        communication.s2_msg_type,
                        validation_error,
                    )

                message = Message(
                    session_id=communication.session_id,
                    cem_id=communication.cem_id,
                    rm_id=communication.rm_id,
                    message_type=communication.message_type,
                    origin=S2OriginType(communication.origin),
                    msg=communication.s2_msg,
                    s2_msg=None,
                    s2_msg_type=communication.s2_msg_type,
                    timestamp=communication.timestamp,
                    s2_validation_error=validation_error,
                )
                await self._queue.put(message)

    def create_tasks(self, task_group):
        if self.filters is not None and self.filters.include_session_history:
            task_group.create_task(self.send_session_history())
        return super().create_tasks(task_group)

    def include_message(self, message: "Message") -> bool:

        # If no filters send all messages.
        if self.filters is None:
            return True

        if (
            message.session_id == uuid.UUID(self.filters.session_id)
            or message.cem_id == self.filters.cem_id
            or message.rm_id == self.filters.rm_id
        ):
            return True

        return False

    async def serialize_message(self, message):
        return message.model_dump_json()


class SessionUpdatesWebsocketConnection(WebsocketConnection[SessionDetails]):
    sent_sessions: set[uuid.UUID]

    def __init__(
        self,
        websocket: "WebSocket",
    ):
        super().__init__(websocket)
        self.websocket = websocket

    async def serialize_message(self, message) -> str:
        return message.model_dump_json()

    async def add_session(self, id: uuid.UUID):
        if id not in self.sent_sessions:
            await self.enqueue_message(SessionDetails(session_id=id))
