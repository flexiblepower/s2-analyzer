#!/usr/bin/env sh

. .venv/bin/activate
python -m piptools compile -U -o ./requirements.txt ./requirements.in
python -m piptools compile -U -o ./dev-requirements.txt ./dev-requirements.in
