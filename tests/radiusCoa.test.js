const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { CODES, encodeRequest, verifyResponse } = require('../utils/radiusCoa');

test('encodeRequest creates a valid Disconnect-Request', () => {
  const result = encodeRequest({
    identifier: 9,
    secret: 'test-secret',
    username: 'demo-user',
    sessionId: 'session-1',
    framedIp: '10.250.10.10'
  });
  assert.equal(result.packet.readUInt8(0), CODES.DISCONNECT_REQUEST);
  assert.equal(result.packet.readUInt8(1), 9);
  assert.equal(result.packet.readUInt16BE(2), result.packet.length);
  assert.equal(result.authenticator.length, 16);
});

test('verifyResponse accepts a correctly authenticated ACK', () => {
  const secret = 'test-secret';
  const requestAuthenticator = crypto.randomBytes(16);
  const response = Buffer.alloc(20);
  response.writeUInt8(CODES.DISCONNECT_ACK, 0);
  response.writeUInt8(7, 1);
  response.writeUInt16BE(20, 2);
  requestAuthenticator.copy(response, 4);
  const digest = crypto.createHash('md5').update(response).update(secret).digest();
  digest.copy(response, 4);
  assert.equal(verifyResponse(response, { identifier: 7, requestAuthenticator, secret }), CODES.DISCONNECT_ACK);
});
