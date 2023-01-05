import asyncio
from typing import Optional

from fastapi import FastAPI, APIRouter
import uvicorn

from s2_analyzer_backend.async_application import AsyncApplication, ApplicationName
import s2_analyzer_backend.logging


S2CEMRouter = APIRouter()


@S2CEMRouter.get('/')
async def get_root() -> str:
    return 'Hello world!'


class S2CEMServer(AsyncApplication):
    listen_address: str
    listen_port: int

    uvicorn_server: Optional[uvicorn.Server]

    def __init__(self, listen_address: str, listen_port: int):
        super().__init__()
        self.listen_address = listen_address
        self.listen_port = listen_port
        self.uvicorn_server = None

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        app = FastAPI(title="S2 Analyzer", description="", version="v0.0.1")

        app.include_router(S2CEMRouter)
        config = uvicorn.Config(app,
                                host=self.listen_address,
                                port=self.listen_port,
                                loop="none",
                                log_level=s2_analyzer_backend.logging.LOG_LEVEL.value)
        self.uvicorn_server = uvicorn.Server(config)
        # Prevent uvicorn from overwriting any signal handlers. Uvicorn does not yet has a nice way to do this.
        uvicorn.server.HANDLED_SIGNALS = ()
        await self.uvicorn_server.serve()

    def get_name(self) -> ApplicationName:
        return 'S2 CEM Server'

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.uvicorn_server.should_exit = True
        #self.uvicorn_server.force_exit = True


