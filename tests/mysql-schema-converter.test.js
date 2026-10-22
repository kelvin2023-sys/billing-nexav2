const test = require('node:test');
const assert = require('node:assert/strict');
const { mapColumnType, normalizeDefault, normalizeValue } = require('../scripts/lib/mysqlSchemaConverter');

test('maps SQLite column types into MySQL types', () => {
  assert.equal(mapColumnType({ name: 'id', type: 'INTEGER', indexed: false }), 'BIGINT');
  assert.equal(mapColumnType({ name: 'price', type: 'REAL', indexed: false }), 'DOUBLE');
  assert.equal(mapColumnType({ name: 'username', type: 'TEXT', indexed: true }), 'VARCHAR(191)');
  assert.equal(mapColumnType({ name: 'notes', type: 'TEXT', indexed: false }), 'TEXT');
  assert.equal(mapColumnType({ name: 'created_at', type: 'DATETIME', indexed: false }), 'DATETIME');
});

test('normalizes SQLite defaults for MySQL', () => {
  assert.equal(normalizeDefault('(NOW_LOCAL())', 'DATETIME'), 'DEFAULT CURRENT_TIMESTAMP');
  assert.equal(normalizeDefault("'pending'", 'VARCHAR(191)'), "DEFAULT 'pending'");
  assert.equal(normalizeDefault('0', 'BIGINT'), 'DEFAULT 0');
  assert.equal(normalizeDefault("''", 'TEXT'), '');
  assert.equal(normalizeDefault(null, 'TEXT'), '');
});

test('normalizes ISO timestamps for MySQL DATETIME columns', () => {
  assert.equal(normalizeValue('2026-10-20T18:25:20.997Z', 'DATETIME'), '2026-10-20 18:25:20');
  assert.equal(normalizeValue('plain text', 'TEXT'), 'plain text');
  assert.equal(normalizeValue(null, 'DATETIME'), null);
});
