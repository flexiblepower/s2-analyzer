#!/bin/bash

. .venv/bin/activate

LOG_LEVEL=debug python3 -m s2_analyzer_backend.s2_analyzer_backend --s2-json-schemas-dir ./s2-ws-json/s2-json-schema/messages/
