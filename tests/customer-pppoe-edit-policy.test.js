const test = require('node:test');
const assert = require('node:assert/strict');
const { isRouterOsEmptyReply, resolvePppoeEditSyncAction } = require('../services/customerPppoeEditPolicy');

test('recognizes RouterOS !empty as a confirmed no-match result', () => {
  assert.equal(
    isRouterOsEmptyReply(new Error('Tried to process unknown reply: !empty')),
    true,
  );
  assert.equal(isRouterOsEmptyReply(new Error('Connection timed out')), false);
});

test('allows local customer edits when no matching PPPoE secret exists', () => {
  assert.equal(
    resolvePppoeEditSyncAction({ secretExists: false, passwordProvided: false }),
    'skip',
  );
});

test('creates a missing PPPoE secret only when a password was supplied', () => {
  assert.equal(
    resolvePppoeEditSyncAction({ secretExists: false, passwordProvided: true }),
    'create',
  );
});

test('updates the profile when the PPPoE secret already exists', () => {
  assert.equal(
    resolvePppoeEditSyncAction({ secretExists: true, passwordProvided: false }),
    'update',
  );
});
