import asyncio
import logging
from typing import Optional, TYPE_CHECKING

from fastapi import FastAPI, WebSocket, APIRouter, WebSocketException, Body, Depends, Query, HTTPException
from sqlmodel import Session, select
import uvicorn
import uvicorn.server
from s2_analyzer_backend.message_processor import DebuggerFrontendMessageProcessor, MessageProcessor
from s2_analyzer_backend.connection import Connection, DebuggerFrontendWebsocketConnection, WebSocketConnection

from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.history_filter import HistoryFilter
from datetime import datetime
from pydantic import BaseModel


# from s2_analyzer_backend.globals import BUILDERS
# from s2_analyzer_backend.history import MESSAGE_HISTORY_REGISTRY
from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.origin_type import S2OriginType
from s2_analyzer_backend.history_filter import HistoryFilter
import s2_analyzer_backend.app_logging

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.async_application import ApplicationName, AsyncApplications


LOGGER = logging.getLogger(__name__)

# class HistoryFilterDTO(BaseModel):
#     cem_id: Optional[str] = Query(None, description="CEM ID filter")
#     rm_id: Optional[str] = Query(None, description="RM ID filter")
#     origin: Optional[str] = Query(None, description="Origin filter")
#     s2_msg_type: Optional[str] = Query(None, description="S2 message type filter")
#     start_date: Optional[datetime] = Query(None, description="Start date filter")
#     end_date: Optional[datetime] = Query(None, description="End date filter")

class RestAPI(AsyncApplication):

    uvicorn_server: Optional[uvicorn.Server]
    fastapi_router: APIRouter

    def __init__(
        self, listen_address: str, listen_port: int, msg_router: "MessageRouter", debugger_frontend_msg_processor : "DebuggerFrontendMessageProcessor"
    ) -> None:
        super().__init__()
        self.listen_address = listen_address
        self.listen_port = listen_port
        self.uvicorn_server = None

        self.fastapi_router = APIRouter()
        self.msg_router = msg_router
        self.debugger_frontend_msg_processor  = debugger_frontend_msg_processor

        self.fastapi_router.add_api_route("/", self.get_root)
        self.fastapi_router.add_api_websocket_route(
            "/backend/rm/{rm_id}/cem/{cem_id}/ws", self.receive_new_rm_connection
        )
        self.fastapi_router.add_api_websocket_route(
            "/backend/cem/{cem_id}/rm/{rm_id}/ws", self.receive_new_cem_connection
        )
        self.fastapi_router.add_api_websocket_route(
            "/backend/debugger/", self.receive_new_debugger_frontend_connection
        )
        self.fastapi_router.add_api_route(
            "/backend/history_filter",
            self.get_filtered_history,
            methods=["GET"],
            summary="Retrieve historical data with filters",
            description="Query historical data filtered by criteria such as CEM ID, RM ID, origin, message type, and timestamp.",
        )

    async def main_task(self, loop: asyncio.AbstractEventLoop) -> None:
        app = FastAPI(title="S2 Analyzer", description="", version="v0.0.1")

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
        # self.uvicorn_server.force_exit = True

    async def get_root(self) -> str:
        return "Hello world!"

    async def handle_connection(self, websocket, origin_id, dest_id):
        conn = WebSocketConnection(
            origin_id, dest_id, S2OriginType.RM, self.msg_router, websocket
        )

        APPLICATIONS.add_and_start_application(conn)

        await self.msg_router.receive_new_connection(conn)

        await conn.wait_till_done_async(
            timeout=None, kill_after_timeout=False, raise_on_timeout=False
        )

    async def receive_new_rm_connection(
        self, websocket: WebSocket, rm_id: str, cem_id: str
    ) -> None:
        try:
            await websocket.accept()
            LOGGER.info("Received connection from rm %s to cem %s.", rm_id, cem_id)
        except WebSocketException:
            LOGGER.exception(
                "RM WS connection from %s to %s had an exception while accepting.",
                rm_id,
                cem_id,
            )

        await self.handle_connection(websocket, rm_id, cem_id)

    async def receive_new_cem_connection(
        self, websocket: WebSocket, cem_id: str, rm_id: str
    ) -> None:
        try:
            await websocket.accept()
            LOGGER.info("Received connection from cem %s to rm %s.", cem_id, rm_id)
        except WebSocketException:
            LOGGER.exception(
                "CEM WS connection from %s to %s had an exception while accepting.",
                cem_id,
                rm_id,
            )

        await self.handle_connection(websocket, cem_id, rm_id)
    
    async def receive_new_debugger_frontend_connection(
        self, websocket: WebSocket
    ) -> None:
        LOGGER.info("Received connection from debugger frontend.")
        try:
            await websocket.accept()
            LOGGER.info("Received connection from debugger frontend.")
        except WebSocketException:
            LOGGER.exception(
                "Debugger frontend WS connection had an exception while accepting."
            )

        conn = DebuggerFrontendWebsocketConnection(websocket)

        APPLICATIONS.add_and_start_application(conn)
        self.debugger_frontend_msg_processor.add_connection(conn)

        await conn.wait_till_done_async(
            timeout=None, kill_after_timeout=False, raise_on_timeout=False
        )
        
    async def get_filtered_history(
        self,
        cem_id: Optional[str] = Query(None, description="CEM ID filter"),
        rm_id: Optional[str] = Query(None, description="RM ID filter"),
        origin: Optional[str] = Query(None, description="Origin filter"),
        s2_msg_type: Optional[str] = Query(None, description="S2 message type filter"),
        start_date: Optional[datetime] = Query(None, description="Start date filter"),
        end_date: Optional[datetime] = Query(None, description="End date filter"),
        history_filter: HistoryFilter = Depends(),
    ):
        try:
            # Fetch filtered records
            results = history_filter.get_filtered_records(
                cem_id, rm_id, origin, s2_msg_type, start_date, end_date
            )
            LOGGER.info(f"Found {len(results)} matching records.")
            return results
        except Exception as e:
            LOGGER.error(f"Error in get_filtered_history: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal Server Error")