/* eslint-disable */

import * as t from '../index';

const content = `syntax = "proto3";

message list_request {
  required string order_type = 1; // c1
  required int64 from = 2; // c2
  required int32 count = 3; // c3
}

message list2 {
  // c1
  required string key1 = 1;
  // c2
  required int64 key2 = 2;
  // c3
  required int32 key3 = 3;
}
`;

const protoDocument = t.parse(content, {
  weakResolve: true,
}) as t.ProtoDocument;
console.log(JSON.stringify(protoDocument, null, 2));
