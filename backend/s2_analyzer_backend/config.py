import os
from pathlib import Path
from dataclasses import dataclass
from dataclass_wizard import YAMLWizard
from s2_analyzer_backend.origin_type import S2OriginType

S2_ANALYZER_CONF = os.getenv("S2_ANALYZER_CONF", "config.yaml")


@dataclass
class ModelConfig:
    model_type: "S2OriginType"
    model_id: str


@dataclass
class Config(YAMLWizard):
    http_listen_address: str
    http_port: int


def read_s2_analyzer_conf() -> Config:
    print(f"Reading configuration at {S2_ANALYZER_CONF}")
    result = Config.from_yaml_file(S2_ANALYZER_CONF)

    return result


CONFIG = read_s2_analyzer_conf()
