import abc
import asyncio
from s2_analyzer_backend.envelope import Envelope
from s2_analyzer_backend.async_application import AsyncApplication


class MessageProcessor(abc.ABC):
    @abc.abstractmethod
    async def process_message(
        self, message: Envelope, loop: asyncio.AbstractEventLoop
    ) -> str:
        pass

class MessageLoggerProcessor(MessageProcessor):
    async def process_message(
        self, message: Envelope, loop: asyncio.AbstractEventLoop
    ) -> str:
        print(f"Message received: {message}")
        return message


class MessageProcessorHandler(AsyncApplication):
    message_processors: list[MessageProcessor]
    _queue: "asyncio.Queue[Envelope]"

    def __init__(self):
        super().__init__()
        self._queue = asyncio.Queue()
        self.message_processors = []

    def get_name(self):
        return "Message Processor Handler"

    def add_message_processor(self, message_processor: MessageProcessor):
        self.message_processors.append(message_processor)

    def add_message_to_process(self, message: str):
        self._queue.put_nowait(message)

    async def process_message(self, message: Envelope, loop: asyncio.AbstractEventLoop):
        result = message
        # ! Not sure if the results is necessary
        for message_processor in self.message_processors:
            result = await message_processor.process_message(result, loop)

    async def main_task(self, loop: asyncio.AbstractEventLoop):
        while self._running:
            message = await self._queue.get()
            await self.process_message(message, loop)
            
    def stop(self, loop: asyncio.AbstractEventLoop):
        self._running = False
        self._loop.call_soon_threadsafe(self.stop, loop)
        if self._main_task and not self._main_task.done() and not self._main_task.cancelled():
            self._main_task.cancel("Request to stop")
        else:
            print(f"Message Processor Handler was already stopped!")
