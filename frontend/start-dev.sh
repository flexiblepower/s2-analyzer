#!/bin/bash

docker-compose -f ./docker-compose.dev.yml run --service-ports --rm frontend
