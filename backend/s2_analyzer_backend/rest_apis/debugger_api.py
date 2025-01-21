import logging
from typing import Optional, TYPE_CHECKING

from fastapi import (
    WebSocket,
    APIRouter,
    WebSocketException,
    Depends,
    Query,
    HTTPException,
)
from s2_analyzer_backend.message_processor import (
    DebuggerFrontendMessageProcessor,
)
from s2_analyzer_backend.connection import (
    DebuggerFrontendWebsocketConnection,
)

from s2_analyzer_backend.history_filter import HistoryFilter
from datetime import datetime


from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.history_filter import HistoryFilter

LOGGER = logging.getLogger(__name__)

class DebuggerAPI:
    router: APIRouter

    def __init__(
        self,
        debugger_frontend_msg_processor: "DebuggerFrontendMessageProcessor",
    ) -> None:
        super().__init__()
        self.uvicorn_server = None

        self.router = APIRouter()
        self.debugger_frontend_msg_processor = debugger_frontend_msg_processor

        self.router.add_api_route("/", self.get_root)
        self.router.add_api_websocket_route(
            "/backend/debugger/", self.receive_new_debugger_frontend_connection
        )
        self.router.add_api_route(
            "/backend/history_filter/",
            self.get_filtered_history,
            methods=["GET"],
            summary="Retrieve historical data with filters",
            description="Query historical data filtered by criteria such as CEM ID, RM ID, origin, message type, and timestamp.",
        )

    async def get_root(self):
        return {"status": "healthy"}

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
        history_filter: HistoryFilter = Depends(),  # Dependency injected history filter which queries database
    ):
        LOGGER.info(
            f"Received history filter request: cem_id={cem_id}, rm_id={rm_id}, origin={origin}, s2_msg_type={s2_msg_type}, start_date={start_date}, end_date={end_date}"
        )
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
