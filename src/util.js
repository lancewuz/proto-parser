const camelCaseRe = /_([a-z])/g;

/* istanbul ignore next */
const emptyArray = Object.freeze ? Object.freeze([]) : []; // used on prototypes

function isObject(value) {
  return value && typeof value === 'object';
}

function isString(value) {
  return (
    typeof value === 'string' ||
    /* istanbul ignore next */ value instanceof String
  );
}

function isInteger(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.floor(value) === value
  );
}

function camelCase(str) {
  const mainString = str
    .substring(1)
    .replace(camelCaseRe, ($0, $1) => $1.toUpperCase());
  return str.substring(0, 1) + mainString;
}

function lcFirst(str) {
  return str.charAt(0).toLowerCase() + str.substring(1);
}

function ucFirst(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

module.exports = {
  isObject,
  isString,
  isInteger,
  camelCase,
  lcFirst,
  ucFirst,
  emptyArray,
};
