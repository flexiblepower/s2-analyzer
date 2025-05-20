import json
import logging
from typing import List, Optional, TYPE_CHECKING

from fastapi import (
    Response,
    WebSocket,
    APIRouter,
    WebSocketException,
    Depends,
    Query,
    HTTPException,
)
from pydantic import BaseModel
from s2_analyzer_backend.message_processor.message_processor import (
    DebuggerFrontendMessageProcessor,
)
from s2_analyzer_backend.device_connection.connection import (
    DebuggerFrontendWebsocketConnection,
    DebuggerMessageFilter,
)

from s2_analyzer_backend.endpoints.history_filter import HistoryFilter
from datetime import datetime


from s2_analyzer_backend.async_application import APPLICATIONS
from s2python.s2_parser import S2Parser
from s2python.s2_validation_error import S2ValidationError

LOGGER = logging.getLogger(__name__)


class ValidateS2Message(BaseModel):
    """Pydantic model for receiving the message validation request body."""

    message: dict


class DebuggerAPI:
    """
    DebuggerAPI handles WebSocket connections from the debugger frontend and has endpoints
    for querying the message history, and validating a message.

    Attributes:
        router (APIRouter): The FastAPI router for handling API routes.
        debugger_frontend_msg_processor (DebuggerFrontendMessageProcessor): The message
            processor instance which all of the frontend websocket connections must be added to.
    """

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
            "/backend/history-filter/",
            self.get_filtered_history,
            methods=["GET"],
            summary="Retrieve historical data with filters",
            description="Query historical data filtered by criteria such as CEM ID, RM ID, origin, message type, and timestamp.",
            tags=["debugger"],
        )
        self.router.add_api_route(
            "/backend/validate-message/",
            self.validate_s2_message,
            methods=["POST"],
            summary="Validate an S2 message",
            description="Validate an S2 message against the schema.",
            tags=["debugger"],
        )

    async def get_root(self):
        return {"status": "healthy"}

    async def receive_new_debugger_frontend_connection(
        self,
        websocket: WebSocket,
        cem_id: Optional[str] = Query(None, description="ID of CEM."),
        rm_id: Optional[str] = Query(None, description="ID of RM."),
    ) -> None:
        """Accepts an incoming websocket connection from the debugger frontend.
        Creates a new DebuggerFrontendWebsocketConnection instance which will handle the receiving and sending of messages on the new websocket.
        The new websocket is added to the debugger frontend message processor so that the debug messages are sent over this websocket after being processed.
        """
        LOGGER.info("Received connection from debugger frontend.")
        try:
            await websocket.accept()
            LOGGER.info("Received connection from debugger frontend.")
        except WebSocketException:
            LOGGER.exception(
                "Debugger frontend WS connection had an exception while accepting."
            )

        filters = None
        if cem_id or rm_id:
            filters = DebuggerMessageFilter(rm_id=rm_id, cem_id=cem_id)

        conn = DebuggerFrontendWebsocketConnection(websocket, filters)

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
        """GET Endpoint that filters and returns the query of message history.
        Args:
            cem_id (Optional[str]): CEM ID filter.
            rm_id (Optional[str]): RM ID filter.
            origin (Optional[str]): Origin filter.
            s2_msg_type (Optional[str]): S2 message type filter.
            start_date (Optional[datetime]): Start date filter.
            end_date (Optional[datetime]): End date filter.
            history_filter (HistoryFilter): Dependency injected history filter which queries the database.
        Returns:
            List[Dict]: A list of filtered message history records.
        Raises:
            HTTPException: If an error occurs during the filtering process.
        """
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

    async def validate_s2_message(self, body: ValidateS2Message):
        """
        Receives an S2 message and validates it against the schema.
        Returns the validated message and any errors that occurred during validation.
        """
        s2_parser = S2Parser()
        errors = []

        try:
            LOGGER.info(body.message)
            s2_message = s2_parser.parse_as_any_message(body.message)
        except S2ValidationError as e:
            s2_message = body.message
            errors = []
            if e.pydantic_validation_error:
                errors = e.pydantic_validation_error.errors()
            else:
                errors = [e.__dict__]

            LOGGER.warning(f"Error parsing message: {e}")

        LOGGER.info(f"Validated S2 message: {s2_message}")
        return {"message": s2_message, "errors": errors}
