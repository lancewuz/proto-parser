/* eslint-disable */

import * as t from '../index';

const content = `
syntax = 'proto3';
message Foo {
  /* cm1
  cm2 */
  // string key = 1;
  Bar key2 = 2;
}
`;

const protoDocument = t.parse(content, {
  weakResolve: true,
}) as t.ProtoDocument;
console.log(JSON.stringify(protoDocument, null, 2));
