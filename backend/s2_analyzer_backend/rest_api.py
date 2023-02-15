from typing import TYPE_CHECKING
import asyncio
import json
import logging
from typing import Optional

from fastapi import FastAPI, WebSocket, APIRouter, WebSocketDisconnect, WebSocketException
import uvicorn

from s2_analyzer_backend.async_application import AsyncApplication
from s2_analyzer_backend.connection import WebSocketConnection, S2OriginType
from s2_analyzer_backend.router import MessageRouter
import s2_analyzer_backend.logging

if TYPE_CHECKING:
    from s2_analyzer_backend.s2_json_schema_validator import S2JsonSchemaValidator
    from s2_analyzer_backend.async_application import ApplicationName


LOGGER = logging.getLogger(__name__)


class RestAPI(AsyncApplication):
    listen_address: str
    listen_port: int
    s2_validator: "S2JsonSchemaValidator"

    uvicorn_server: Optional[uvicorn.Server]
    fastapi_router: APIRouter

    def __init__(self, listen_address: str, listen_port: int, s2_validator: "S2JsonSchemaValidator"):
        super().__init__()
        self.listen_address = listen_address
        self.listen_port = listen_port
        self.uvicorn_server = None
        self.s2_validator = s2_validator
        self.fastapi_router = APIRouter()
        self.msg_router = MessageRouter(s2_validator)

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
                                log_level=s2_analyzer_backend.logging.LOG_LEVEL.value)
        self.uvicorn_server = uvicorn.Server(config)
        # Prevent uvicorn from overwriting any signal handlers. Uvicorn does not yet has a nice way to do this.
        uvicorn.server.HANDLED_SIGNALS = ()
        await self.uvicorn_server.serve()

    def get_name(self) -> "ApplicationName":
        return 'S2 CEM Server'

    def stop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.uvicorn_server.should_exit = True
        # self.uvicorn_server.force_exit = True

    async def get_root(self) -> str:
        return 'Hello world!'

    async def websocket_resource_manager(self, websocket: "WebSocket", resource_manager_id: str):
        try:
            await websocket.accept()
            LOGGER.info(f'Received connection from resource manager {resource_manager_id}')
            while True:
                message_str = await websocket.receive_text()
                LOGGER.debug(f'{resource_manager_id} send message: {message_str}')
                message = json.loads(message_str)
                message_type = self.s2_validator.get_message_type(message)
                validation_error = self.s2_validator.validate(message, message_type)

                if validation_error is None:
                    LOGGER.debug(f'{resource_manager_id} send valid message: {message_str}')
                    await websocket.send_text('Message is valid!')
                else:
                    LOGGER.debug(f'{resource_manager_id} send invalid message: {message_str}\nError: {validation_error}')
                    await websocket.send_text(f'Message is invalid: {validation_error}')
        except WebSocketDisconnect:
            LOGGER.info(f'Resource manager {resource_manager_id} disconnected.')
        except WebSocketException as e:
            LOGGER.exception(f'Connection to resource manager {resource_manager_id} had an exception:', e)

    async def receive_new_rm_connection(self, ws: WebSocket, rm_id: str, cem_id: str) -> None:
        # Creates the WebsocketConnection instance
        conn = WebSocketConnection(rm_id, cem_id, S2OriginType.RM, self.msg_router, ws)
        try:
            await conn.accept()
            # Notify MessageRouter
            self.msg_router.receive_new_connection(conn)
            # Start listening for new packets, notify WebsocketConnection on any new data's
            await conn.receive_msg()
        # If closed, notify MessageRouter
        except WebSocketDisconnect:
            self.msg_router.connection_has_closed(conn)
            LOGGER.info(f'{conn.s2_origin_type.name} {conn.origin_id} disconnected.')

    async def receive_new_cem_connection(self, ws: WebSocket, cem_id: str, rm_id: str) -> None:
        # Creates the WebsocketConnection instance
        conn = WebSocketConnection(cem_id, rm_id, S2OriginType.CEM, self.msg_router, ws)
        try:
            await conn.accept()
            # Notify MessageRouter
            self.msg_router.receive_new_connection(conn)
            # Start listening for new packets, notify WebsocketConnection on any new data's
            await conn.receive_msg()
        # If closed, notify MessageRouter
        except WebSocketDisconnect:
            self.msg_router.connection_has_closed(conn)
            LOGGER.info(f'{conn.s2_origin_type.name} {conn.origin_id} disconnected.')
        pass