import asyncio
import logging
from typing import Optional, TYPE_CHECKING

from fastapi import FastAPI, WebSocket, APIRouter
import uvicorn
import uvicorn.server

from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.globals import BUILDERS
from s2_analyzer_backend.origin_type import S2OriginType
import s2_analyzer_backend.app_logging

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.async_application import ApplicationName


LOGGER = logging.getLogger(__name__)


class RestAPI(AsyncApplication):

    uvicorn_server: Optional[uvicorn.Server]
    fastapi_router: APIRouter

    def __init__(self, listen_address: str, listen_port: int, msg_router: "MessageRouter"):
        super().__init__()
        self.listen_address = listen_address
        self.listen_port = listen_port
        self.uvicorn_server = None
        self.fastapi_router = APIRouter()
        self.msg_router = msg_router

        self.fastapi_router.add_api_route('/', self.get_root)
        self.fastapi_router.add_api_websocket_route('/backend/rm/{rm_id}/cem/{cem_id}/ws',
                                                    self.receive_new_rm_connection)
        self.fastapi_router.add_api_websocket_route('/backend/cem/{cem_id}/rm/{rm_id}/ws',
                                                    self.receive_new_cem_connection)

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        app = FastAPI(title="S2 Analyzer", description="", version="v0.0.1")

        app.include_router(self.fastapi_router)
        config = uvicorn.Config(app,
                                host=self.listen_address,
                                port=self.listen_port,
                                loop="none",
                                log_level=s2_analyzer_backend.app_logging.LOG_LEVEL.value)
        self.uvicorn_server = uvicorn.Server(config)
        # Prevent uvicorn from overwriting any signal handlers. Uvicorn does not yet has a nice way to do this.
        uvicorn.server.HANDLED_SIGNALS = ()
        await self.uvicorn_server.serve()

    def get_name(self) -> "ApplicationName":
        return 'S2 REST API Server'

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        if self.uvicorn_server is None:
            raise RuntimeError("Stopping uvicorn failed: there is no uvicorn running!")
        self.uvicorn_server.should_exit = True
        #self.uvicorn_server.force_exit = True

    async def get_root(self) -> str:
        return 'Hello world!'

    async def receive_new_rm_connection(self, websocket: WebSocket, rm_id: str, cem_id: str) -> None:
        try:
            await websocket.accept()
            LOGGER.info('Received connection from rm %s to cem %s.', rm_id, cem_id)
        except WebSocketException:
            LOGGER.exception('Connection from %s to %s had an exception while accepting.', rm_id, cem_id)

        # Creates the WebsocketConnection instance
        conn = BUILDERS.build_ws_connection(rm_id, cem_id, S2OriginType.RM, self.msg_router, websocket)
        await conn.wait_till_stopped()

    async def receive_new_cem_connection(self, websocket: WebSocket, cem_id: str, rm_id: str) -> None:
        try:
            await websocket.accept()
            LOGGER.info('Received connection from rm %s to cem %s.', rm_id, cem_id)
        except WebSocketException:
            LOGGER.exception('Connection from %s to %s had an exception while accepting.', rm_id, cem_id)

        # Creates the WebsocketConnection instance
        conn = BUILDERS.build_ws_connection(cem_id, rm_id, S2OriginType.CEM, self.msg_router, websocket)
        await conn.wait_till_stopped()
