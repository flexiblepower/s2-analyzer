import asyncio
import requests
import websockets
import yaml
import json

async def send_websocket_message(ws_url: str, payload: dict):
    async with websockets.connect(ws_url) as websocket:
        print(f"Connected to {ws_url}")
        await websocket.send(json.dumps(payload))
        print(f"Sent: {payload}")

        try:
            response_str = await websocket.recv()
            response_data = json.loads(response_str)
            print(f"Received: {response_data}")
        except websockets.exceptions.ConnectionClosed:
            print("WebSocket connection closed by the server.")


def send_http_request(url: str):
    response = requests.get(url)
    print(f"GET {url} -> status {response.status_code}")
    print("Response text:", response.text)


async def main():
    # Load config
    with open("config.yaml", "r") as f:
        config = yaml.safe_load(f)
    
    base_url = config["api"]["base_url"]
    root_path = config["api"]["root_path"]
    rm_ws_path = config["api"]["rm_ws_path"]
    cem_ws_path = config["api"]["cem_ws_path"]

    # 1) Example: Send a simple HTTP GET
    url = base_url + root_path
    send_http_request(url)

    # 2) Example: Send a WebSocket message to /backend/rm/123/cem/abc/ws
    rm_id = "123"
    cem_id = "abc"
    ws_url = base_url.replace("http", "ws") + rm_ws_path.format(rm_id=rm_id, cem_id=cem_id)
    payload = {"message": "Hello from containerized script!"}
    await send_websocket_message(ws_url, payload)

if __name__ == "__main__":
    asyncio.run(main())