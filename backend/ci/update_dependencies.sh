#!/usr/bin/env sh

pip-compile -o ./requirements.txt ./requirements.in
pip-compile -o ./dev-requirements.txt ./dev-requirements.in
