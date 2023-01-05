#!/bin/bash

. .venv/bin/activate
mypy ./ev_flex_metric/ ./test/
