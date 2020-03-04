import 'mocha';
import { expect } from 'chai';

import * as t from '../index';

describe('service', () => {
  it('should generate service infos', () => {
    const idl = `
syntax = 'proto3';

// comment service
service Example {
  option (my_service_option) = FOO;
}
    `;

    const expected = {
      options: { '(my_service_option)': 'FOO' },
      name: 'Example',
      fullName: '.Example',
      comment: 'comment service',
      syntaxType: 'ServiceDefinition',
      methods: {},
      nested: undefined,
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const serviceInfos = protoDocument.root.nested
      .Example as t.ServiceDefinition;
    return expect(serviceInfos).to.eql(expected);
  });

  it('should generate method infos', () => {
    const idl = `
syntax = 'proto3';

message BizRequest {}
message BizResponse {}

service Example {
  // comment Biz
  rpc Biz (BizRequest) returns (BizResponse);

  // comment Biz1
  rpc Biz1(BizRequest) returns (BizResponse) {
    option (my_method_option1) = "BAR";
    option (my_method_option2) = "bar";
  }
}
    `;

    const expected = {
      Biz: {
        options: undefined,
        name: 'Biz',
        fullName: '.Example.Biz',
        comment: 'comment Biz',
        requestType: {
          value: 'BizRequest',
          syntaxType: 'Identifier',
          resolvedValue: '.BizRequest',
        },
        responseType: {
          value: 'BizResponse',
          syntaxType: 'Identifier',
          resolvedValue: '.BizResponse',
        },
      },
      Biz1: {
        options: { '(my_method_option1)': 'BAR', '(my_method_option2)': 'bar' },
        name: 'Biz1',
        fullName: '.Example.Biz1',
        comment: 'comment Biz1',
        requestType: {
          value: 'BizRequest',
          syntaxType: 'Identifier',
          resolvedValue: '.BizRequest',
        },
        responseType: {
          value: 'BizResponse',
          syntaxType: 'Identifier',
          resolvedValue: '.BizResponse',
        },
      },
    };

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const service = protoDocument.root.nested.Example as t.ServiceDefinition;
    const { methods } = service;
    return expect(methods).to.eql(expected);
  });

  it('should nest message in service', () => {
    const idl = `
syntax = 'proto3';

// comment service
service Example {
  message Test {}
}
    `;

    const protoDocument = t.parse(idl) as t.ProtoDocument;
    const service = protoDocument.root.nested.Example as t.ServiceDefinition;

    const message = service.nested.Test;
    return expect(message.fullName).to.eql('.Example.Test');
  });

  it('should resolve failed', () => {
    const idl = `
syntax = 'proto3';

service Example {
  // comment Biz
  rpc Biz (BizRequest) returns (BizResponse);
}
    `;

    const protoDocument = t.parse(idl) as t.ProtoError;
    return expect(protoDocument.syntaxType).to.eql(t.SyntaxType.ProtoError);
  });
});
