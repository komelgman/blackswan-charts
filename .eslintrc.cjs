/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

const path = require('node:path')
const createAliasSetting = require('@vue/eslint-config-airbnb-with-typescript/createAliasSetting')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-airbnb-with-typescript',
    '@vue/eslint-config-airbnb-with-typescript/allow-tsx-in-vue',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
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
    semi: 0,
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
    'vue/max-len': [
      'error',
      {
        code: 150,
        ignoreComments: true,
        ignoreUrls: true,
      },
    ],
    'vue/html-closing-bracket-spacing': 0,
    'import/extensions': 0,
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/lines-between-class-members': 0,
    '@typescript-eslint/no-shadow': ['error'],

    // ??
    'vuejs-accessibility/mouse-events-have-key-events': 0,
    'vuejs-accessibility/click-events-have-key-events': 0,
    'jsx-a11y/no-noninteractive-tabindex': 0,
    'jsx-a11y/no-noninteractive-element-interactions': 0,
  },
  settings: {
    ...createAliasSetting({
      '@': `${path.resolve(__dirname, './src')}`,
    }),
  },
}
