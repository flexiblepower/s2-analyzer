import asyncio
import websockets

# Store messages from the first client
messages = []

# Keep track of connected clients
connected_clients = {
    'backend': None,
    'frontend': None
}

async def handler(websocket, path):
    try:
        # Wait for the client to send its initial message
        greeting = await websocket.recv()

        if greeting == "hi from backend":
            connected_clients['backend'] = websocket
            await handle_backend_client(websocket)
        elif greeting == "Hi from frontend":
            connected_clients['frontend'] = websocket
            await handle_frontend_client(websocket)
        else:
            await websocket.close()
    except websockets.ConnectionClosed:
        pass

async def handle_backend_client(websocket):
    global messages
    while True:
        try:
            message = await websocket.recv()
            messages.append(message)
            if connected_clients['frontend'] is not None:
                await connected_clients['frontend'].send(message)
        except websockets.ConnectionClosed:
            break

async def handle_frontend_client(websocket):
    global messages
    # Send all stored messages to the frontend client
    for message in messages:
        await websocket.send(message)

    # Create a task to forward new messages from backend to frontend
    async def forward_messages():
        while True:
            if connected_clients['backend'] is None:
                await asyncio.sleep(0.1)
                continue

            try:
                message = await connected_clients['backend'].recv()
                await websocket.send(message)
            except websockets.ConnectionClosed:
                break

    forward_task = asyncio.create_task(forward_messages())

    try:
        await websocket.wait_closed()
    finally:
        forward_task.cancel()

async def main():
    async with websockets.serve(handler, "0.0.0.0", 5000):
        await asyncio.Future()  # Run forever

asyncio.run(main())
