from enum import Enum
import logging
import sys


LOG_LEVEL = None


class LogLevel(Enum):
    Debug = logging.DEBUG
    Info = logging.INFO
    Warning = logging.WARNING
    Error = logging.ERROR

    @staticmethod
    def parse(value: str) -> 'LogLevel':
        lowered = value.lower()

        if lowered == 'debug':
            result = LogLevel.Debug
        elif lowered == 'info':
            result = LogLevel.Info
        elif lowered in ['warning', 'warn']:
            result = LogLevel.Warning
        elif lowered in ['err', 'error']:
            result = LogLevel.Error
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
