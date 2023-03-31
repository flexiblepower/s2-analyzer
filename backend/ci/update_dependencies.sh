#!/usr/bin/env sh

python -m piptools compile -o ./requirements.txt ./requirements.in
python -m piptools compile -o ./dev-requirements.txt ./dev-requirements.in
