/* eslint-disable @typescript-eslint/no-use-before-define, no-param-reassign, no-underscore-dangle */

const util = require('./util');
const { SyntaxType, getFieldType } = require('./ts_type');

const ruleRe = /^required|optional|repeated$/;

class ReflectionObject {
  constructor(name, options) {
    /* istanbul ignore next */
    if (!util.isString(name)) {
      throw TypeError('name must be a string');
    }

    /* istanbul ignore next */
    if (options && !util.isObject(options)) {
      throw TypeError('options must be an object');
    }

    this.options = options;
    this.name = name;
    this.fullName = undefined;
    this.comment = undefined;
    this.parent = undefined;
  }

  setOption(name, value, ifNotSet) {
    /* istanbul ignore next */
    if (!ifNotSet || !this.options || this.options[name] === undefined) {
      (this.options || (this.options = {}))[name] = value;
    }

    return this;
  }

  getFullName() {
    if (this.fullName) return this.fullName;
    const path = [this.name];
    let ptr = this.parent;

    while (ptr) {
      path.unshift(ptr.name);
      ptr = ptr.parent;
    }

    this.fullName = path.join('.');
    return this.fullName;
  }

  onAdd(parent) {
    this.parent = parent;
  }

  resolve() {
    this.fullName = this.getFullName();
    return this;
  }

  toJson() {
    return copyObject(this, ['name', 'fullName', 'comment', 'options']);
  }
}

class FieldDefinition extends ReflectionObject {
  constructor(name, id, type, rule, extend, options, comment) {
    /* istanbul ignore next */
    if (util.isObject(rule)) {
      comment = extend;
      options = rule;
      rule = undefined;
      extend = undefined;
    } else if (util.isObject(extend)) {
      comment = options;
      options = extend;
      extend = undefined;
    }

    super(name, options);
    this.syntaxType = SyntaxType.FieldDefinition;

    /* istanbul ignore next */
    if (!util.isInteger(id) || id < 0) {
      throw TypeError('id must be a non-negative integer');
    }

    /* istanbul ignore next */
    if (!util.isString(type)) {
      throw TypeError('type must be a string');
    }

    if (rule !== undefined) {
      rule = rule.toString().toLowerCase();

      /* istanbul ignore next */
      if (!ruleRe.test(rule)) {
        throw TypeError('rule must be a string rule');
      }
    }

    /* istanbul ignore next */
    if (extend !== undefined && !util.isString(extend)) {
      throw TypeError('extend must be a string');
    }

    this.type = getFieldType(type);
    this.rule = rule && rule !== 'optional' ? rule : undefined;
    this.id = id;
    this.extend = extend || undefined;
    this.required = rule === 'required';
    this.optional = !this.required;
    this.repeated = rule === 'repeated';
    this.map = false;
    this.comment = comment;
    // this.message = null;
    // this.partOf = null;
    // this.extensionField = null;
    // this.declaringField = null;
  }

  resolve() {
    ReflectionObject.prototype.resolve.call(this);
    ResolveType(this.type, this.parent);
    return this;
  }

  toJson() {
    const json = ReflectionObject.prototype.toJson.call(this);
    const keys = [
      'id',
      'type',
      'rule',
      'required',
      'optional',
      'repeated',
      'map',
      'keyType',
      'extend',
    ];
    Object.assign(json, copyObject(this, keys));
    return json;
  }
}

class MapField extends FieldDefinition {
  constructor(name, id, keyType, type, options, comment) {
    super(name, id, type, undefined, undefined, options, comment);
    this.syntaxType = SyntaxType.FieldDefinition;
    this.keyType = getFieldType(keyType);
    this.map = true;
  }
}

class OneofDefinition extends ReflectionObject {
  constructor(name, fieldNames, options, comment) {
    /* istanbul ignore next */
    if (!Array.isArray(fieldNames)) {
      options = fieldNames;
      fieldNames = undefined;
    }

    super(name, options);
    this.syntaxType = SyntaxType.OneofDefinition;

    /* istanbul ignore next */
    if (!(fieldNames === undefined || Array.isArray(fieldNames))) {
      throw TypeError('fieldNames must be an Array');
    }

    this.oneof = fieldNames || [];
    this.fieldsArray = [];
    this.comment = comment;
  }

  toJson() {
    const json = ReflectionObject.prototype.toJson.call(this);
    json.oneof = this.oneof;
    return json;
  }

