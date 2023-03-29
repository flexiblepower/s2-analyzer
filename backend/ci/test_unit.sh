#!/usr/bin/env sh

source .venv/bin/activate
python -m pytest --cov=s2_analyzer_backend --cov-report=html:./unit_test_coverage/ -v
