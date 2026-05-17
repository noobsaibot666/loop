'use strict';

const defineConfig = require('eslint/config').defineConfig;
const gtsConfig = require('gts');
const globals = require('globals');
const ignores = require('./eslint.ignores.cjs');

module.exports = defineConfig([
  {ignores},
  ...gtsConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.worker,
        AbortController: 'readonly',
        crypto: 'readonly',
      },
    },
  },
  {
    files: ['server/**/*.js', 'shared/**/*.js', 'scripts/**/*.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
        AbortController: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        clearTimeout: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
      'no-unused-vars': 'off',
    },
  },
]);
