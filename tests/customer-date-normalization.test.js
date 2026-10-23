const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeOptionalDate } = require('../utils/optionalDate');

test('converts an empty customer expiry date to null for MySQL', () => {
  assert.equal(normalizeOptionalDate(''), null);
  assert.equal(normalizeOptionalDate('   '), null);
  assert.equal(normalizeOptionalDate(null), null);
});

test('preserves a valid customer expiry date', () => {
  assert.equal(normalizeOptionalDate('2026-11-23'), '2026-11-23');
  assert.equal(normalizeOptionalDate(' 2026-11-23 '), '2026-11-23');
});

test('keeps an omitted expiry date distinguishable from a cleared date', () => {
  assert.equal(normalizeOptionalDate(undefined), undefined);
});
