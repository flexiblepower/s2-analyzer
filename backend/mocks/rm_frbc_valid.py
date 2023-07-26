import asyncio
import datetime
import json
import websockets

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
    async with websockets.connect("ws://localhost:8001/backend/rm/battery1/cem/dummy_model/ws") as websocket:
        # Send Handshake & recv ReceptionStatus
        await send_message_and_receive_ack(websocket, "Handshake", {
            'message_type': 'Handshake',
            'message_id': 'm1',
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
            'message_id': 'm3',
            'resource_id': 'battery1',
            'name': 'Some Battery 1',
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
            'message_id': 'm5',
            'measurement_timestamp': datetime.datetime.now(tz=pytz.UTC).isoformat(),
            'values': [
                {'commodity_quantity': 'ELECTRIC.POWER.L1', 'value': 30}
            ]
        })

        # Send ActuatorStatus
        await send_message_and_receive_ack(websocket, "FRBC.ActuatorStatus", {
            'message_type': 'FRBC.ActuatorStatus',
            'message_id': 'm6',
            'actuator_id': 'actuator1',
            'active_operation_mode_id': 'om0',
            'operation_mode_factor': 0.5
        })

        # Send StorageStatus
        await send_message_and_receive_ack(websocket, "FRBC.StorageStatus", {
            'message_type': 'FRBC.StorageStatus',
            'message_id': 'm7',
            'present_fill_level': 85
        })

        # Send SystemDescription
        await send_message_and_receive_ack(websocket, "FRBC.SystemDescription", {
            'message_type': 'FRBC.SystemDescription',
            'message_id': 'm8',
            'valid_from': datetime.datetime.now(tz=pytz.UTC).isoformat(),
            'actuators': [{
                'id': 'actuator1',
                'diagnostic_label': 'charge_discharge_idle',
                'supported_commodities': ['ELECTRICITY'],
                'operation_modes': [
                    {
                        'id': 'om0',
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
            'message_id': 'm9',
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
