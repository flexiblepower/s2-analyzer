#!/usr/bin/env sh

source .venv/bin/activate
python -m pytest --cov=ev_flex_metric --cov-report=html:./unit_test_coverage/ -v
