import abc
import asyncio
import logging
import threading
import traceback
from typing import TYPE_CHECKING

from s2_analyzer_backend.connection import WebSocketConnection
from s2_analyzer_backend.connection import ModelConnection

if TYPE_CHECKING:
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.router import MessageRouter
    from fastapi import WebSocket

LOGGER = logging.getLogger(__name__)
ApplicationName = str


class AsyncApplication(abc.ABC):
    def __init__(self):
        pass

    @abc.abstractmethod
    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    @abc.abstractmethod
    def get_name(self) -> ApplicationName:
        pass

    @abc.abstractmethod
    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    async def _run_application(self, loop: asyncio.AbstractEventLoop):
        try:
            await self.main_task(loop)
        except Exception as exc:  # pylint: disable=broad-except
            LOGGER.error('Application %s crashed with exception!', self.get_name())
            LOGGER.error(''.join(traceback.format_exception(None, exc, exc.__traceback__)))

    def create_and_schedule_main_task(self, loop: asyncio.AbstractEventLoop) -> asyncio.Task:
        return loop.create_task(self._run_application(loop))


class AsyncApplications:
    STOP_TIMEOUT = 5.0  # seconds

    loop: asyncio.AbstractEventLoop
    applications: dict[str, AsyncApplication]
    pending_tasks: dict[str, asyncio.Task]

    def __init__(self) -> None:
        self.loop = asyncio.new_event_loop()
        self.applications = {}
        self.pending_tasks = {}

    # def build_ws_connection(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', websocket: 'WebSocket') -> 'WebSocketConnection':
    #     c = WebSocketConnection(origin_id, dest_id, origin_type, msg_router, websocket)
    #     self.add_and_start_application(c)
    #     '''
    #     Somewhere in code:
    #         msg_router.receive_new_connection(c)
    #         c.link_queue(existing_inbox)
    #     '''
        
    #     # TODO c.start()
    #     return c

    # def build_model_connection(self) -> 'ModelConnection':
    #     pass

    def add_and_start_application(self, application: AsyncApplication) -> None:
        self.applications[application.get_name()] = application
        new_task = application.create_and_schedule_main_task(self.loop)
        self.pending_tasks[application.get_name()] = new_task

    def stop_and_remove_application(self, application: AsyncApplication):
        name = application.get_name()
        LOGGER.debug('Notifying %s to stop', name)
        self.loop.call_soon_threadsafe(application.stop, self.loop)

        LOGGER.debug('Waiting for %s to stop within %s seconds', name, AsyncApplications.STOP_TIMEOUT)
        event = threading.Event()

        def is_stopped_callback(*args, **kwargs):
            event.set()

        pending_task = self.pending_tasks.get(name)
        if pending_task:
            pending_task.add_done_callback(is_stopped_callback)
            if not event.wait(timeout=AsyncApplications.STOP_TIMEOUT):
                LOGGER.warning('Application %s did not shutdown gracefully within the timeout period and was killed.', name)
                pending_task.cancel()

        if name in self.applications:
            del self.applications[name]
        if name in self.pending_tasks:
            del self.pending_tasks[name]

    def run_all(self):
        asyncio.set_event_loop(self.loop)
        try:
            LOGGER.debug('Starting eventloop %s in async applications.', {self.loop})
            self.loop.run_forever()
        finally:
            LOGGER.debug('Closing eventloop %s in async applications.', self.loop)
            self.loop.close()
        asyncio.set_event_loop(None)

    def stop(self):
        """Stop all applications in the eventloop.

        Must be run from another thread than the asynchronuous thread as it contains blocking waits.
        """
        for application in list(self.applications.values()):
            self.stop_and_remove_application(application)

        LOGGER.info('Stopped all applications')
        self.loop.call_soon_threadsafe(self.loop.stop)
        LOGGER.info('Stopped eventloop')
        # Bonus attempt: Add a create_stop_task in AsyncApplication, and run those here with blocking await while run_all will run with run_forever.
