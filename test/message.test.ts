import 'mocha';
import { expect } from 'chai';

import * as t from '../index';
import * as util from './util';

describe('message', () => {
  it('should generate single message infos', () => {
    const idl = `
syntax = 'proto3';

message Test {
}
    `;

    const expected = {
      name: 'Test',
      fullName: undefined,
      syntaxType: 'MessageDefinition',
    };

    const protoDocument = t.parse(idl, { resolve: false }) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const messageInfos = util.copyObjectWithKeys(message, [
      'name',
      'fullName',
      'syntaxType',
    ]);
    // console.log(messageInfos)
    return expect(messageInfos).to.eql(expected);
  });

  it('should generate common message infos', () => {
    const idl = `
syntax = 'proto3';

/**
comment1
*/
message Test {
  option (my_option) = 'Hello world!';
}
    `;

    const expected = {
      options: { '(my_option)': 'Hello world!' },
      name: 'Test',
      fullName: '.Test',
      syntaxType: 'MessageDefinition',
      comment: 'comment1',
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const messageInfos = util.copyObjectWithKeys(message, [
      'name',
      'fullName',
      'options',
      'comment',
      'syntaxType',
    ]);
    // console.log(messageInfos)
    return expect(messageInfos).to.eql(expected);
  });

  it('should generate message infos with parse options set to false', () => {
    const idl = `
syntax = 'proto3';

/**
* comment1
*/
message Test {
  option (my_option) = 'Hello world!';
  option opt = { a: "foo" b { c: "bar" } };
  // comment2
  my_foo my_key = 1 [(my.foo) = my_bar, my_bar = 'my_foo', my_key = {a:{b:1}}]; // comment3
}
    `;

    const expected = {
      myKey: {
        options: { '(my.foo)': 'my_bar', my_bar: 'my_foo', 'my_key.a.b': 1 },
        name: 'myKey',
        fullName: undefined,
        comment: null,
        type: { value: 'my_foo', syntaxType: 'Identifier' },
      },
    };

    const protoDocument = t.parse(idl, {
      keepCase: false,
      alternateCommentMode: false,
      resolve: false,
      toJson: false,
    }) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const fieldInfos = util.copyMapWithkeys(message.fields, [
      'name',
      'fullName',
      'options',
      'comment',
      'type',
    ]);
    // console.log(fieldInfos)
    return expect(fieldInfos).to.eql(expected);
  });

  it('should generate extensions and reserved message infos', () => {
    const idl = `
syntax = 'proto3';

message Test {
  extensions 100 to 199;
  reserved 2, 9 to 11;
  reserved "FOO", "bar";
}
    `;

    const expected = {
      extensions: [[100, 199]],
      reserved: [[2, 2], [9, 11], 'FOO', 'bar'],
    };

    const protoDocument = t.parse(idl, { resolve: false }) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const messageInfos = util.copyObjectWithKeys(message, [
      'id',
      'extensions',
      'reserved',
    ]);
    // console.log(messageInfos)
    return expect(messageInfos).to.eql(expected);
  });

  it('should generate base type for field', () => {
    const idl = `
syntax = 'proto3';

message Test {
  double k1 = 1;
  float k2 = 2;
  int32 k3 = 3 [default = 0];
  int64 k4 = 4 [default = NaN];
  uint32 k5 = 5 [default = INF];
  sint32 k6 = 6[default = 0x2];
  fixed32 k7 = 7[default = 02];
  sfixed32 k8 = 8 [default = 7];
  bool k9 = 9;
  string k10 = 10;
  bytes k11 = 11;
}
    `;

    const expected = {
      k1: { type: { value: 'double', syntaxType: 'BaseType' } },
      k2: { type: { value: 'float', syntaxType: 'BaseType' } },
      k3: { type: { value: 'int32', syntaxType: 'BaseType' } },
      k4: { type: { value: 'int64', syntaxType: 'BaseType' } },
      k5: { type: { value: 'uint32', syntaxType: 'BaseType' } },
      k6: { type: { value: 'sint32', syntaxType: 'BaseType' } },
      k7: { type: { value: 'fixed32', syntaxType: 'BaseType' } },
      k8: { type: { value: 'sfixed32', syntaxType: 'BaseType' } },
      k9: { type: { value: 'bool', syntaxType: 'BaseType' } },
      k10: { type: { value: 'string', syntaxType: 'BaseType' } },
      k11: { type: { value: 'bytes', syntaxType: 'BaseType' } },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const fieldMap = util.copyMapWithkeys(message.fields, ['type']);
    // console.log(fieldMap);
    return expect(fieldMap).to.eql(expected);
  });

  it('should generate requiredness for field', () => {
    const idl = `
syntax = 'proto3';

message Test {
  string k1 = 1;
  required string k2 = 2;
  optional string k3 = 3;
  repeated string k4 = 4;
  map<string,string> k5 = 5;
}
    `;

    const expected = {
      k1: {
        rule: undefined,
        required: false,
        optional: true,
        repeated: false,
        map: false,
      },
      k2: {
        rule: 'required',
        required: true,
        optional: false,
        repeated: false,
        map: false,
      },
      k3: {
        rule: undefined,
        required: false,
        optional: true,
        repeated: false,
        map: false,
      },
      k4: {
        rule: 'repeated',
        required: false,
        optional: true,
        repeated: true,
        map: false,
      },
      k5: {
        rule: undefined,
        required: false,
        optional: true,
        repeated: false,
        map: true,
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const fieldMap = util.copyMapWithkeys(message.fields, [
      'rule',
      'optional',
      'required',
      'repeated',
      'map',
    ]);
    // console.log(fieldMap);
    return expect(fieldMap).to.eql(expected);
  });

  it('should generate map field', () => {
    const idl = `
syntax = 'proto3';

message Test {
  // comment
  map<string, .Foo> key1 = 1 [my_option = bar];
}
    `;

    const expected = {
      options: { my_option: 'bar' },
      name: 'key1',
      type: {
        value: '.Foo',
        syntaxType: 'Identifier',
        resolvedValue: '..Foo',
      },
      map: true,
      keyType: { value: 'string', syntaxType: 'BaseType' },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const messageTest = protoDocument.root.nested.Test as t.MessageDefinition;
    const field = messageTest.fields.key1;
    const fieldInfos = util.copyObjectWithKeys(field, [
      'name',
      'type',
      'keyType',
      'map',
      'options',
    ]);
    // console.log(fieldInfos);
    return expect(fieldInfos).to.eql(expected);
  });

  it('should generate nested message', () => {
    const idl = `
syntax = 'proto3';

message Test {
  // comment
  message Nested {
    option (my_option) = 'Hello world!';
  }
}
    `;

    const expected = {
      options: { '(my_option)': 'Hello world!' },
      name: 'Nested',
      fullName: '.Test.Nested',
      syntaxType: 'MessageDefinition',
      comment: 'comment',
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const messageTest = protoDocument.root.nested.Test as t.MessageDefinition;
    const message = messageTest.nested.Nested;
    const messageInfos = util.copyObjectWithKeys(message, [
      'name',
      'fullName',
      'options',
      'comment',
      'syntaxType',
    ]);
    // console.log(messageInfos);
    return expect(messageInfos).to.eql(expected);
  });

  it('should resolve up type for field', () => {
    const idl = `
syntax = 'proto3';

package foo;

message Same {}

message Test {
  Same k1 = 1;
}
    `;

    const expected = {
      k1: {
        type: {
          value: 'Same',
          syntaxType: 'Identifier',
          resolvedValue: '.foo.Same',
        },
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const message = protoDocument.root.nested.foo.nested
      .Test as t.MessageDefinition;
    const fieldMap = util.copyMapWithkeys(message.fields, ['type', 'keyType']);
    // console.log(fieldMap);
    return expect(fieldMap).to.eql(expected);
  });

  it('should resolve near type for field', () => {
    const idl = `
syntax = 'proto3';

message Same {}

message Test {
  message Same {}

  Same k1 = 1;
  map<string, foo.Same> k2 = 2;
}
    `;

    const expected = {
      k1: {
        type: {
          value: 'Same',
          syntaxType: 'Identifier',
          resolvedValue: '.Test.Same',
        },
      },
      k2: {
        type: {
          value: 'foo.Same',
          syntaxType: 'Identifier',
          resolvedValue: '.foo.Same',
        },
        keyType: { value: 'string', syntaxType: 'BaseType' },
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const fieldMap = util.copyMapWithkeys(message.fields, ['type', 'keyType']);
    // console.log(fieldMap);
    return expect(fieldMap).to.eql(expected);
  });

  it('should dispose oneof', () => {
    const idl = `
syntax = 'proto3';

message Test {
  oneof test_oneof {
    option foo = bar;
    string k1 = 1;
    string k2 = 2;
  }
}
    `;

    const expected = {
      fields: { k1: { id: 1 }, k2: { id: 2 } },
      oneof: {
        options: { foo: 'bar' },
        name: 'test_oneof',
        fullName: '.Test.test_oneof',
        comment: null,
        oneof: ['k1', 'k2'],
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const message = protoDocument.root.nested.Test as t.MessageDefinition;
    const fields = util.copyMapWithkeys(message.fields, ['id']);
    const oneof = message.oneofs.test_oneof;
    const actual = { fields, oneof };
    // console.log(actual);
    return expect(actual).to.eql(expected);
  });

  it('should dispose extend', () => {
    const idl = `
syntax = 'proto3';

extend Foo {
  string k1 = 1;
}

message Test {
  extend example.Bar {
    required string k2 = 2;
  }
}
    `;

    const expected = {
      k1: { id: 1, extend: 'Foo' },
      k2: { id: 2, extend: 'example.Bar' },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const { k1 } = protoDocument.root.nested;
    const messageTest = protoDocument.root.nested.Test as t.MessageDefinition;
    const { k2 } = messageTest.nested;
    const fieldInfos = util.copyMapWithkeys({ k1, k2 }, ['id', 'extend']);
    // console.log(fieldInfos);
    return expect(fieldInfos).to.eql(expected);
  });

  it('should dispose group', () => {
    const idl = `
syntax = 'proto3';

extend Foo {
  bool k1 = 1[default = false];
}

message Test {
  repeated group foo = 1 {
    option (my) = you;
    required string url = 2;
    optional int32 uri = 3[default = -1];
  }
}
    `;

    const expected = {
      message: {
        name: 'Foo',
        fullName: '.Test.Foo',
        group: true,
      },
      field: {
        name: 'foo',
        fullName: '.Test.foo',
        type: {
          value: 'Foo',
          syntaxType: 'Identifier',
          resolvedValue: '.Test.Foo',
        },
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const TestMessage = protoDocument.root.nested.Test as t.MessageDefinition;
    const FooMessage = TestMessage.nested.Foo;
    const message = util.copyObjectWithKeys(FooMessage, [
      'name',
      'fullName',
      'group',
    ]);
    const FooField = TestMessage.fields.foo;
    const field = util.copyObjectWithKeys(FooField, [
      'name',
      'fullName',
      'type',
    ]);
    const infos = { message, field };
    // console.log(infos);
    return expect(infos).to.eql(expected);
  });

  it('should parse failed with duplicate id', () => {
    const idl = `
syntax = 'proto3';

message Test {
  string key1 = 1;
  string key2 = 1;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    // console.log(protoError)
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with duplicate name', () => {
    const idl = `
syntax = 'proto3';

message Test {
  string key1 = 1;
  string key1 = 2;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    // console.log(protoError)
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with reserved id', () => {
    const idl = `
syntax = 'proto3';

message Test {
  reserved 1;
  string key1 = 1;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    // console.log(protoError)
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with reserved name', () => {
    const idl = `
syntax = 'proto3';

message Test {
  reserved 'key';
  string key = 1;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    // console.log(protoError)
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with negative id', () => {
    const idl = `
syntax = 'proto3';

message Test {
  string key = -1;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    // console.log(protoError)
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });
});
