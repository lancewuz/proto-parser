import 'mocha';
import { expect } from 'chai';

import * as t from '../index';

describe('enum', () => {
  it('should generate single message infos', () => {
    const idl = `
syntax = 'proto3';

// comment
enum Test {
  option allow_alias = true;
  UNIVERSAL = 0[a=1]; // tail comment
  WEB = 1; /*comment*/
  IMAGES = /*comment*/ 1;
  reserved 2, 9 to 11;
  reserved "FOO", "bar";
}
    `;

    const expected = {
      options: { allow_alias: true },
      name: 'Test',
      fullName: '.Test',
      comment: 'comment',
      syntaxType: 'EnumDefinition',
      values: '{"UNIVERSAL":0,"WEB":1,"IMAGES":1}',
      reserved: [[2, 2], [9, 11], 'FOO', 'bar'],
      nested: undefined,
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const enumDefinition: any = protoDocument.root.nested
      .Test as t.EnumDefinition;

    // convert to json string to avoid the weird 'deeply equal' errors
    enumDefinition.values = JSON.stringify(enumDefinition.values);
    // console.log(enumDefinition);
    return expect(enumDefinition).to.eql(expected);
  });

  it('should parse failed with duplicate id', () => {
    const idl = `
syntax = 'proto3';

// comment
enum Test {
  UNIVERSAL = 1;
  WEB = 1;
}
    `;

    const ProtoError = t.parse(idl) as t.ProtoError;
    return expect(ProtoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with duplicate name', () => {
    const idl = `
syntax = 'proto3';

// comment
enum Test {
  UNIVERSAL = 1;
  UNIVERSAL = 2;
}
    `;

    const ProtoError = t.parse(idl) as t.ProtoError;
    return expect(ProtoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with reserved id', () => {
    const idl = `
syntax = 'proto3';

// comment
enum Test {
  reserved 1, 40 to max;
  UNIVERSAL = 1;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    // console.log(protoError)
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse failed with reserved name', () => {
    const idl = `
syntax = 'proto3';

// comment
enum Test {
  reserved 'UNIVERSAL';
  UNIVERSAL = 1;
}
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });
});
