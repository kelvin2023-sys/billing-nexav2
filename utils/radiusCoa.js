const crypto = require('node:crypto');
const dgram = require('node:dgram');

const CODES = {
  DISCONNECT_REQUEST: 40,
  DISCONNECT_ACK: 41,
  DISCONNECT_NAK: 42,
  COA_REQUEST: 43,
  COA_ACK: 44,
  COA_NAK: 45
};

const ATTR = {
  USER_NAME: 1,
  FRAMED_IP_ADDRESS: 8,
  NAS_IP_ADDRESS: 4,
  ACCT_SESSION_ID: 44
};

function encodeIpv4(value) {
  const parts = String(value || '').trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
    throw new Error(`Alamat IPv4 tidak valid: ${value}`);
  }
  return Buffer.from(parts);
}

function encodeAttribute(type, value, isIp = false) {
  const body = isIp ? encodeIpv4(value) : Buffer.from(String(value), 'utf8');
  if (body.length > 253) throw new Error('Atribut RADIUS terlalu panjang');
  return Buffer.concat([Buffer.from([type, body.length + 2]), body]);
}

function encodeRequest({ code = CODES.DISCONNECT_REQUEST, identifier, secret, username, sessionId, framedIp, nasIp }) {
  if (!secret) throw new Error('Shared secret NAS tidak tersedia');
  if (!username) throw new Error('Username wajib diisi untuk Disconnect/CoA');

  const attrs = [encodeAttribute(ATTR.USER_NAME, username)];
  if (sessionId) attrs.push(encodeAttribute(ATTR.ACCT_SESSION_ID, sessionId));
  if (framedIp) attrs.push(encodeAttribute(ATTR.FRAMED_IP_ADDRESS, framedIp, true));
  if (nasIp) attrs.push(encodeAttribute(ATTR.NAS_IP_ADDRESS, nasIp, true));

  const attributeBuffer = Buffer.concat(attrs);
  const packet = Buffer.alloc(20 + attributeBuffer.length);
  packet.writeUInt8(code, 0);
  packet.writeUInt8(identifier, 1);
  packet.writeUInt16BE(packet.length, 2);
  attributeBuffer.copy(packet, 20);

  const authenticator = crypto.createHash('md5')
    .update(packet)
    .update(Buffer.from(secret, 'utf8'))
    .digest();
  authenticator.copy(packet, 4);

  return { packet, authenticator };
}

function verifyResponse(buffer, { identifier, requestAuthenticator, secret }) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 20) throw new Error('Balasan CoA tidak valid');
  const length = buffer.readUInt16BE(2);
  if (length < 20 || length > buffer.length) throw new Error('Panjang balasan CoA tidak valid');
  if (buffer.readUInt8(1) !== identifier) throw new Error('Identifier balasan CoA tidak cocok');

  const receivedAuthenticator = buffer.subarray(4, 20);
  const verificationPacket = Buffer.from(buffer.subarray(0, length));
  requestAuthenticator.copy(verificationPacket, 4);
  const expected = crypto.createHash('md5')
    .update(verificationPacket)
    .update(Buffer.from(secret, 'utf8'))
    .digest();

  if (!crypto.timingSafeEqual(receivedAuthenticator, expected)) {
    throw new Error('Authenticator balasan CoA tidak valid');
  }
  return buffer.readUInt8(0);
}

function sendDisconnect({ host, port = 3799, secret, username, sessionId, framedIp, timeoutMs = 5000 }) {
  return new Promise((resolve, reject) => {
    const identifier = crypto.randomBytes(1)[0];
    const { packet, authenticator } = encodeRequest({
      code: CODES.DISCONNECT_REQUEST,
      identifier,
      secret,
      username,
      sessionId,
      framedIp
    });
    const socket = dgram.createSocket('udp4');
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      if (error) reject(error); else resolve(result);
    };
    const timer = setTimeout(() => finish(new Error(`NAS ${host}:${port} tidak merespons CoA`)), timeoutMs);

    socket.on('error', error => finish(error));
    socket.on('message', message => {
      try {
        const responseCode = verifyResponse(message, {
          identifier,
          requestAuthenticator: authenticator,
          secret
        });
        if (responseCode === CODES.DISCONNECT_ACK) return finish(null, { ok: true, responseCode });
        if (responseCode === CODES.DISCONNECT_NAK) return finish(new Error('MikroTik menolak Disconnect-Request'));
        return finish(new Error(`Kode balasan CoA tidak dikenal: ${responseCode}`));
      } catch (error) {
        return finish(error);
      }
    });
    socket.send(packet, Number(port), host, error => {
      if (error) finish(error);
    });
  });
}

module.exports = { CODES, ATTR, encodeRequest, verifyResponse, sendDisconnect };
