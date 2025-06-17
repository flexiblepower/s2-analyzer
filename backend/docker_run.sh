#!/usr/bin/env sh

cd /app/ 

export S2_ANALYZER_CONF=./deployment/config.yaml

exec python3 -m s2_analyzer_backend.main