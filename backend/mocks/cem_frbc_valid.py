import asyncio
import datetime
import json
import websockets.client as ws

import pytz


async def send_message_and_receive_ack(websocket, log_msg: str, msg: dict):
    print(datetime.datetime.now(tz=pytz.UTC).isoformat(), f'Sending {msg["message_type"]}.')
    await websocket.send(json.dumps(msg))
    reception_status = await websocket.recv()
    print(datetime.datetime.now(tz=pytz.UTC).isoformat(), f'Received RS {msg["message_type"]}', reception_status)


async def receive_message_and_ack(websocket, log_msg: str):
    msg = json.loads(await websocket.recv())
    print(datetime.datetime.now(tz=pytz.UTC).isoformat(), f'Received {msg["message_type"]}', msg)
    reception_status = {
        'message_type': 'ReceptionStatus',
        'subject_message_id': msg['message_id'],
        'status': 'OK'
    }
    await websocket.send(json.dumps(reception_status))
    print(datetime.datetime.now(tz=pytz.UTC).isoformat(), f'Send RS {msg["message_type"]}', reception_status)


async def main():
    async with ws.connect("ws://localhost:8001/backend/cem/cem_mock/rm/battery1/ws") as websocket:
        # Recv Handshake & send ReceptionStatus
        await receive_message_and_ack(websocket, "Handshake")

        # Send Handshake & recv ReceptionStatus
        await send_message_and_receive_ack(websocket, "Handshake", {
            'message_type': 'Handshake',
            'message_id': '00ef6f72-257c-46a5-a656-07887903eb09',
            'role': 'CEM',
            'supported_protocol_versions': ['0.0.1-beta']
        })

        # Send HandshakeResponse & recv ReceptionStatus
        await send_message_and_receive_ack(websocket, "HandshakeResponse", {
            'message_type': 'HandshakeResponse',
            'message_id': 'ae1b9d1c-c5ca-4ea7-aeb7-6521aa26a382',
            'selected_protocol_version': '0.0.1-beta'
        })


asyncio.run(main())
