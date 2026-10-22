'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { toSqlDateTime } = require('../utils/sqlDateTime');

test('converts ISO timestamps to MySQL DATETIME format', () => {
  assert.equal(
    toSqlDateTime('2026-10-23T15:49:39.299Z'),
    '2026-10-23 15:49:39'
  );
});

test('preserves empty optional expiry values as null', () => {
  assert.equal(toSqlDateTime(null), null);
  assert.equal(toSqlDateTime(''), null);
});

test('rejects invalid datetime values', () => {
  assert.throws(() => toSqlDateTime('not-a-date'), /Invalid datetime value/);
});
