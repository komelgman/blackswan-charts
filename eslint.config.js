import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default [
  {
    ignores: [
      'logs/**',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      'lerna-debug.log*',

      'node_modules/**',
      '.DS_Store',
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      '*.local',

      'cypress/videos/**',
      'cypress/screenshots/**',

      '.vscode/**',
      '!.vscode/extensions.json',
      '.idea/**',
      '*.iml',
      '*.suo',
      '*.ntvs*',
      '*.njsproj',
      '*.sln',
      '*.sw?',

      'test-results/**',
      'tests/.e2e-report/**',
      'tests/.component-report/**',
      'tests/.component-snapshots/**',
      'tests/component-template/.cache/**',

      '.roo/**',
      '.gitignore',
      'AGENTS.md',
      '.roomodes',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },

  {
    files: ['**/*.{js,mjs,cjs,ts,mts,vue,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-shadow': 0,
      'no-plusplus': 0,
      'no-param-reassign': 0,
      'class-methods-use-this': 0,
      'no-continue': 0,
      'no-restricted-globals': 0,
      'no-unused-expressions': 0,
      'no-restricted-syntax': 0,
      'lines-between-class-members': 0,
      'object-curly-newline': 0,
      'semi': 0,

      'max-len': [
        'error',
        {
          code: 150,
          ignoreComments: true,
          ignoreUrls: true,
        },
      ],

      'vue/html-closing-bracket-spacing': 0,
      'vue/multi-word-component-names': 0,

      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

      '@typescript-eslint/ban-ts-ignore': 0,
      '@typescript-eslint/no-inferrable-types': 0,
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/lines-between-class-members': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/no-unsafe-function-type': 0,
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  {
    files: ['**/*.vue'],
    rules: {
      'vue/max-len': [
        'error',
        {
          code: 150,
          ignoreComments: true,
          ignoreUrls: true,
        },
      ],
    },
  },

  {
    files: [
      '**/*.config.{ts,js,mjs}',
      'tests/**',
      'eslint.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 0,
      '@typescript-eslint/no-require-imports': 0,
    },
  },

  {
    files: ['tests/**', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
]