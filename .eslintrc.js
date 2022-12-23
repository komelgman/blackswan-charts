module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-shadow': 0,
    'no-param-reassign': 0,
    'class-methods-use-this': 0,
    'no-continue': 0,
    'no-restricted-globals': 0,
    'no-unused-expressions': 0,
    'no-restricted-syntax': 0,
    'lines-between-class-members': 0,
    'object-curly-newline': 0,
    'semi': 0,
    // Changing max row length from 80 to 150.
    // Remember to change in .editorconfig also, although I am not sure if that file is even needed?
    // Especially as scaffolding gave 100 as max len while ESLint default is 80...
    'max-len': [
      'error',
      {
        code: 150,
        ignoreComments: true,
        ignoreUrls: true,
      },
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/no-shadow': ['error'],
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
