module.exports = {

  // https://istanbul.js.org/docs/advanced/alternative-reporters/#cobertura
  reporter: ['cobertura', 'text'],
  include: ['src/*.js', 'index.js'],
  'check-coverage': true,

  // https://github.com/istanbuljs/nyc#coverage-thresholds
  branches: 95,
  lines: 95,
  functions: 95,
  statements: 95,
};