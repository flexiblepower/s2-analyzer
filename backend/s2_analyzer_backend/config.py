import os
from pathlib import Path
from typing import TYPE_CHECKING
from dataclasses import dataclass, field
from dataclass_wizard import YAMLWizard
from s2_analyzer_backend.origin_type import S2OriginType
from s2_analyzer_backend.cem_model_simple.cem_model_simple import CEM

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.model import Model

S2_ANALYZER_CONF = os.getenv('S2_ANALYZER_CONF', 'config.yaml')

@dataclass
class ModelConfig:
    model_type: 'S2OriginType'
    model_id: str


@dataclass
class Config(YAMLWizard):
    http_listen_address: str
    http_port: int
    connection_histories_dir: str
    models: list[ModelConfig]

    @property
    def connection_histories_dir_path(self):
        return Path(self.connection_histories_dir)


def read_s2_analyzer_conf() -> Config:
    print(f"Reading configuration at {S2_ANALYZER_CONF}")
    result = Config.from_yaml_file(S2_ANALYZER_CONF)

    if not result.connection_histories_dir_path.exists():
        result.connection_histories_dir_path.mkdir(parents=True, exist_ok=True)

    if not result.connection_histories_dir_path.is_dir():
        raise RuntimeError(f"Connection histories location ({result.connection_histories_dir}) should be a directory "
                           f"and it isn't.")
    return result


def model_create(model: 'ModelConfig', router: 'MessageRouter') -> 'Model':
    if model.model_type.is_cem():
        return CEM(model.model_id, router)
    raise RuntimeError()


def init_models(router: 'MessageRouter', config: Config) -> 'list[Model]':
    result = []

    model: 'ModelConfig'
    for model in config.models:
        result.append(model_create(model, router))
    return result


CONFIG = read_s2_analyzer_conf()
