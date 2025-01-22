import abc
import asyncio
import logging
import threading
import traceback

LOGGER = logging.getLogger(__name__)
ApplicationName = str


class AsyncApplicationNotStoppedException(Exception):
    pass


class AsyncApplication(abc.ABC):
    _main_task: 'None | asyncio.Task'
    _loop: 'None | asyncio.AbstractEventLoop'
    _running: bool

    def __init__(self):
        self._main_task = None
        self._loop = None
        self._running = False

    @abc.abstractmethod
    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    @abc.abstractmethod
    def get_name(self) -> ApplicationName:
        pass

    @abc.abstractmethod
    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    def get_main_task(self) -> asyncio.Task:
        return self._main_task

    async def execute_main_task(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop
        self._running = True
        try:
            await self.main_task(loop)
            LOGGER.info('Shutdown completed for %s by termination.', self.get_name())
        except asyncio.exceptions.CancelledError as ex:
            LOGGER.info('Shutdown completed for %s by cancelling the task.', self.get_name())
            raise ex  # Python requires this exception to bubble up
        except Exception as exc:  # pylint: disable=broad-except
            LOGGER.error('Application %s crashed with exception!', self.get_name())
            LOGGER.error(''.join(traceback.format_exception(None, exc, exc.__traceback__)))

    def create_and_schedule_main_task(self, loop: asyncio.AbstractEventLoop) -> asyncio.Task:
        self._main_task = loop.create_task(self.execute_main_task(loop))
        return self._main_task

    def notify_to_stop_asap(self) -> None:
        LOGGER.debug('Notifying %s to stop', self.get_name())
        self._running = False
        self._loop.call_soon_threadsafe(self.stop, self._loop)

    def wait_till_done_sync(self,
                            timeout: 'None | float',
                            kill_after_timeout: bool=False,
                            raise_on_timeout: bool=False) -> None:
        """Stop the application in the eventloop.

        Must be run from another thread than the asynchronuous thread as it contains blocking waits.

        :param timeout: If a timeout is given, the application is shutdown after the timeout ends.
        :param kill_after_timeout:
        :param raise_on_timeout:
        """
        event = threading.Event()

        def is_stopped_callback(*args, **kwargs):
            event.set()

        if self._main_task:
            self._main_task.add_done_callback(is_stopped_callback)

        if not event.wait(timeout=timeout):
            if kill_after_timeout:
                LOGGER.warning('Application %s did not shutdown gracefully within the timeout period and was killed.',
                               self.get_name())
                self._main_task.cancel()

            if raise_on_timeout:
                raise AsyncApplicationNotStoppedException(f'{self.get_name()} did not stop.')

    async def wait_till_done_async(self,
                                   timeout: 'None | float',
                                   kill_after_timeout: bool = False,
                                   raise_on_timeout: bool = False) -> None:
        _, pending = await asyncio.wait([self._main_task],
                                           timeout=timeout,
                                           return_when=asyncio.ALL_COMPLETED)

        if self._main_task in pending:
            if kill_after_timeout:
                LOGGER.warning('Application %s did not shutdown gracefully within the timeout period and was killed.',
                               self.get_name())
                self._main_task.cancel()

            if raise_on_timeout:
                raise AsyncApplicationNotStoppedException(f'{self.get_name()} did not stop.')


class AsyncApplications:
    STOP_TIMEOUT = 20.0  # seconds

    loop: asyncio.AbstractEventLoop
    applications: dict[str, AsyncApplication]

    def __init__(self) -> None:
        self.loop = asyncio.new_event_loop()
        self.applications = {}

    def add_and_start_application(self, application: AsyncApplication) -> None:
        self.applications[application.get_name()] = application
        application.create_and_schedule_main_task(self.loop)

    def stop_and_remove_application(self, application: AsyncApplication):
        """Stop the application in the eventloop.

        Must be run from another thread than the asynchronuous thread as it contains blocking waits.
        """
        name = application.get_name()
        application.notify_to_stop_asap()
        LOGGER.debug('Waiting for %s to stop within %s seconds', name, AsyncApplications.STOP_TIMEOUT)
        application.wait_till_done_sync(timeout=AsyncApplications.STOP_TIMEOUT,
                                        kill_after_timeout=True,
                                        raise_on_timeout=False)

        if name in self.applications:
            del self.applications[name]

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
        while self.applications:  # Use a while as one application may stop another which updates this list
            application = list(self.applications.values())[0]
            self.stop_and_remove_application(application)

        LOGGER.info('Stopped all applications')
        self.loop.call_soon_threadsafe(self.loop.stop)
        LOGGER.info('Stopped eventloop')


APPLICATIONS = AsyncApplications()
