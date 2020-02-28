/* eslint-disable */

import * as t from '../index';

const content = `
syntax = 'proto3';
message Foo {
  string key = 1;
}
`;

const protoDocument = t.parse(content) as t.ProtoDocument;
console.log(JSON.stringify(protoDocument, null, 2));
