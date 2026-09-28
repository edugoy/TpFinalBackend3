const path = require('path');
const YAML = require('yamljs');

module.exports = YAML.load(path.resolve(__dirname, '../docs/openapi.yaml'));
