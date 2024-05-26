import asyncio
import websockets
import pytest
import pytest_asyncio
import sys
import os

# Import the server code
import server

# Fixture to start and stop the server
@pytest.fixture(scope="module")
async def server():
    server_instance = await websockets.serve(handler, "localhost", 51770)
    yield
    server_instance.close()
    await server_instance.wait_closed()

# Helper function to connect as a backend client
async def connect_backend():
    websocket = await websockets.connect("ws://localhost:51770")
    await websocket.send("hi from backend")
    return websocket

# Helper function to connect as a frontend client
async def connect_frontend():
    websocket = await websockets.connect("ws://localhost:51770")
    await websocket.send("Hi from frontend")
    return websocket

# Test that backend client messages are stored and forwarded to the frontend
@pytest.mark.asyncio
async def test_backend_messages_forwarded_to_frontend(server):
    backend = await connect_backend()
    frontend = await connect_frontend()

    # Send a message from the backend
    await backend.send("Message 1")
    
    # Receive the message on the frontend
    received_message = await frontend.recv()
    assert received_message == "Message 1"

# Test that stored messages are sent to the frontend upon connection
@pytest.mark.asyncio
async def test_stored_messages_sent_to_frontend(server):
    backend = await connect_backend()

    # Send a message from the backend before frontend connects
    await backend.send("Message 2")
    
    frontend = await connect_frontend()

    # Receive the stored message on the frontend
    received_message = await frontend.recv()
    assert received_message == "Message 2"

# Test that messages sent by the backend after the frontend connects are immediately forwarded
@pytest.mark.asyncio
async def test_backend_to_frontend_immediate_forwarding(server):
    backend = await connect_backend()
    frontend = await connect_frontend()

    # Send a message from the backend after frontend connects
    await backend.send("Message 3")
    
    # Receive the message on the frontend
    received_message = await frontend.recv()
    assert received_message == "Message 3"
