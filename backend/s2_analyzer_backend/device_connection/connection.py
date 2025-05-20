from builtins import ExceptionGroup
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from abc import ABC, abstractmethod
from enum import Enum
import asyncio
import json
import logging
import threading
from uuid import UUID
import uuid

from fastapi import WebSocketException, WebSocketDisconnect
from pydantic import BaseModel
from websockets.exceptions import ConnectionClosedOK
from s2_analyzer_backend.endpoints.history_filter import HistoryFilter
from s2_analyzer_backend.device_connection.connection_adapter.adapter import (
    ConnectionAdapter,
    ConnectionClosed,
    ConnectionProtocolError,
)
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_application import APPLICATIONS

from s2_analyzer_backend.message_processor.message import Message
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


class S2Connection(AsyncApplication, ABC):
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
                LOGGER.debug(
                    "%s received message across websocket to %s: %s",
                    self.origin_id,
                    self.dest_id,
                    message_str,
                )
                # self.msg_history.receive_line(f"[Message received][Sender: {self.s2_origin_type.value} {self.origin_id}][Receiver: {self.destination_type.value} {self.dest_id}] Message: {message_str}")
                message = json.loads(message_str)
                await self.msg_router.route_s2_message(self, message)
            except ConnectionProtocolError:
                self.stop()
                return
            except ConnectionClosed:
                LOGGER.warning(
                    "Connection to %s %s had an exception while receiving.",
                    self.s2_origin_type.name,
                    self.origin_id,
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


class DebuggerFrontendWebsocketConnection(AsyncApplication):
    _queue: "asyncio.Queue[Message]"

    filters: Optional[DebuggerMessageFilter]

    def __init__(
        self,
        websocket: "WebSocket",
        history_filter: HistoryFilter,
        filters: DebuggerMessageFilter,
    ):
        self.websocket = websocket
        self._queue = asyncio.Queue()

        self.history_filter = history_filter
        self.filters = filters

    def get_name(self) -> "ApplicationName":
        return str(self)

    async def send_session_history(self):
        if (
            self.filters is not None
            and self.filters.session_id is not None
            and self.filters.include_session_history
        ):
            for communication in self.history_filter.get_s2_session_history(
                uuid.UUID(self.filters.session_id)
            ):
                message = Message(
                    session_id=communication.session_id,
                    cem_id=communication.cem_id,
                    rm_id=communication.rm_id,
                    origin=S2OriginType(communication.origin),
                    msg=communication.s2_msg,
                    s2_msg=None,
                    s2_msg_type=communication.s2_msg_type,
                    timestamp=communication.timestamp,
                    s2_validation_error=None,
                )
                await self._queue.put(message)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        try:
            async with asyncio.TaskGroup() as task_group:
                if self.filters is not None and self.filters.include_session_history:
                    task_group.create_task(self.send_session_history())
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

    async def include_message(self, message: "Message") -> bool:

        # If no filters send all messages.
        if self.filters is None:
            return True

        if (
            message.session_id == self.filters.session_id
            or message.cem_id == self.filters.cem_id
            or message.rm_id == self.filters.rm_id
        ):
            return True

        return False

    async def enqueue_message(self, message: "Message") -> None:
        if self.include_message(message):
            await self._queue.put(message)

    async def receiver(self) -> None:
        while self._running:
            message_str = None
            try:
                message_str = await self.websocket.receive_text()

                if message_str == "ping":
                    LOGGER.debug("Received ping message from frontend.")
                    await self.websocket.send_text("pong")
                    continue
                else:
                    LOGGER.debug(
                        "Received message across websocket. Ignoring it.: %s",
                        message_str,
                    )

                # Do something with message? Or just block.

            except WebSocketException:
                LOGGER.exception(
                    "Connection to debugger frontend had an exception while receiving."
                )
            except json.JSONDecodeError:
                LOGGER.exception("Error decoding message: %s", message_str)

    async def sender(self) -> None:
        while self._running:
            message: Message = await self._queue.get()

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

    def stop(self) -> None:
        self.websocket.close()
        if (
            self._main_task
            and not self._main_task.done()
            and not self._main_task.cancelled()
        ):
            LOGGER.info("Stopping connection to debugger frontend.")
            self._main_task.cancel("Request to stop")
        else:
            LOGGER.warning("Connection %s was already stopped!", self)
