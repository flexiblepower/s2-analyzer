#!/bin/bash

. .venv/bin/activate

S2_ANALYZER_CONF=deployment/config.yaml LOG_LEVEL=debug python3 -m s2_analyzer_backend.main
