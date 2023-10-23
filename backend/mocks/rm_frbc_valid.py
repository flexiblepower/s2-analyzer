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
    async with ws.connect("ws://localhost:8001/backend/rm/battery1/cem/cem_mock/ws") as websocket:
        # Send Handshake & recv ReceptionStatus
        await send_message_and_receive_ack(websocket, "Handshake", {
            'message_type': 'Handshake',
            'message_id': '7dd55ca8-f15c-4cad-adf5-154d11a9a2e1',
            'role': 'RM',
            'supported_protocol_versions': ['0.0.1-beta']
        })

        # Recv Handshake & send ReceptionStatus
        await receive_message_and_ack(websocket, "Handshake")

        # Recv HandshakeResponse & send ReceptionStatus
        await receive_message_and_ack(websocket, "HandshakeResponse")

        # Send ResourceManagerDetails
        await send_message_and_receive_ack(websocket, "ResourceManagerDetails", {
            'message_type': 'ResourceManagerDetails',
            'message_id': '2d717c61-8500-4e8f-87a8-114b51acc08b',
            'resource_id': '0309eaef-4fbb-4c9c-aa90-58bde4f4b07c',
            'name': 'battery1',
            'roles': [{
                'role': 'ENERGY_STORAGE',
                'commodity': 'ELECTRICITY'
            }],
            'manufacturer': 'APC',
            'model': 'SMT500I',
            'serial_number': 'kellox',
            'firmware_version': '1.2.5',
            'instruction_processing_delay': 100,  # milliseconds
            'available_control_types': ['FILL_RATE_BASED_CONTROL'],
            'currency': 'EUR',
            'provides_forecast': False,
            'provides_power_measurement_types': ['ELECTRIC.POWER.L1']
        })

        # Recv SelectControlType (expect FRBC) & ReceptionStatus
        await receive_message_and_ack(websocket, "SelectControlType (expect FRBC)")

        # Send PowerMeasurement
        await send_message_and_receive_ack(websocket, "PowerMeasurement", {
            'message_type': 'PowerMeasurement',
            'message_id': 'c18bfa3b-7bec-46e6-b859-cb8dec5f1023',
            'measurement_timestamp': datetime.datetime.now(tz=pytz.UTC).isoformat(),
            'values': [
                {'commodity_quantity': 'ELECTRIC.POWER.L1', 'value': 30}
            ]
        })

        # Send ActuatorStatus
        await send_message_and_receive_ack(websocket, "FRBC.ActuatorStatus", {
            'message_type': 'FRBC.ActuatorStatus',
            'message_id': '207373ca-fa16-4677-9bcf-9bcc42870896',
            'actuator_id': '69cb9071-9d77-40a6-a881-df429d5f562f',
            'active_operation_mode_id': '3ce97655-91a1-487f-adce-26a86e282c1f',
            'operation_mode_factor': 0.5
        })

        # Send StorageStatus
        await send_message_and_receive_ack(websocket, "FRBC.StorageStatus", {
            'message_type': 'FRBC.StorageStatus',
            'message_id': '9a13c101-0795-473e-a238-2a0675b4708a',
            'present_fill_level': 85
        })

        # Send SystemDescription
        await send_message_and_receive_ack(websocket, "FRBC.SystemDescription", {
            'message_type': 'FRBC.SystemDescription',
            'message_id': 'e698768f-09e3-4328-9713-c2901e895492',
            'valid_from': datetime.datetime.now(tz=pytz.UTC).isoformat(),
            'actuators': [{
                'id': '69cb9071-9d77-40a6-a881-df429d5f562f',
                'diagnostic_label': 'charge_discharge_idle',
                'supported_commodities': ['ELECTRICITY'],
                'operation_modes': [
                    {
                        'id': '3ce97655-91a1-487f-adce-26a86e282c1f',
                        'diagnostic_label': 'charge_discharge_idle',
                        'elements': [{
                            'fill_level_range': {'start_of_range': 0, 'end_of_range': 100},
                            'fill_rate': {'start_of_range': -5.33, 'end_of_range': 5.33},
                            'power_ranges': [{
                                'start_of_range': -80_000,
                                'end_of_range': 80_000,
                                'commodity_quantity': 'ELECTRIC.POWER.L1'
                            }],
                        }],
                        'abnormal_condition_only': False,
                    }
                ],
                'transitions': [],
                'timers': []
            }],
            'storage': {
                'diagnostic_label': 'electrical battery',
                'fill_level_label': 'SoC %',
                'provides_leakage_behaviour': False,
                'provides_fill_level_target_profile': False,
                'provides_usage_forecast': False,
                'fill_level_range': {'start_of_range': 0, 'end_of_range': 100}
            }
        })

        # Send Fill Level Target profile
        await send_message_and_receive_ack(websocket, "FRBC.FillLevelTargetProfile", {
            'message_type': 'FRBC.FillLevelTargetProfile',
            'message_id': '9aa7a698-a843-4e2d-affd-849110bf46af',
            'start_time': datetime.datetime.now(tz=pytz.UTC).isoformat(),
            'elements': [{
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 100, 'end_of_range': 100}
                }, {
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 80, 'end_of_range': 80}
                }, {
                    'duration': 60,
                    'fill_level_range': {'start_of_range': 30, 'end_of_range': 60}
                }
            ]
        })

        # Recv Instructions
        while True:
            await receive_message_and_ack(websocket, "Instruction")

asyncio.run(main())
