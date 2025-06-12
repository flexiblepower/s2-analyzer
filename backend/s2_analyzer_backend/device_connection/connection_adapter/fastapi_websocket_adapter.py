from starlette.websockets import WebSocket, WebSocketDisconnect, WebSocketState
from .adapter import (
    ConnectionAdapter,
    ConnectionClosed,
    ConnectionError,
)


class FastAPIWebSocketAdapter(ConnectionAdapter[str]):
    """Wrap the FastAPI websocket in the adapter since the websockets package has a different API."""

    def __init__(self, websocket: WebSocket):
        self.connected = True
        self.websocket = websocket

    async def receive(self) -> str:
        if not self.connected:
            raise ConnectionClosed
        try:
            data = await self.websocket.receive_text()
            return data
        except WebSocketDisconnect as e:
            self.connected = False
            raise ConnectionClosed(f"Websocket is closed: {e}")
        except RuntimeError as e:
            # Starlette raises RuntimeError if the connection is closed
            self.connected = False
            raise ConnectionClosed(f"Websocket is closed: {e}")
        except Exception as e:
            raise ConnectionError(f"Unknown websocket error: {e}")

    async def send(self, message: str):
        try:
            await self.websocket.send_text(message)
        except RuntimeError as e:
            # Starlette raises RuntimeError if the connection is closed
            self.connected = False
            raise ConnectionClosed(f"Websocket is closed: {e}")
        except Exception as e:
            raise ConnectionError(f"Unknown websocket error: {e}")

    @property
    def open(self) -> bool:
        return (
            self.websocket.application_state == WebSocketState.CONNECTED
            and self.connected
        )

    async def close(self, code: int = 1000, reason: str = ""):
        try:
            if self.open:
                await self.websocket.close(code=code)
        except Exception as e:
            raise ConnectionError(f"Error closing websocket: {e}")
