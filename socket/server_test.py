import asyncio
import websockets

# Class for testing the websocket server and troubleshooting any issues.

class WebSocketClient:
    def __init__(self, uri: str, client_type: str):
        self.uri = uri
        self.connection = None
        self.client_type = client_type

    async def connect(self):
        try:
            self.connection = await websockets.connect(self.uri)
            print(f"Connected to WebSocket server at {self.uri} as {self.client_type}")
        except Exception as e:
            print(f"Connection error: {e}")

    async def send_message(self, message: str):
        if self.connection is None:
            print("WebSocket connection is not established. Connect first.")
            return

        await self.connection.send(message)

    async def receive_message(self):
        if self.connection is None:
            print("WebSocket connection is not established. Connect first.")
            return

        message = await self.connection.recv()
        return message

    async def close(self):
        if self.connection is not None:
            await self.connection.close()
            print("WebSocket connection closed")

class ServerTest:
    def __init__(self):
        self.backend_client = WebSocketClient("ws://localhost:5000", "backend")
        self.frontend_client = WebSocketClient("ws://localhost:5000", "frontend")
    
    async def connect(self):
        print("Starting Test")
        await self.backend_client.connect()
        await self.frontend_client.connect()

        try:
            await self.backend_client.send_message("hi from backend") # Test Connecting Backend
            print("- Backend Hello Sent")
        except Exception as e:
            print(f"Failed to send backend hello with error: {e}")

        try:
            await self.backend_client.send_message("test message from backend") # Test Sending Message
            print("- Backend Test Message Sent")
        except Exception as e:
            print(f"Failed to send backend test message with error: {e}")

        try:
            await self.frontend_client.send_message("Hi from frontend") # Test Connecting Frontend
            print("- Frontend Hello Sent")
        except Exception as e:
            print(f"Failed to send frontend hello with error: {e}")

        try:
            message = await self.frontend_client.receive_message()
            if message == "test message from backend":                # Verify the frontend client receives the message
                print("- Frontend client received the correct message from backend")
            else:
                print("Frontend client did not receive the correct message")
        except Exception as e:
            print(f"Failed to receive message with error: {e}")

        # Close connections
        await self.backend_client.close()
        await self.frontend_client.close()
        print("All Tests Completed & Passed!")

async def main():
    server_test = ServerTest()
    await server_test.connect()  # Connect

if __name__ == "__main__":
    asyncio.run(main())  # Run the coroutine using asyncio.run
