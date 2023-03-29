from enum import Enum
import logging
import sys


LOG_LEVEL = None


class LogLevel(Enum):
    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR

    @staticmethod
    def parse(value: str) -> 'LogLevel':
        lowered = value.lower()

        if lowered == 'debug':
            result = LogLevel.DEBUG
        elif lowered == 'info':
            result = LogLevel.INFO
        elif lowered in ['warning', 'warn']:
            result = LogLevel.WARNING
        elif lowered in ['err', 'error']:
            result = LogLevel.ERROR
        else:
            raise ValueError(f'Value {value} is not a valid log level.')

        return result


def setup_logging(log_level: LogLevel):
    global LOG_LEVEL
    root_logger = logging.getLogger()
    print('Will use log level:', log_level)
    root_logger.setLevel(log_level.value)
    LOG_LEVEL = log_level

    log_handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt='%(asctime)s [%(threadName)s][%(filename)s:%(lineno)d][%(levelname)s]: %(message)s')
    log_handler.setFormatter(formatter)
    root_logger.addHandler(log_handler)
