from s2_analyzer_backend.connection import WebSocketConnection
from s2_analyzer_backend.connection import ModelConnection
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from s2_analyzer_backend.async_application import AsyncApplications
    from s2_analyzer_backend.origin_type import S2OriginType
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.model import Model
    from fastapi import WebSocket


class Builders:
    def __init__(self, context: 'AsyncApplications') -> None:
          self.context = context

    def build_ws_connection(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', websocket: 'WebSocket') -> 'WebSocketConnection':
        conn = WebSocketConnection(origin_id, dest_id, origin_type, msg_router, websocket)
        # Notify MessageRouter
        msg_router.receive_new_connection(conn)
        self.context.add_and_start_application(conn)
        '''
        Somewhere in code:
            msg_router.receive_new_connection(c)
            c.link_queue(existing_inbox)
        '''

        # TODO c.start()
        return conn

    def build_model_connection(self, origin_id: str, dest_id: str, origin_type: 'S2OriginType', msg_router: 'MessageRouter', model: 'Model') -> 'ModelConnection':
        conn = ModelConnection(origin_id, dest_id, origin_type, msg_router, model)
        msg_router.receive_new_connection(conn)
        self.context.add_and_start_application(conn)
        '''
        Somewhere in code:
            msg_router.receive_new_connection(c)
            c.link_queue(existing_inbox)
        '''

        # TODO c.start()
        return conn
