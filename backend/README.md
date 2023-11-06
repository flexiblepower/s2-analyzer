# S2 analyzer backend

## Quickstart
In order to run the s2 analyzer both an S2 resource manager (RM) and an S2 Customer Energy Manager (CEM) are also
required. In the current release a mock FRBC CEM may substitute a real CEM instead and may be configured as a 'Model' in the `yaml` configuration file.
Per default, an FRBC CEM is available with the id `dummy_model`.

To start the S2 analyzer using a docker container:
```bash
mkdir connection_histories/
# Make any changes to deployment/config.yaml
docker compose up --build
# S2 analyzer is now available on port 8001
```

An RM may then connect using the following url: `"ws://localhost:8001/backend/rm/battery1/cem/cem1/ws"`
where `battery1` is an arbitrary id for the RM and the `cem1` is an arbitrary id for the CEM. These do NOT correspond
with any S2 related values and exist only within the S2 analyzer scope to connect RM's and CEM's together.

Likewise, a CEM may then connect using the following URL: `ws://localhost:8001/backend/cem/cem1/rm/battery1/ws`.

Once both a CEM and RM have connected to the S2 analyzer will the S2 analyzer start forwarding messages.
If a message is send by either the CEM or RM before the other connects, the messages are cached in memory.
This is also the reason why in the connection history (see next section) the S2 analyzer regards receiving a message
and forwarding a message as 2 separate events.

## Connection history
Each pair of RM and CEM would share a single websocket connection on which they would send and receive their traffic.
However, the S2 analyzer uses a man-in-the-middle approach where both the RM and CEM connect to the S2 analyzer instead.
Each pair of connections (RM, S2 analyzer) and (CEM, S2 analyzer) which connect the CEM and the RM is considered to
be a complete connection. For each complete connection, a file is created in the `connection_histories` directory
which detail and list the traffic received and forwarded to the CEM and RM by the S2 analyzer.

These files have a readable, static format to allow for easy processing in CLI with `grep` and `tail`.

A small example excerpt of what to expect:

