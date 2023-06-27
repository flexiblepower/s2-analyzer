import abc
import asyncio
import logging
import threading
import typing
import traceback

LOGGER = logging.getLogger(__name__)
ApplicationName = str


class AsyncApplication(abc.ABC):
    def __init__(self):
        pass

    @abc.abstractmethod
    async def main_task(self, loop: asyncio.AbstractEventLoop) -> typing.Coroutine:
        pass

    @abc.abstractmethod
    def get_name(self) -> ApplicationName:
        pass

    @abc.abstractmethod
    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    def create_and_schedule_main_task(self, loop: asyncio.AbstractEventLoop) -> asyncio.Task:
        main_coroutine = self.main_task(loop)
    
        async def execute_main_task():
            try:
                await main_coroutine
            except asyncio.exceptions.CancelledError as ex:
                LOGGER.info('Shutdown %s.', self.get_name())
                raise ex
            except Exception as exc:  # pylint: disable=broad-except
                LOGGER.error('Application %s crashed with exception!', self.get_name())
                LOGGER.error(''.join(traceback.format_exception(None, exc, exc.__traceback__)))

        main_task = loop.create_task(execute_main_task())

        return main_task


class AsyncApplications:
    STOP_TIMEOUT = 5.0  # seconds

    loop: asyncio.AbstractEventLoop
    applications: dict[str, AsyncApplication]
    pending_tasks: dict[str, asyncio.Task]

    def __init__(self) -> None:
        self.loop = asyncio.new_event_loop()
        self.applications = {}
        self.pending_tasks = {}

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


APPLICATIONS = AsyncApplications()
# Bonus attempt: Add a create_stop_task in AsyncApplication, and run those here with blocking await while run_all will run with run_forever.
