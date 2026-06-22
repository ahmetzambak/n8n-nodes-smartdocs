module.exports = {
  extends: './.eslintrc.js',
  overrides: [
    { files: ['package.json'], plugins: ['eslint-plugin-n8n-nodes-base'], extends: ['plugin:n8n-nodes-base/community'] },
    { files: ['./credentials/**/*.ts'], plugins: ['eslint-plugin-n8n-nodes-base'], extends: ['plugin:n8n-nodes-base/credentials'], rules: { 'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off' } },
    { files: ['./nodes/**/*.ts'], plugins: ['eslint-plugin-n8n-nodes-base'], extends: ['plugin:n8n-nodes-base/nodes'] },
  ],
};
