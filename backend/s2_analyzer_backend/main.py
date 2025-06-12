import argparse
import logging
import logging.config
import os
import signal
import threading

from s2_analyzer_backend.message_processor.database import create_db_and_tables, engine
from s2_analyzer_backend.message_processor.message_processor import (
    DebuggerFrontendMessageProcessor,
    MessageLoggerProcessor,
    MessageProcessorHandler,
    MessageParserProcessor,
    MessageProcessorHandlerBuilder,
    MessageStorageProcessor,
    SessionUpdateMessageProcessor,
)
from s2_analyzer_backend.rest_apis.rest_api import RestAPI
from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.app_logging import get_log_config
from s2_analyzer_backend.device_connection.router import MessageRouter
from s2_analyzer_backend.config import CONFIG

LOGGER = logging.getLogger(__name__)

log_config = get_log_config()
logging.config.dictConfig(get_log_config())


def main():

    # Initialise and create the database tables in an SQLite db
    create_db_and_tables()

    debugger_frontend_msg_processor = DebuggerFrontendMessageProcessor()
    session_update_msg_processor = SessionUpdateMessageProcessor()
    builder = MessageProcessorHandlerBuilder()

    # ! Order of the processors matters!
    msg_processor_handler = (
        builder.with_message_processor(MessageLoggerProcessor())
        .with_message_processor(MessageParserProcessor())
        .with_message_processor(MessageStorageProcessor(engine))
        .with_message_processor(debugger_frontend_msg_processor)
        .with_message_processor(session_update_msg_processor)
        .build()
    )

    # Routes received from a CEM or RM device to the destination device.
    msg_router = MessageRouter(msg_processor_handler=msg_processor_handler)

    # Start the RestAPI server. This will receive the websocket connections from the CEM and RM devices.
    # It also handles the debugger frontend connections and the RestAPI endpoints
    APPLICATIONS.add_and_start_application(
        RestAPI(
            CONFIG.http_listen_address,
            CONFIG.http_port,
            msg_router,
            debugger_frontend_msg_processor,
            session_update_msg_processor,
        )
    )

    # MEssage Processor Handler Runs on it's own thread so that it doesn't block the routing of messages.
    APPLICATIONS.add_and_start_application(msg_processor_handler)

    # Handle exit conditions.
    def handle_exit(sig, frame):
        LOGGER.info("Received stop from signal to stop.")
        threading.Thread(target=APPLICATIONS.stop).start()

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    signal.signal(signal.SIGQUIT, handle_exit)

    APPLICATIONS.run_all()


if __name__ == "__main__":
    main()
