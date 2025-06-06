import logging.config
from typing import Dict


def get_log_config() -> Dict:
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": "logging.Formatter",
                "fmt": "%(asctime)s - %(name)s:%(lineno)d - %(levelname)s - %(message)s",
            },
            "short": {
                "()": "logging.Formatter",
                "fmt": "%(name)s:%(lineno)d - %(levelname)s - %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "short",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        },
    }
  
    return config