```commandline
2023-10-23 16:58:15 Connection initiated from 'battery1' to S2-analyzer.
2023-10-23 16:58:15 Connection initiated from 'dummy_model' to S2-analyzer.
2023-10-23 16:58:15 [Message received][Sender: RM battery1][Receiver: CEM dummy_model] Message: {"message_type": "Handshake", "message_id": "7dd55ca8-f15c-4cad-adf5-154d11a9a2e1", "role": "RM", "supported_protocol_versions": ["0.0.1-beta"]}
2023-10-23 16:58:15 [Message forwarded][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'Handshake', 'message_id': '7dd55ca8-f15c-4cad-adf5-154d11a9a2e1', 'role': 'RM', 'supported_protocol_versions': ['0.0.1-beta']}
2023-10-23 16:58:15 [Message received][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '7dd55ca8-f15c-4cad-adf5-154d11a9a2e1', 'status': 'OK'}
2023-10-23 16:58:15 [Message forwarded][Sender: RM battery1][Receiver: CEM dummy_model] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '7dd55ca8-f15c-4cad-adf5-154d11a9a2e1', 'status': 'OK'}
2023-10-23 16:58:15 [Message received][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'Handshake', 'message_id': '0d212b62-c673-42ab-a586-d0669a06fa6f', 'role': 'CEM', 'supported_protocol_versions': ['0.0.1-beta']}
2023-10-23 16:58:15 [Message forwarded][Sender: RM battery1][Receiver: CEM dummy_model] Message: {'message_type': 'Handshake', 'message_id': '0d212b62-c673-42ab-a586-d0669a06fa6f', 'role': 'CEM', 'supported_protocol_versions': ['0.0.1-beta']}
2023-10-23 16:58:15 [Message received][Sender: RM battery1][Receiver: CEM dummy_model] Message: {"message_type": "ReceptionStatus", "subject_message_id": "0d212b62-c673-42ab-a586-d0669a06fa6f", "status": "OK"}
2023-10-23 16:58:15 [Message forwarded][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '0d212b62-c673-42ab-a586-d0669a06fa6f', 'status': 'OK'}
2023-10-23 16:58:15 [Message received][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'HandshakeResponse', 'message_id': '85ec04ab-a968-4fac-94e8-79b883d590f2', 'selected_protocol_version': '0.0.1-beta'}
2023-10-23 16:58:15 [Message forwarded][Sender: RM battery1][Receiver: CEM dummy_model] Message: {'message_type': 'HandshakeResponse', 'message_id': '85ec04ab-a968-4fac-94e8-79b883d590f2', 'selected_protocol_version': '0.0.1-beta'}
2023-10-23 16:58:15 [Message received][Sender: RM battery1][Receiver: CEM dummy_model] Message: {"message_type": "ReceptionStatus", "subject_message_id": "85ec04ab-a968-4fac-94e8-79b883d590f2", "status": "OK"}
2023-10-23 16:58:15 [Message forwarded][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '85ec04ab-a968-4fac-94e8-79b883d590f2', 'status': 'OK'}
2023-10-23 16:58:15 [Message received][Sender: RM battery1][Receiver: CEM dummy_model] Message: {"message_type": "ResourceManagerDetails", "message_id": "2d717c61-8500-4e8f-87a8-114b51acc08b", "resource_id": "0309eaef-4fbb-4c9c-aa90-58bde4f4b07c", "name": "battery1", "roles": [{"role": "ENERGY_STORAGE", "commodity": "ELECTRICITY"}], "manufacturer": "APC", "model": "SMT500I", "serial_number": "kellox", "firmware_version": "1.2.5", "instruction_processing_delay": 100, "available_control_types": ["FILL_RATE_BASED_CONTROL"], "currency": "EUR", "provides_forecast": false, "provides_power_measurement_types": ["ELECTRIC.POWER.L1"]}
2023-10-23 16:58:15 [Message forwarded][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'ResourceManagerDetails', 'message_id': '2d717c61-8500-4e8f-87a8-114b51acc08b', 'resource_id': '0309eaef-4fbb-4c9c-aa90-58bde4f4b07c', 'name': 'battery1', 'roles': [{'role': 'ENERGY_STORAGE', 'commodity': 'ELECTRICITY'}], 'manufacturer': 'APC', 'model': 'SMT500I', 'serial_number': 'kellox', 'firmware_version': '1.2.5', 'instruction_processing_delay': 100, 'available_control_types': ['FILL_RATE_BASED_CONTROL'], 'currency': 'EUR', 'provides_forecast': False, 'provides_power_measurement_types': ['ELECTRIC.POWER.L1']}
2023-10-23 16:58:15 [Message received][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '2d717c61-8500-4e8f-87a8-114b51acc08b', 'status': 'OK'}
2023-10-23 16:58:15 [Message forwarded][Sender: RM battery1][Receiver: CEM dummy_model] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '2d717c61-8500-4e8f-87a8-114b51acc08b', 'status': 'OK'}
2023-10-23 16:58:15 [Message received][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'SelectControlType', 'message_id': '7a3d1060-dc44-4262-b35c-6b335e181403', 'control_type': 'FILL_RATE_BASED_CONTROL'}
2023-10-23 16:58:15 [Message forwarded][Sender: RM battery1][Receiver: CEM dummy_model] Message: {'message_type': 'SelectControlType', 'message_id': '7a3d1060-dc44-4262-b35c-6b335e181403', 'control_type': 'FILL_RATE_BASED_CONTROL'}
2023-10-23 16:58:15 [Message received][Sender: RM battery1][Receiver: CEM dummy_model] Message: {"message_type": "ReceptionStatus", "subject_message_id": "7a3d1060-dc44-4262-b35c-6b335e181403", "status": "OK"}
2023-10-23 16:58:15 [Message forwarded][Sender: CEM dummy_model][Receiver: RM battery1] Message: {'message_type': 'ReceptionStatus', 'subject_message_id': '7a3d1060-dc44-4262-b35c-6b335e181403', 'status': 'OK'}
...
2023-10-23 16:58:55 Connection from 'battery1' to S2-analyzer has closed.
2023-10-23 16:58:55 Connection from 'dummy_model' to S2-analyzer has closed.
```

## Configuration
Main configuration parameters may be passed through a `.yaml` file. An example:

```yaml
http_listen_address: 0.0.0.0  # The HTTP listen address on which new websocket connections are expected.
http_port: 8001  # The HTTP port on which new websocket connections are expected.
connection_histories: ./connection_histories/  # The location on disk to which message history files are written.

models:  # A list of all internals models to initialize. Each model mock an RM or a CEM. Currently only FRBC CEM are supported.
  - model_type: "CEM"  # Role type. Currently only CEM is supported which mocks an FRBC CEM.
    model_id: "dummy_model"  # The CEM or RM id which is expected to be used in the websocket URL upon connecting.
```

In addition the following environment variables may be used for configuration purposes. As they are less often
needed, they were not added to the configuration file.

```bash
S2_ANALYZER_CONF=config.yaml  # Path to the config.yaml file relevative to the current working directory.
LOG_LEVEL=INFO  # May be DEBUG, INFO, WARNING or ERROR.
S2_MESSAGE_HISTORY_FILE_PREFIX=history  # The prefix added to the front of any file in which a connection history is stored.
S2_MESSAGE_HISTORY_FILE_SUFFIX=.txt  # The suffix/extension added to the end of any file in which a connection history is stored.
```

## Development workflow
### Preparation of development environment
```bash
python -m venv ./.venv
. ./.venv/bin/activate
pip install pip-tools
ci/install_dependencies.sh

git submodule update --init --recursive
```

### Updating dependencies
After you change a dependency in `dev-requirements.in` or `requirements.in` you can update the pinned
dependencies in `dev-requirements.txt` and `requirements.txt` with:
```bash
ci/update_dependencies.h
```

Finally, to install the new or updated dependencies:
```bash
ci/install_dependencies.sh
```

### Development tooling
To unit test:
```bash
ci/test_unit.sh
```

To typecheck:
```bash
ci/typecheck.sh
```

### Run the backend
To run the backend locally:
```bash
./run.sh
```