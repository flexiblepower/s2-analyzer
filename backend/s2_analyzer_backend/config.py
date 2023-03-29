import os
from typing import TYPE_CHECKING
from dataclasses import dataclass, field
from dataclass_wizard import YAMLWizard
from s2_analyzer_backend.origin_type import S2OriginType
from s2_analyzer_backend.cem_model_simple.cem_model_simple import CEM

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.model import Model

S2_MODEL_CONF = os.getenv('S2_MODEL_CONF', 'config.yaml')


@dataclass
class ModelConfig(YAMLWizard):
    model_type: 'S2OriginType'
    model_id: str


@dataclass
class ModelsConfig(YAMLWizard):
    models: list[ModelConfig] = field(default_factory=list)


def read_s2_model_conf() -> 'ModelsConfig':
    result = ModelsConfig.from_yaml_file(S2_MODEL_CONF)
    if isinstance(result, list):
        return result[0]
    return result


def model_create(model: 'ModelConfig', router: 'MessageRouter') -> 'Model':
    if model.model_type.is_cem():
        return CEM(model.model_id, router)
    raise RuntimeError()


def init_models(router: 'MessageRouter') -> 'list[Model]':
    result = []
    config = read_s2_model_conf()

    model: 'ModelConfig'
    for model in config.models:
        result.append(model_create(model, router))
    return result
