import asyncio
import json
import websockets


async def main():
    async with websockets.connect("ws://localhost:8001/backend/rm/battery1/cem/dummy_model/ws") as websocket:
        message = {'message_type': 'FRBC.ActuatorStatus',
                   'message_id': '1234',
                   # 'active_operation_mode_id': '1234', <-- Is missing. So invalid message
                   'operation_mode_factor': 0.5,
                   'previous_operation_mode_id': '4321'}
        await websocket.send(json.dumps(message))
        print(await websocket.recv())

asyncio.run(main())
