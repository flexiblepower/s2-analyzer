import argparse
import logging
from pathlib import Path
import os
import signal

from s2_analyzer_backend.s2_json_schema_validator import S2JsonSchemaValidator
from s2_analyzer_backend.rest_api import RestAPI
from s2_analyzer_backend.async_application import AsyncApplications
from s2_analyzer_backend.app_logging import LogLevel, setup_logging
from s2_analyzer_backend.router import MessageRouter
from s2_analyzer_backend.config import init_models

from s2_analyzer_backend.model import ModelRegistry
from s2_analyzer_backend.cem_model_simple.cem_model_simple import CEM

LOGGER = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(prog='S2 analyzer backend')
    parser.add_argument('--s2-json-schemas-dir', required=True, type=str)

    args = parser.parse_args()

    setup_logging(LogLevel.parse(os.getenv('LOG_LEVEL', 'INFO')))

    s2_json_schemas_dir = Path(args.s2_json_schemas_dir)
    if not s2_json_schemas_dir.is_dir():
        print(f'Cannot find s2 json schemas directory {s2_json_schemas_dir}')
    s2_validator = S2JsonSchemaValidator(s2_json_schemas_dir)
    s2_validator.setup()

    mr = ModelRegistry()
    msg_router = MessageRouter(s2_validator, mr)

    applications = AsyncApplications()
    applications.add_application(RestAPI('0.0.0.0', 8001, msg_router))

    def handle_exit(sig, frame):
        LOGGER.info("Received stop from signal to stop.")
        applications.stop()

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    signal.signal(signal.SIGQUIT, handle_exit)

    # m = DummyModel('dummy_model', msg_router)
    # m = CEM('dummy_model', msg_router)

    models = init_models(msg_router)
    for m in models:
        applications.add_application(m)
        mr.add_model(m)
    applications.run_all()


if __name__ == '__main__':
    main()
