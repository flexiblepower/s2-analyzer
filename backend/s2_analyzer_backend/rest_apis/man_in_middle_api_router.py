import json
import logging
from typing import TYPE_CHECKING

from fastapi import (
    Response,
    WebSocket,
    APIRouter,
    WebSocketException,
)
from pydantic import BaseModel
from s2_analyzer_backend.device_connection.connection import (
    WebSocketConnection,
)

from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.device_connection.origin_type import S2OriginType
from s2python.s2_parser import S2Parser
from s2python.s2_validation_error import S2ValidationError

if TYPE_CHECKING:
    from s2_analyzer_backend.device_connection.router import MessageRouter


LOGGER = logging.getLogger(__name__)


class InjectMessage(BaseModel):
    """Pydantic model used to validate and receive
    the message injection endpoint body."""

    origin_id: str
    dest_id: str
    message: dict


class ConnectionDetails(BaseModel):
    """Pydantic model used to serialize the connection information
    for the connection list endpoint."""

    origin_id: str
    dest_id: str
    connection_type: S2OriginType


class ManInTheMiddleAPI:
    """
    ManInTheMiddleAPI handles WebSocket connections and message injection for the S2 Analyzer backend.

    Attributes:
        router (APIRouter): The FastAPI router for handling API routes.
        msg_router (MessageRouter): The message router instance used to route messages between the CEM and RM devices.
    """

    router: APIRouter
    msg_router: "MessageRouter"

    def __init__(
        self,
        msg_router: "MessageRouter",  # Received by dependency injection
    ) -> None:
        super().__init__()

        self.router = APIRouter()
        self.msg_router = msg_router

        # Adding the routes to the FastAPI router.
        self.router.add_api_websocket_route(
            "/backend/rm/{rm_id}/cem/{cem_id}/ws", self.receive_new_rm_connection
        )
        self.router.add_api_websocket_route(
            "/backend/cem/{cem_id}/rm/{rm_id}/ws", self.receive_new_cem_connection
        )
        self.router.add_api_route(
            "/backend/inject/",
            self.inject_message,
            methods=["POST"],
            tags=["inject"],
        )
        self.router.add_api_route(
            "/backend/connections/",
            self.get_connections,
            methods=["GET"],
            tags=["connections"],
        )

    async def handle_connection(
        self,
        websocket,
        connection_type: S2OriginType,
        origin_id,
        dest_id,
    ) -> None:
        """Handles the creation of a new WebsocketConnection instance when a CEM or RM device initiates a connection.
        WebSocketConnections are run as AsyncApplications so run on their own thread to receive messages.

        Args:
            websocket (WebSocket): received websocket connection.
            connection_type (S2OriginType): The origin type of the websocket. Either CEM or RM
            origin_id (_type_): The identifier of the sending device.
            dest_id (_type_): Identifier of the receiving device.
        """
        conn = WebSocketConnection(
            origin_id, dest_id, connection_type, self.msg_router, websocket
        )

        APPLICATIONS.add_and_start_application(conn)

        await self.msg_router.receive_new_connection(conn)

        await conn.wait_till_done_async(
            timeout=None, kill_after_timeout=False, raise_on_timeout=False
        )

    async def receive_new_rm_connection(
        self, websocket: WebSocket, rm_id: str, cem_id: str
    ) -> None:
        """Handles the new incoming RM connection"""
        try:
            await websocket.accept()
            LOGGER.info("Received connection from rm %s to cem %s.", rm_id, cem_id)
        except WebSocketException:
            LOGGER.exception(
                "RM WS connection from %s to %s had an exception while accepting.",
                rm_id,
                cem_id,
            )

        await self.handle_connection(websocket, S2OriginType.RM, rm_id, cem_id)

    async def receive_new_cem_connection(
        self, websocket: WebSocket, cem_id: str, rm_id: str
    ) -> None:
        """Handles the new incoming CEM connection."""
        try:
            await websocket.accept()
            LOGGER.info("Received connection from cem %s to rm %s.", cem_id, rm_id)
        except WebSocketException:
            LOGGER.exception(
                "CEM WS connection from %s to %s had an exception while accepting.",
                cem_id,
                rm_id,
            )

        await self.handle_connection(websocket, S2OriginType.CEM, cem_id, rm_id)

    async def inject_message(self, body: InjectMessage, validate: bool = True):
        """
        Injects a message into the message router between a CEM and RM device.
        Args:
            body (InjectMessage): The message and routing information to be used to inject the message.
            validate (bool, optional): Query parameter. Flag to indicate whether the message should be validated before injection. Defaults to True.
        Responses:
            200: If message injection successful.
            400: If the message is validated and is found to be invalid or the message injection failed.
        """

        LOGGER.info(validate)
        if validate:
            try:
                LOGGER.info(body.message)

                s2_parser = S2Parser()
                s2_parser.parse_as_any_message(body.message)
            except S2ValidationError as e:
                errors = []
                if e.pydantic_validation_error:
                    errors = e.pydantic_validation_error.errors()
                else:
                    errors = [e.__dict__]

                return Response(json.dumps(errors), status_code=400)

        try:
            await self.msg_router.inject_message(
                body.origin_id, body.dest_id, body.message
            )
        except Exception:
            return Response(
                "Unable to inject message. Probably because there's no connection to inject into.",
                400,
            )

    async def get_connections(self):
        """Endpoint to view all open connections to the S2 Analyzer."""
        connections = []
        for conn in self.msg_router.connections.values():
            connections.append(
                ConnectionDetails(
                    origin_id=conn.origin_id,
                    dest_id=conn.dest_id,
                    connection_type=conn.s2_origin_type,
                )
            )
        return connections
