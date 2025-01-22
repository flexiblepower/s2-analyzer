import logging
from typing import TYPE_CHECKING

from fastapi import (
    WebSocket,
    APIRouter,
    WebSocketException,
)
from pydantic import BaseModel
from s2_analyzer_backend.connection import (
    WebSocketConnection,
)

from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.origin_type import S2OriginType

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter


LOGGER = logging.getLogger(__name__)


class InjectMessage(BaseModel):
    message: dict


class ConnectionDetails(BaseModel):
    origin_id: str
    dest_id: str
    connection_type: S2OriginType


class ManInTheMiddleAPI:
    router: APIRouter

    def __init__(
        self,
        msg_router: "MessageRouter",
    ) -> None:
        super().__init__()

        self.router = APIRouter()
        self.msg_router = msg_router

        self.router.add_api_websocket_route(
            "/backend/rm/{rm_id}/cem/{cem_id}/ws", self.receive_new_rm_connection
        )
        self.router.add_api_websocket_route(
            "/backend/cem/{cem_id}/rm/{rm_id}/ws", self.receive_new_cem_connection
        )
        self.router.add_api_route(
            "/backend/inject/source/{source_id}/dest/{dest_id}/",
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

    async def inject_message(
        self, source_id: str, dest_id: str, body: InjectMessage
    ) -> None:
        await self.msg_router.inject_message(source_id, dest_id, body.message)
        return

    async def get_connections(self):
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
