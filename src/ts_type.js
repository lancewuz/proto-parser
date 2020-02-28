const KeywordTypes = [
  'double',
  'float',
  'int32',
  'int64',
  'uint32',
  'uint64',
  'sint32',
  'sint64',
  'fixed32',
  'fixed64',
  'sfixed32',
  'sfixed64',
  'bool',
  'string',
  'bytes',
];

// const FieldRules = ['repeated', 'required'];

const SyntaxType = {
  BaseType: 'BaseType',
  Identifier: 'Identifier',
  OneOfDefinition: 'OneOfDefinition',
  FieldDefinition: 'FieldDefinition',
  MethodDefinition: 'MethodDefinition',

  NamespaceDefinition: 'NamespaceDefinition',
  MessageDefinition: 'MessageDefinition',
  EnumDefinition: 'EnumDefinition',
  ServiceDefinition: 'ServiceDefinition',

  ProtoRoot: 'ProtoRoot',
  ProtoDocument: 'ProtoDocument',
  ProtoError: 'ProtoError',
};

function getFieldType(typeString) {
  const syntaxType = KeywordTypes.includes(typeString)
    ? SyntaxType.BaseType
    : SyntaxType.Identifier;
  const newType = {
    value: typeString,
    syntaxType,
  };

  return newType;
}

module.exports = {
  SyntaxType,
  getFieldType,
};
