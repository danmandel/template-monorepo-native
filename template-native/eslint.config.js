// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const quantchatRules = require('./eslint-rules');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      quantchat: quantchatRules
    },
    rules: {
      'prettier/prettier': 'error',
      'import/no-default-export': 'error',
      'quantchat/prefer-export-const-component': 'error'
    }
  },
  {
    // expo-router requires default exports in app/ routes
    files: ['app/**/*.tsx', 'app/**/*.ts'],
    rules: {
      'import/no-default-export': 'off'
    }
  },
  {
    ignores: ['dist/*']
  }
]);
