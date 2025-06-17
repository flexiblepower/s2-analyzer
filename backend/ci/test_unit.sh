#!/usr/bin/env sh

uv run pytest --cov=s2_analyzer_backend --cov-report=html:./unit_test_coverage/ -v