  add(field) {
    /* istanbul ignore if */
    if (!(field instanceof FieldDefinition)) {
      throw TypeError('field must be a Field');
    }

    this.oneof.push(field.name);
    this.fieldsArray.push(field);
    field.partOf = this;
    addFieldsToParent(this);
    return this;
  }

  onAdd(parent) {
    ReflectionObject.prototype.onAdd.call(this, parent);
    const self = this;

    // Collect present fields
    for (let i = 0; i < this.oneof.length; ++i) {
      const field = parent.get(this.oneof[i]);

      /* istanbul ignore next */
      if (field && !field.partOf) {
        field.partOf = self;
        self.fieldsArray.push(field);
      }
    }

    // Add not yet present fields
    addFieldsToParent(this);
  }
}

class NamespaceDefinition extends ReflectionObject {
  constructor(name, options) {
    super(name, options);
    this.syntaxType = SyntaxType.NamespaceDefinition;
    this.nested = undefined;
  }

  add(object) {
    /* istanbul ignore next */
    if (
      !(
        (object instanceof FieldDefinition && object.extend !== undefined) ||
        object instanceof MessageDefinition ||
        object instanceof EnumDefinition ||
        object instanceof ServiceDefinition ||
        object instanceof NamespaceDefinition
      )
    ) {
      throw TypeError('object must be a valid nested object');
    }

    if (!this.nested) this.nested = {};
    this.nested[object.name] = object;
    object.onAdd(this);

    return this.clearCache();
  }

  isReservedId(id) {
    const { reserved } = this;

    if (reserved) {
      for (let i = 0; i < reserved.length; ++i) {
        if (
          typeof reserved[i] !== 'string' &&
          reserved[i][0] <= id &&
          reserved[i][1] >= id
        ) {
          return true;
        }
      }
    }

    return false;
  }

  isReservedName(name) {
    const { reserved } = this;

    if (reserved) {
      for (let i = 0; i < reserved.length; ++i) {
        /* istanbul ignore next */
        if (reserved[i] === name) {
          return true;
        }
      }
    }

    return false;
  }

  define(path) {
    /* istanbul ignore next */
    if (util.isString(path)) {
      path = path.split('.');
    } else if (!Array.isArray(path)) {
      throw TypeError('illegal path');
    }

    if (path && path.length && path[0] === '') {
      throw Error('path must be relative');
    }

    let ptr = this;
    while (path.length > 0) {
      const part = path.shift();

      /* istanbul ignore next */
      if (ptr.nested && ptr.nested[part]) {
        ptr = ptr.nested[part];

        if (!(ptr instanceof NamespaceDefinition)) {
          throw Error('path conflicts with non-namespace objects');
        }
      } else {
        ptr.add((ptr = new NamespaceDefinition(part)));
      }
    }
    return ptr;
  }

  get(name) {
    /* istanbul ignore next */
    return this.nested && this.nested[name];
  }

  clearCache() {
    this._nestedArray = null;
    return this;
  }

  resolve() {
    ReflectionObject.prototype.resolve.call(this);
    mapResolve(this.nested);
    return this;
  }

  lookup(typeName) {
    /* istanbul ignore next */
    if (!typeName) {
      throw new Error(`a typeName should be specified for '${typeName}'`);
    }

    /* istanbul ignore next */
    if (typeName.includes('.')) {
      throw new Error(`the typeName '${typeName}' should not include a dot`);
    }

    // lookup from nested
    if (this.nested && Object.keys(this.nested).length) {
      // eslint-disable-next-line
      for (const nested of Object.values(this.nested)) {
        /* istanbul ignore next */
        if (
          nested.name === typeName &&
          (nested instanceof MessageDefinition ||
            nested instanceof EnumDefinition)
        ) {
          return nested.getFullName();
        }
      }
    }

    // lookup from parent
    if (this.parent instanceof NamespaceDefinition) {
      return this.parent.lookup(typeName);
    }
    return undefined;
  }

  toJson() {
    const json = ReflectionObject.prototype.toJson.call(this);
    json.syntaxType = this.syntaxType;
    json.nested = mapToJson(this.nested);
    return json;
  }
}

class MessageDefinition extends NamespaceDefinition {
  constructor(name, options) {
    super(name, options);
    this.syntaxType = SyntaxType.MessageDefinition;
    this.fields = {};
    this.oneofs = undefined;
    this.extensions = undefined;
    this.reserved = undefined;
    this.group = undefined;
    // this._fieldsById = null;
    // this._fieldsArray = null;
    // this._oneofsArray = null;
    // this._ctor = null;
  }

