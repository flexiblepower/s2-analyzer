#!/usr/bin/env sh

cd /app/

exec python3 -m s2_analyzer_backend.main --s2-json-schemas-dir ./s2-ws-json/s2-json-schema/
