from typing import TYPE_CHECKING
from s2_analyzer_backend.connection import WebSocketConnection
from s2_analyzer_backend.connection import ModelConnection

if TYPE_CHECKING:
    from s2_analyzer_backend.async_application import AsyncApplications
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.model import Model
    from fastapi import WebSocket


class Builders:
    def __init__(self, context: 'AsyncApplications') -> None:
        self.context = context

    async def build_ws_connection(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', websocket: 'WebSocket') -> 'WebSocketConnection':
        conn = WebSocketConnection(origin_id, dest_id, origin_type, msg_router, websocket)
        # Notify MessageRouter
        await msg_router.receive_new_connection(conn)
        self.context.add_and_start_application(conn)

        return conn

    async def build_model_connection(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', model: 'Model') -> 'ModelConnection':
        conn = ModelConnection(origin_id, dest_id, origin_type, msg_router, model)
        await msg_router.receive_new_connection(conn)
        self.context.add_and_start_application(conn)

        return conn
