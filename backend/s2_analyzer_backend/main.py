import argparse
import logging
import os
import signal
import threading
import asyncio

from s2_analyzer_backend.message_processor import MessageLoggerProcessor, MessageProcessorHandler
from s2_analyzer_backend.rest_api import RestAPI
from s2_analyzer_backend.async_application import APPLICATIONS
from s2_analyzer_backend.app_logging import LogLevel, setup_logging
from s2_analyzer_backend.router import MessageRouter
from s2_analyzer_backend.config import CONFIG #, #init_models

LOGGER = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(prog='S2 analyzer backend')
    args = parser.parse_args()

    setup_logging(LogLevel.parse(os.getenv('LOG_LEVEL', 'INFO')))
    
    msg_processor_handler = MessageProcessorHandler()
    msg_processor_handler.add_message_processor(MessageLoggerProcessor())
    msg_router = MessageRouter(msg_processor_handler=msg_processor_handler)

    APPLICATIONS.add_and_start_application(RestAPI(CONFIG.http_listen_address, CONFIG.http_port, msg_router))
    APPLICATIONS.add_and_start_application(msg_processor_handler)

    def handle_exit(sig, frame):
        LOGGER.info("Received stop from signal to stop.")
        threading.Thread(target=APPLICATIONS.stop).start()

    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)
    signal.signal(signal.SIGQUIT, handle_exit)

    '''Gordei: Commented out code to run mock models'''
    # models = init_models(msg_router, CONFIG)
    # for model in models:
    #     APPLICATIONS.add_and_start_application(model)
    #     model_registry.add_model(model)
    APPLICATIONS.run_all()


if __name__ == '__main__':
    main()