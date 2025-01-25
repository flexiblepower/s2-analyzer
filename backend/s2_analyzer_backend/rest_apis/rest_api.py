import asyncio
import logging
from typing import Optional, TYPE_CHECKING

from fastapi import (
    FastAPI,
    APIRouter,
)
from fastapi.middleware.cors import CORSMiddleware


import uvicorn
import uvicorn.server
from .man_in_middle_api_router import (
    ManInTheMiddleAPI,
)
from .debugger_api import DebuggerAPI
from s2_analyzer_backend.message_processor.message_processor import (
    DebuggerFrontendMessageProcessor,
)

from s2_analyzer_backend.async_application import AsyncApplication
import s2_analyzer_backend.app_logging

if TYPE_CHECKING:
    from s2_analyzer_backend.device_connection.router import MessageRouter
    from s2_analyzer_backend.async_application import ApplicationName


LOGGER = logging.getLogger(__name__)


class RestAPI(AsyncApplication):
    uvicorn_server: Optional[uvicorn.Server]
    fastapi_router: APIRouter

    def __init__(
        self,
        listen_address: str,
        listen_port: int,
        msg_router: "MessageRouter",
        debugger_frontend_msg_processor: "DebuggerFrontendMessageProcessor",
    ) -> None:
        super().__init__()
        self.listen_address = listen_address
        self.listen_port = listen_port
        self.uvicorn_server = None

        self.fastapi_router = APIRouter()
        self.msg_router = msg_router
        self.debugger_frontend_msg_processor = debugger_frontend_msg_processor

        # Could be moved to dependency injection or something. But for now, this is fine.
        debugger_api = DebuggerAPI(debugger_frontend_msg_processor)
        self.fastapi_router.include_router(debugger_api.router)

        mitm_api = ManInTheMiddleAPI(msg_router)
        self.fastapi_router.include_router(mitm_api.router)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        app = FastAPI(title="S2 Analyzer", description="", version="v0.0.1")
        
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Adjust to specific origins instead of "*" for security
            allow_credentials=True,
            allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
            allow_headers=["*"],  # Allows all headers
        )

        app.include_router(self.fastapi_router)
        config = uvicorn.Config(
            app,
            host=self.listen_address,
            port=self.listen_port,
            loop="none",
            log_level=s2_analyzer_backend.app_logging.LOG_LEVEL.value,
        )
        self.uvicorn_server = uvicorn.Server(config)
        # Prevent uvicorn from overwriting any signal handlers. Uvicorn does not yet has a nice way to do this.
        uvicorn.server.HANDLED_SIGNALS = ()
        await self.uvicorn_server.serve()

    def get_name(self) -> "ApplicationName":
        return "S2 REST API Server"

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if self.uvicorn_server is None:
            raise RuntimeError("Stopping uvicorn failed: there is no uvicorn running!")
        self.uvicorn_server.should_exit = True
