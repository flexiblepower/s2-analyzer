import json
import logging
from typing import TYPE_CHECKING, Optional
import jsonschema
import jsonschema.validators

if TYPE_CHECKING:
    from pathlib import Path

LOGGER = logging.getLogger(__name__)
MessageType = str
FormatValidationError = jsonschema.ValidationError


class S2JsonSchemaValidator:
    dir_to_s2_json_schemas: "Path"
    resolver: jsonschema.validators.RefResolver

    schemas_per_message_type: dict[MessageType, dict]
    message_types: list[MessageType]

    def __init__(self, dir_to_s2_json_schemas: "Path"):
        self.dir_to_s2_json_schemas = dir_to_s2_json_schemas
        self.schemas_per_message_type = {}

    def setup(self):
        self.read_s2_json_schemas()

    def read_s2_json_schemas(self):
        self.message_types = []
        cache = {}
        for schema_file in self.dir_to_s2_json_schemas.glob('**/*.schema.json'):
            if schema_file.is_file():
                LOGGER.info('Reading in S2 schema %s', schema_file)
                with open(schema_file, encoding='utf-8') as opened_schema_file:
                    json_schema = json.loads(opened_schema_file.read())

                message_type = json_schema.get('properties', {}).get('message_type', {}).get('const', {})

                if message_type:
                    LOGGER.debug('Found message type %s', message_type)
                    self.schemas_per_message_type[message_type] = json_schema
                    self.message_types.append(message_type)
                else:
                    LOGGER.debug('Schema %s is a partial schema and not a message', schema_file)
                cache[json_schema['$id']] = json_schema
        self.resolver = jsonschema.validators.RefResolver(base_uri=f'{self.dir_to_s2_json_schemas.resolve().as_uri()}/',
                                                          referrer=True,
                                                          store=cache)

    def validate(self, message, message_type: MessageType) -> Optional[FormatValidationError]:
        schema = self.schemas_per_message_type.get(message_type, None)
        if schema:
            try:
                jsonschema.validate(instance=message, schema=schema, resolver=self.resolver)
                result = None
            except jsonschema.ValidationError as e:
                result = e
        else:
            result = FormatValidationError(f'There is no schema loaded for message type {message_type}.')

        return result

    def get_message_type(self, message) -> Optional[MessageType]:
        return message.get('message_type')
