#!/usr/bin/env sh

source .venv/bin/activate
mypy ./s2_analyzer_backend/ ./test/
