import 'mocha';
import { expect } from 'chai';

import * as t from '../index';
import * as util from './util';

describe('service', () => {
  it('should generate root infos', () => {
    const idl = `
// comment1
syntax = 'proto3';
// comment2
option (my_option) = "Foo1";
    `;

    const expected = {
      package: undefined,
      imports: undefined,
      weakImports: undefined,
      publicImports: undefined,
      syntax: 'proto3',
      syntaxType: 'ProtoDocument',
      root: {
        options: { '(my_option)': 'Foo1' },
        name: '',
        fullName: '',
        comment: undefined,
        syntaxType: 'ProtoRoot',
        nested: undefined,
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    return expect(protoDocument).to.eql(expected);
  });

  it('should generate root infos', () => {
    const idl = `
syntax = 'proto3';
import 'a.proto';
import public 'b.proto';
import weak 'c.proto';
    `;

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    expect(protoDocument.imports).to.eql(['a.proto', 'b.proto'])
    return  expect(protoDocument.publicImports).to.eql(['b.proto']);
  });

  it('should generate package infos', () => {
    const idl = `
syntax = 'proto3';

// comment1
package foo;
// comment2
option (my_option) = "Foo1";
    `;

    const expected = {
      options: { '(my_option)': 'Foo1' },
      name: 'foo',
      fullName: '.foo',
      comment: undefined,
      syntaxType: 'NamespaceDefinition',
      packageName: 'foo',
      nested: undefined,
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const packageName = protoDocument.package;
    const pkg: any = protoDocument.root.nested.foo;
    pkg.packageName = packageName;
    return expect(pkg).to.eql(expected);
  });

  it('should generate second package infos', () => {
    const idl = `
syntax = 'proto3';

// comment1
package foo.bar;
// comment2
option (my_option) = "Foo1";
    `;

    const expected = {
      options: { '(my_option)': 'Foo1' },
      name: 'bar',
      fullName: '.foo.bar',
      comment: undefined,
      syntaxType: 'NamespaceDefinition',
      packageName: 'foo.bar',
      nested: undefined,
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const packageName = protoDocument.package;
    const pkg: any = protoDocument.root.nested.foo.nested.bar;
    pkg.packageName = packageName;
    return expect(pkg).to.eql(expected);
  });

  it('should generate token error infos', () => {
    const idl = `
// comment1
syntax
    `;

    const expected = {
      line: 4,
      message: "illegal token 'null', '=' expected",
    };

    const protoError = t.parse(idl) as t.ProtoError;
    const errInfos = util.copyObjectWithKeys(protoError, ['line', 'message']);
    return expect(errInfos).to.eql(expected);
  });

  it('should generate parse error infos', () => {
    const idl = `
// comment1
syntax = 'proto3';;
    `;

    const expected = {
      line: 3,
      message: "illegal token ';'",
    };

    const protoError = t.parse(idl) as t.ProtoError;
    const errInfos = util.copyObjectWithKeys(protoError, ['line', 'message']);
    return expect(errInfos).to.eql(expected);
  });

  it('should parse package failed with dot', () => {
    const idl = `
syntax = 'proto3';

// comment1
package .foo;
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse package failed with number', () => {
    const idl = `
syntax = 'proto3';

// comment1
package 1;
    `;

    const protoError = t.parse(idl) as t.ProtoError;
    return expect(protoError.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });

  it('should parse empty input', () => {
    const idl: any = undefined;

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    return expect(protoDocument.syntaxType).to.eql(t.SyntaxType.ProtoDocument);
  });
});
