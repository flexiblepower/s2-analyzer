import asyncio
import websockets

# Python intermediary to forward messages from the frontend to backend.

clients = set()

async def handle_message(message, sender):
    print(f"Received message: {message}")
    for client in clients:
        if client != sender:
            await client.send(message)
            print(f"Sent message: {message} to client {client}")

async def handler(websocket, path):
    clients.add(websocket)
    print(f"Client connected: {websocket}")
    try:
        async for message in websocket:
            await handle_message(message, websocket)
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed: {e}")
    finally:
        clients.remove(websocket)

start_server = websockets.serve(handler, "0.0.0.0", 5000)

asyncio.get_event_loop().run_until_complete(start_server)
print("WebSocket server started on ws://socket:5000 in docker, ws://localhost:5000 in local.")
asyncio.get_event_loop().run_forever()
