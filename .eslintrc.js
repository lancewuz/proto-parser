module.exports = {
  root: true,
  extends: [
    'airbnb-typescript/base',
    'prettier',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'max-len': ['error', { 'code': 160, 'tabWidth': 4 }],
    'max-classes-per-file': 'off',
    'no-plusplus': 'off',
  }
};