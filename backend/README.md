# S2 analyzer backend

## Quickstart

In order to run the s2 analyzer both an S2 resource manager (RM) and an S2 Customer Energy Manager (CEM) are also
required. These can be simulated or real.

1. To start the S2 analyzer using a docker container:

```bash
docker compose up --build
# S2 analyzer is now available on port 8001
```

2. Connect the CEM and RM devices to the S2 analyzer using the following URLs. See [CEM & RM Connections](#cem--rm-connections) for more information.

3. Connect to the [debugger websocket](#debugger-websocket) to see messages in transit.

## Features

The s2 analyzer acts as a man in the middle between a CEM and RM connection. All messages sent between the CEM and RM are forwarded through the S2 analyzer. The S2 analyzer also keeps a history of all messages sent between the CEM and RM. 

### CEM & RM Connections

An RM may then connect using the following url: `"ws://localhost:8001/backend/rm/battery1/cem/cem1/ws"`
where `battery1` is an arbitrary id for the RM and the `cem1` is an arbitrary id for the CEM. These do NOT correspond
with any S2 related values and exist only within the S2 analyzer scope to connect RM's and CEM's together.

Likewise, a CEM may then connect using the following URL: `ws://localhost:8001/backend/cem/cem1/rm/battery1/ws`.

Once both a CEM and RM have connected to the S2 analyzer will the S2 analyzer start forwarding messages.
If a message is send by either the CEM or RM before the other connects, the messages are cached in memory.
This is also the reason why in the connection history (see next section) the S2 analyzer regards receiving a message
and forwarding a message as 2 separate events.

### Debugger Websocket

A websocket connection can be opened to `ws://localhost:8001/backend/debugger` which will be able to view all of the messages. Messages on the debugger websocket will look like the following.

```json
{
  "cem_id": "cem1",
  "rm_id": "battery1",
  "origin": "RM",
  "s2_msg": {
    "message_id": "828aec25-402b-48e6-99fd-3f2fd90b4b73",
    "message_type": "FRBC.StorageStatus"
  },
  "s2_msg_type": "FRBC.StorageStatus",
  "timestamp": "2025-01-22T10:22:21.598741",
  "validation_errors": [
    {
      "error_details": null,
      "type": "missing",
      "loc": "('present_fill_level',)",
      "msg": "Field required",
      "id": 1,
    }
  ]
}
```

### Message Injection

You can inject messages into a channel between 2 CEM or RM devices by sending a message to the endpoint `http://localhost:8001/backend/inject` with the following body:

```json
{
  "sender": "cem1",
  "receiver": "rm1",
  "message": "{...}",
}
```

This will inject the message into the channel to `rm1` and will look like it came from `cem1`. No validation is performed on this message.

## Configuration
Main configuration parameters may be passed through a `.yaml` file. An example:

```yaml
http_listen_address: 0.0.0.0  # The HTTP listen address on which new websocket connections are expected.
http_port: 8001  # The HTTP port on which new websocket connections are expected.
```

In addition the following environment variables may be used for configuration purposes. As they are less often
needed, they were not added to the configuration file.

```bash
S2_ANALYZER_CONF=config.yaml  # Path to the config.yaml file relevative to the current working directory.
LOG_LEVEL=INFO  # May be DEBUG, INFO, WARNING or ERROR.
```

## Development workflow
### Preparation of development environment
```bash
python -m venv ./.venv
. ./.venv/bin/activate
pip install pip-tools
ci/install_dependencies.sh
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