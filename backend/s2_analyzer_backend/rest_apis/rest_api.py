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
from starlette.middleware.cors import CORSMiddleware

from .man_in_middle_api_router import (
    ManInTheMiddleAPI,
)
from .debugger_api import DebuggerAPI
from s2_analyzer_backend.message_processor.message_processor import (
    DebuggerFrontendMessageProcessor,
    SessionUpdateMessageProcessor,
)

from s2_analyzer_backend.async_application import AsyncApplication
import s2_analyzer_backend.app_logging

if TYPE_CHECKING:
    from s2_analyzer_backend.device_connection.router import MessageRouter
    from s2_analyzer_backend.async_application import ApplicationName


LOGGER = logging.getLogger(__name__)


"""
This module defines the RestAPI class, which is responsible for setting up and running a FastAPI server with
specific routes and middleware for the S2 Analyzer application.
"""


class RestAPI(AsyncApplication):
    uvicorn_server: Optional[uvicorn.Server]
    fastapi_router: APIRouter

    def __init__(
        self,
        listen_address: str,
        listen_port: int,
        msg_router: "MessageRouter",
        debugger_frontend_msg_processor: "DebuggerFrontendMessageProcessor",
        session_update_msg_processor: "SessionUpdateMessageProcessor",
    ) -> None:
        super().__init__()
        self.listen_address = listen_address
        self.listen_port = listen_port
        self.uvicorn_server = None

        self.fastapi_router = APIRouter()

        # Receive the message router and debugger message processor via dependency injection.
        self.msg_router = msg_router
        self.debugger_frontend_msg_processor = debugger_frontend_msg_processor
        self.session_update_msg_processor = session_update_msg_processor

        # Setup the sub-routers which handle specific tasks.
        debugger_api = DebuggerAPI(debugger_frontend_msg_processor, session_update_msg_processor)
        self.fastapi_router.include_router(debugger_api.router)

        # Handles the CEM and RM man in the middle communication. Also has the message injection functionality.
        mitm_api = ManInTheMiddleAPI(msg_router)
        self.fastapi_router.include_router(mitm_api.router)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        app = FastAPI(title="S2 Analyzer", description="", version="v0.0.1")

        # Add CORS middleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Allow all origins
            allow_credentials=True,
            allow_methods=["*"],  # Allow all HTTP methods
            allow_headers=["*"],  # Allow all HTTP headers
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

    def stop(self) -> None:
        if self.uvicorn_server is None:
            raise RuntimeError("Stopping uvicorn failed: there is no uvicorn running!")
        self.uvicorn_server.should_exit = True
