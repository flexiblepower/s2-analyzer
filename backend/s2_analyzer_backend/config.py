import os
import yaml
from typing import TYPE_CHECKING, Type
from enum import Enum


from dataclasses import dataclass, field
from dataclass_wizard import YAMLWizard, LoadMixin
from s2_analyzer_backend.origin_type import S2OriginType
from s2_analyzer_backend.cem_model_simple.cem_model_simple import CEM

if TYPE_CHECKING:
    from s2_analyzer_backend.router import MessageRouter
    from s2_analyzer_backend.model import Model

S2_MODEL_CONF = os.getenv('S2_MODEL_CONF', 'config.yaml')


@dataclass
class ModelConfig(YAMLWizard):
    model_type: 'S2OriginType'
    id: str


@dataclass
class ModelsConfig(YAMLWizard):
    models: list[ModelConfig] = field(default_factory=list)


def read_s2_model_conf() -> 'ModelsConfig':
    r = ModelsConfig.from_yaml_file(S2_MODEL_CONF)
    if isinstance(r, list):
        return r[0]
    else:
        return r


def model_create(m: 'ModelConfig', router: 'MessageRouter') -> 'Model':
    if m.model_type.isCEM():
        return CEM(m.id, router)
    else:
        raise RuntimeError()


def init_models(router: 'MessageRouter') -> 'list[Model]':
    r = []

    config = read_s2_model_conf()

    model: 'ModelConfig'
    model_constructor: 'type[Model]'
    for model in config.models:
        r.append(model_create(model, router))
    return r
