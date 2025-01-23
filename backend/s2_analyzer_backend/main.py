import argparse
import logging
import os
import signal
import threading

from s2_analyzer_backend.database import create_db_and_tables, engine
from s2_analyzer_backend.message_processor import (
    DebuggerFrontendMessageProcessor,
    MessageLoggerProcessor,
    MessageProcessorHandler,
    MessageParserProcessor,
    MessageStorageProcessor,
)
from s2_analyzer_backend.rest_apis.rest_api import RestAPI
from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.app_logging import LogLevel, setup_logging
from s2_analyzer_backend.router import MessageRouter
from s2_analyzer_backend.config import CONFIG

LOGGER = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(prog="S2 analyzer backend")
    args = parser.parse_args()

    setup_logging(LogLevel.parse(os.getenv("LOG_LEVEL", "INFO")))

    create_db_and_tables()

    msg_processor_handler = MessageProcessorHandler()

    msg_processor_handler.add_message_processor(MessageLoggerProcessor())
    msg_processor_handler.add_message_processor(MessageParserProcessor())
    msg_processor_handler.add_message_processor(MessageStorageProcessor(engine))
    debugger_frontend_msg_processor = DebuggerFrontendMessageProcessor()
    msg_processor_handler.add_message_processor(debugger_frontend_msg_processor)

    msg_router = MessageRouter(msg_processor_handler=msg_processor_handler)

    APPLICATIONS.add_and_start_application(
        RestAPI(
            CONFIG.http_listen_address,
            CONFIG.http_port,
            msg_router,
            debugger_frontend_msg_processor,
        )
    )
    APPLICATIONS.add_and_start_application(msg_processor_handler)

    def handle_exit(sig, frame):
        LOGGER.info("Received stop from signal to stop.")
        threading.Thread(target=APPLICATIONS.stop).start()

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    signal.signal(signal.SIGQUIT, handle_exit)

    APPLICATIONS.run_all()


if __name__ == "__main__":
    main()
