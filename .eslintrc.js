module.exports = {
  root: true,
  env: { browser: true, es6: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module', extraFileExtensions: ['.json'] },
  ignorePatterns: ['.eslintrc.js', '.eslintrc.prepublish.js', '**/*.js', '**/node_modules/**', '**/dist/**'],
  overrides: [
    {
      files: ['package.json'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/community'],
      rules: { 'n8n-nodes-base/community-package-json-name-still-default': 'off' },
    },
    {
      files: ['./credentials/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/credentials'],
      // `cred-class-field-documentation-url-miscased` is a main-repo-only rule
      // (it camelCases documentationUrl, mangling a real URL). Community
      // packages use a full http URL, enforced by `...-not-http-url`.
      rules: { 'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off' },
    },
    {
      files: ['./nodes/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/nodes'],
    },
  ],
};