  get(name) {
    return (
      this.fields[name] ||
      (this.oneofs && this.oneofs[name]) ||
      (this.nested && this.nested[name])
    );
  }

  add(object) {
    if (this.get(object.name)) {
      throw Error(`duplicate name '${object.name}' in ${this}`);
    }

    if (object instanceof FieldDefinition && object.extend === undefined) {
      // NOTE: Extension fields aren't actual fields on the declaring type, but nested objects.
      // The root object takes care of adding distinct sister-fields to the respective extended
      // type instead.

      // avoids calling the getter if not absolutely necessary because it's called quite frequently
      if (
        this._fieldsById
          ? /* istanbul ignore next */ this._fieldsById[object.id]
          : this.fieldsById()[object.id]
      ) {
        throw Error(`duplicate id ${object.id} in ${this}`);
      }

      if (this.isReservedId(object.id)) {
        throw Error(`id ${object.id} is reserved in ${this}`);
      }

      if (this.isReservedName(object.name)) {
        throw Error(`name '${object.name}' is reserved in ${this}`);
      }

      // if (object.parent) object.parent.remove(object);
      this.fields[object.name] = object;
      // object.message = this;
      object.onAdd(this);
      return this.clearCache();
    }

    if (object instanceof OneofDefinition) {
      /* istanbul ignore next */
      if (!this.oneofs) this.oneofs = {};
      this.oneofs[object.name] = object;
      object.onAdd(this);
      return this.clearCache();
    }

    return NamespaceDefinition.prototype.add.call(this, object);
  }

  fieldsById() {
    /* istanbul ignore if */
    if (this._fieldsById) {
      return this._fieldsById;
    }

    this._fieldsById = {};
    for (let names = Object.keys(this.fields), i = 0; i < names.length; ++i) {
      const field = this.fields[names[i]];
      const { id } = field;

      /* istanbul ignore if */
      if (this._fieldsById[id]) {
        throw Error(`duplicate id ${id} in ${this}`);
      }

      this._fieldsById[id] = field;
    }
    return this._fieldsById;
  }

  clearCache() {
    this._fieldsById = null;
    this._fieldsArray = null;
    this._oneofsArray = null;
    return this;
  }

  resolve() {
    mapResolve(this.fields);
    mapResolve(this.oneofs);

    return NamespaceDefinition.prototype.resolve.call(this);
  }

  toJson() {
    const json = NamespaceDefinition.prototype.toJson.call(this);
    Object.assign(json, copyObject(this, ['extensions', 'reserved', 'group']));
    json.fields = mapToJson(this.fields);
    json.oneofs = mapToJson(this.oneofs);

    return json;
  }
}

class EnumDefinition extends NamespaceDefinition {
  constructor(name, values, options, comment, comments) {
    super(name, options);
    this.syntaxType = SyntaxType.EnumDefinition;

    /* istanbul ignore next */
    if (values && typeof values !== 'object') {
      throw TypeError('values must be an object');
    }

    this.valuesById = {};
    this.values = Object.create(this.valuesById);
    this.comment = comment;
    this.comments = comments || {};
    this.reserved = undefined;

    /* istanbul ignore next */
    if (values) {
      for (let keys = Object.keys(values), i = 0; i < keys.length; ++i) {
        // use forward entries only
        if (typeof values[keys[i]] === 'number') {
          this.valuesById[(this.values[keys[i]] = values[keys[i]])] = keys[i];
        }
      }
    }
  }

  add(name, id, comment) {
    /* istanbul ignore next */
    if (!util.isString(name)) {
      throw TypeError('name must be a string');
    }

    /* istanbul ignore next */
    if (!util.isInteger(id)) {
      throw TypeError('id must be an integer');
    }

    if (this.values[name] !== undefined) {
      throw Error(`duplicate name '${name}' in ${this}`);
    }

    if (this.isReservedId(id)) {
      throw Error(`id ${id} is reserved in ${this}`);
    }

    if (this.isReservedName(name)) {
      throw Error(`name '${name}' is reserved in ${this}`);
    }

    if (this.valuesById[id] !== undefined) {
      if (!(this.options && this.options.allow_alias)) {
        throw Error(`duplicate id ${id} in ${this}`);
      }

      this.values[name] = id;
    } else {
      this.valuesById[(this.values[name] = id)] = name;
    }

    this.comments[name] = comment;
    return this;
  }

  toJson() {
    const json = NamespaceDefinition.prototype.toJson.call(this);
    Object.assign(json, copyObject(this, ['values', 'reserved']));
    return json;
  }
}

