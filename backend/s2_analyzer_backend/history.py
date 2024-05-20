import os
import asyncio
import logging
import threading
from datetime import datetime
from typing import TYPE_CHECKING, Optional
import aiofiles
from bidict import bidict
from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.config import CONFIG
from s2_analyzer_backend.origin_type import S2OriginType
import websockets  

if TYPE_CHECKING:
    from s2_analyzer_backend.async_application import ApplicationName
    from s2_analyzer_backend.connection import Connection


LOGGER = logging.getLogger(__name__)
S2_MESSAGE_HISTORY_FILE_PREFIX = os.getenv('S2_MESSAGE_HISTORY_FILE_PREFIX', 'history')
S2_MESSAGE_HISTORY_FILE_SUFFIX = os.getenv('S2_MESSAGE_HISTORY_FILE_SUFFIX', '.txt')

# WebSocket client to send messages to the frontend via intermediary. TO BE DONE:
# package the timestamp when sending the message.
class WebSocketClient:
    def __init__(self, uri: str):
        self.uri = uri
        self.connection = None

    async def connect(self):
        self.connection = await websockets.connect(self.uri)
        print(f"Connected to WebSocket server at {self.uri}")

    async def send_message(self, message: str):
        if self.connection is None:
            print("WebSocket connection is not established. Call connect() first.")
            return

        await self.connection.send(message)
        print(f"Sent message: {message}")

    async def close(self):
        if self.connection is not None:
            await self.connection.close()
            print("WebSocket connection closed")

class MessageHistory(AsyncApplication):
    cem: 'Optional[Connection]'
    rm: 'Optional[Connection]'
    _queue: 'asyncio.Queue[str]'
    _cem_terminated: bool
    _rm_terminated: bool
    _cem_id: str
    _rm_id: str
    websocket_client: Optional[WebSocketClient]  

    def __init__(self, cem_id: str, rm_id: str) -> None:
        super().__init__()
        self.cem = None
        self.rm = None
        self._cem_terminated = True
        self._rm_terminated = True
        self._cem_id = cem_id
        self._rm_id = rm_id
        self._queue = asyncio.Queue()
        self.websocket_client = WebSocketClient("ws://socket:5000")  

    def add_connection(self, connection: 'Connection') -> None:
        if connection.s2_origin_type == S2OriginType.CEM:
            self.cem = connection
            self._cem_terminated = False
        elif connection.s2_origin_type == S2OriginType.RM:
            self.rm = connection
            self._rm_terminated = False
        else:
            raise RuntimeError('Unknown origin type, please implement.')

    def get_name(self) -> 'ApplicationName':
        return "Message History Recorder"

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if self._main_task and not self._main_task.done() and not self._main_task.cancelled():
            LOGGER.info('Stopping message history from %s to %s', self.cem, self.rm)
            self._main_task.cancel('Request to stop')
        else:
            LOGGER.warning('Message history %s was already stopped!', self)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        filename = f"{S2_MESSAGE_HISTORY_FILE_PREFIX}_{self._cem_id}_to_{self._rm_id}{S2_MESSAGE_HISTORY_FILE_SUFFIX}"
        async with aiofiles.open(CONFIG.connection_histories_dir_path / filename, mode='at+') as file:
            async def handle_line(line: str):
                if self.websocket_client.connection is None:
                    await self.websocket_client.connect()
                    await self.websocket_client.send_message("hi from backend")
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                formatted_line = f"{timestamp} {line}"
                await file.write(f"{formatted_line}\n")
                await file.flush()
                await self.websocket_client.send_message(formatted_line)
            try:
                while self._running:
                    line = await self._queue.get()
                    await handle_line(line)
                    self._queue.task_done()
            finally:
                if self.rm:
                    await self.rm.wait_till_done_async(timeout=None, kill_after_timeout=False, raise_on_timeout=False)
                if self.cem:
                    await self.cem.wait_till_done_async(timeout=None, kill_after_timeout=False, raise_on_timeout=False)
                for _ in range(self._queue.qsize()):
                    line = await self._queue.get()
                    await handle_line(line)
                    self._queue.task_done()
                MESSAGE_HISTORY_REGISTRY.remove_log(self)

    def receive_line(self, line: str) -> None:
        self._queue.put_nowait(line)

    def notify_terminated_conn(self, conn_id: 'Connection'):
        if conn_id == self.cem:
            self._cem_terminated = True
        elif conn_id == self.rm:
            self._rm_terminated = True
        else:
            raise RuntimeError("Unknown connection in message history during termination.")

        if self._cem_terminated and self._rm_terminated:
            threading.Thread(target=APPLICATIONS.stop_and_remove_application, args=(self,)).start()


class MessageHistoryRegistry:
    _logs: bidict[tuple[str, str], MessageHistory]

    def __init__(self) -> None:
        self._logs = bidict()

    def add_log(self, origin: str, dest: str, origin_type: S2OriginType) -> tuple[MessageHistory, bool]:
        if origin_type.is_rm():
            rm, cem = origin, dest
        else:
            cem, rm = origin, dest

        log_key = (cem, rm,)
        if log_key not in self._logs:
            msg_history = MessageHistory(cem, rm)
            self._logs[log_key] = msg_history
            return msg_history, True
        
        msg_history = self._logs[log_key]
        return msg_history, False

    def remove_log(self, msg_history: MessageHistory) -> bool:
        if msg_history in self._logs.inverse:
            del self._logs.inverse[msg_history]
            return True
        return False

    def remove_log_by_ids(self, origin: str, dest: str, origin_type: S2OriginType) -> None:
        # stop?
        if origin_type.is_rm():
            rm, cem = origin, dest
        else:
            cem, rm = origin, dest

        log_key = (cem, rm,)
        if log_key in self._logs:
            del self._logs[log_key]


MESSAGE_HISTORY_REGISTRY = MessageHistoryRegistry()
