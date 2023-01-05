import abc
import asyncio
import logging
import traceback

LOGGER = logging.getLogger(__name__)
ApplicationName = str


class AsyncApplication(abc.ABC):
    def __init__(self):
        pass

    @abc.abstractmethod
    async def main_task(self, loop:asyncio.AbstractEventLoop) -> None:
        pass

    @abc.abstractmethod
    def get_name(self) -> ApplicationName:
        pass

    @abc.abstractmethod
    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        pass

    def create_main_task(self, loop: asyncio.AbstractEventLoop) -> asyncio.Task:
        return loop.create_task(self.main_task(loop))


class AsyncApplications:
    loop: asyncio.AbstractEventLoop
    applications: dict[str, AsyncApplication]

    def __init__(self) -> None:
        self.loop = asyncio.new_event_loop()
        self.applications = {}

    def add_application(self, application: AsyncApplication) -> None:
        self.applications[application.get_name()] = application

    async def stop_and_remove_application(self, application: AsyncApplication):
        application.stop(self.loop)
        name = application.get_name()

        if name in self.applications:
            del self.applications[name]

    async def _run_application(self, application):
        try:
            await application.create_main_task(self.loop)
        except Exception as exc:  # pylint: disable=broad-except
            LOGGER.error(f'Application {application.get_name()} crashed with exception!')
            LOGGER.error(''.join(traceback.format_exception(None, exc, exc.__traceback__)))

    async def _run_all_until_done(self) -> None:
        tasks = [self._run_application(application) for application in self.applications.values()]
        await asyncio.gather(*tasks)

    def run_all(self):
        asyncio.set_event_loop(self.loop)
        try:
            LOGGER.debug(f'Starting eventloop {self.loop} in async applications.')
            self.loop.run_until_complete(self._run_all_until_done())
        finally:
            LOGGER.debug(f'Closing eventloop {self.loop} in async applications.')
            self.loop.close()
        asyncio.set_event_loop(None)

    def stop(self):
        for application in self.applications.values():
            application.stop(self.loop)
