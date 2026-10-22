const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mikrotikService = require('../services/mikrotikService');

test('PPPoE profile listing returns a safe array when MikroTik is configured', async () => {
  const profiles = await mikrotikService.getPppoeProfiles();
  assert.equal(Array.isArray(profiles), true);
  for (const profile of profiles) {
    assert.equal(typeof profile.name, 'string');
    assert.equal(typeof profile.id, 'string');
  }
});