class ServiceDefinition extends NamespaceDefinition {
  constructor(name, options) {
    super(name, options);
    this.syntaxType = SyntaxType.ServiceDefinition;

    this.methods = {};
    this._methodsArray = null;
  }

  add(object) {
    /* istanbul ignore if */
    if (this.get(object.name)) {
      throw Error(`duplicate name '${object.name}' in ${this}`);
    }

    if (object instanceof MethodDefinition) {
      this.methods[object.name] = object;
      object.parent = this;
      return this.clearCache();
    }

    return NamespaceDefinition.prototype.add.call(this, object);
  }

  get(name) {
    return (
      this.methods[name] || NamespaceDefinition.prototype.get.call(this, name)
    );
  }

  clearCache() {
    this._methodsArray = null;
    return this;
  }

  resolve() {
    mapResolve(this.methods);
    return NamespaceDefinition.prototype.resolve.call(this);
  }

  toJson() {
    const json = NamespaceDefinition.prototype.toJson.call(this);
    json.methods = mapToJson(this.methods);
    return json;
  }
}

class MethodDefinition extends ReflectionObject {
  constructor(
    name,
    type,
    requestType,
    responseType,
    requestStream,
    responseStream,
    options,
    comment
  ) {
    /* istanbul ignore next */
    if (util.isObject(requestStream)) {
      options = requestStream;
      requestStream = undefined;
      responseStream = undefined;
    } else if (util.isObject(responseStream)) {
      options = responseStream;
      responseStream = undefined;
    }

    /* istanbul ignore if */
    if (!(type === undefined || util.isString(type))) {
      throw TypeError('type must be a string');
    }

    /* istanbul ignore if */
    if (!util.isString(requestType)) {
      throw TypeError('requestType must be a string');
    }

    /* istanbul ignore if */
    if (!util.isString(responseType)) {
      throw TypeError('responseType must be a string');
    }

    super(name, options);
    this.syntaxType = SyntaxType.MethodDefinition;

    this.requestType = getFieldType(requestType);
    /* istanbul ignore next */
    this.requestStream = requestStream ? true : undefined;
    this.responseType = getFieldType(responseType);
    /* istanbul ignore next */
    this.responseStream = responseStream ? true : undefined;
    this.comment = comment;
  }

  resolve() {
    ReflectionObject.prototype.resolve.call(this);
    ResolveType(this.requestType, this.parent);
    ResolveType(this.responseType, this.parent);
    return this;
  }

  toJson() {
    const json = ReflectionObject.prototype.toJson.call(this);
    Object.assign(
      json,
      copyObject(this, ['type', 'requestType', 'responseType'])
    );
    return json;
  }
}

class Root extends NamespaceDefinition {
  constructor(options) {
    super('', options);
    this.syntaxType = SyntaxType.ProtoRoot;
    // this.deferred = [];
    // this.files = [];
  }
}

function addFieldsToParent(oneof) {
  if (oneof.parent) {
    for (let i = 0; i < oneof.fieldsArray.length; ++i) {
      /* istanbul ignore next */
      if (!oneof.fieldsArray[i].parent) {
        oneof.parent.add(oneof.fieldsArray[i]);
      }
    }
  }
}

function copyObject(object, keys) {
  /* istanbul ignore next */
  if (!object) return undefined;
  const newObject = {};

  Object.keys(object).forEach(key => {
    if (keys.includes(key)) {
      newObject[key] = object[key];
    }
  });

  return newObject;
}

function mapToJson(map) {
  if (!map) return undefined;
  const object = {};

  Object.keys(map).forEach(key => {
    object[key] = map[key].toJson();
  });

  return object;
}

function mapResolve(map) {
  if (!map) return;

  Object.values(map).forEach(value => {
    value.resolve();
  });
}

function ResolveType(type, parent) {
  if (type.syntaxType === SyntaxType.Identifier) {
    const { value } = type;
    let resolvedValue;

    if (!value.includes('.')) {
      resolvedValue = parent.lookup(value);
      if (!resolvedValue) {
        throw new Error(`invalid type '${value}'`);
      }
    } else {
      resolvedValue = `.${value}`;
    }

    type.resolvedValue = resolvedValue;
  }

  return type;
}

module.exports = {
  ReflectionObject,
  FieldDefinition,
  NamespaceDefinition,
  MessageDefinition,
  EnumDefinition,
  ServiceDefinition,
  MethodDefinition,
  Root,
  OneofDefinition,
  MapField,
};
