const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const db = require('../config/database');
const { getSetting } = require('../config/settingsManager');
const { logger } = require('../config/logger');
const { sendDisconnect } = require('../utils/radiusCoa');

function tableExists(name) {
  const row = db.prepare(`
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = ?
  `).get(name);
  return Number(row?.total || 0) > 0;
}

function getServiceState() {
  if (process.platform === 'win32') return { running: false, detail: 'Status tersedia di server Linux' };
  const result = spawnSync('systemctl', ['is-active', 'freeradius'], { encoding: 'utf8', timeout: 3000 });
  const detail = String(result.stdout || result.stderr || '').trim();
  return { running: result.status === 0 && detail === 'active', detail: detail || 'unknown' };
}

function getStatus() {
  const service = getServiceState();
  let sqlReady = false;
  try {
    sqlReady = ['nas', 'radcheck', 'radreply', 'radacct', 'radpostauth'].every(tableExists);
  } catch (error) {
    logger.warn(`[FreeRADIUS] Pemeriksaan tabel gagal: ${error.message}`);
  }
  let radiusUsers = 0;
  try {
    if (tableExists('radcheck')) {
      radiusUsers = Number(db.prepare(`SELECT COUNT(DISTINCT username) AS total FROM radcheck WHERE attribute = 'Cleartext-Password'`).get()?.total || 0);
    }
  } catch (error) {
    logger.warn(`[FreeRADIUS] Gagal menghitung user: ${error.message}`);
  }
  return {
    backend: 'freeradius',
    enabled: getSetting('radius_enabled', '0') === '1',
    running: service.running,
    serviceDetail: service.detail,
    sqlReady,
    authPort: 1812,
    acctPort: 1813,
    coaPort: 3799,
    radiusUsers,
    isolirAction: getSetting('radius_isolir_action', 'pool'),
    isolirPool: getSetting('radius_isolir_pool', 'isolir'),
    isolirRateLimit: getSetting('radius_isolir_rate_limit', '512k/512k'),
    isolirIpPoolStart: getSetting('radius_isolir_ip_pool_start', '10.250.99.2'),
    isolirIpPoolEnd: getSetting('radius_isolir_ip_pool_end', '10.250.99.254'),
    defaultRateLimit: getSetting('radius_default_rate_limit', '5M/10M'),
    limitSimultaneous: getSetting('radius_limit_simultaneous', '1') === '1',
    isolirIpPoolEnabled: getSetting('radius_isolir_ip_pool_enabled', '1') === '1',
    ipPoolEnabled: getSetting('radius_ip_pool_enabled', '1') === '1',
    ipPoolStart: getSetting('radius_ip_pool_start', '10.250.10.2'),
    ipPoolEnd: getSetting('radius_ip_pool_end', '10.250.10.254'),
    framedPool: getSetting('radius_framed_pool', 'pool-pppoe')
  };
}

function listNas() {
  return db.prepare('SELECT * FROM radius_nas ORDER BY id DESC').all() || [];
}

function mirrorNas(nas) {
  db.prepare('DELETE FROM nas WHERE nasname = ?').run(nas.nasname);
  if (!Number(nas.is_active)) return;
  db.prepare(`
    INSERT INTO nas (nasname, shortname, type, ports, secret, server, community, description)
    VALUES (?, ?, 'other', NULL, ?, NULL, NULL, ?)
  `).run(nas.nasname, nas.shortname || nas.nasname, nas.secret, nas.description || 'NexaID NAS');
}

function mirrorNasById(id) {
  const nas = db.prepare('SELECT * FROM radius_nas WHERE id = ?').get(id);
  if (!nas) throw new Error('NAS tidak ditemukan');
  mirrorNas(nas);
  return nas;
}

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function speedToRadius(value) {
  const kbps = Math.max(0, Math.round(Number(value) || 0));
  return kbps > 0 ? `${kbps}k` : '';
}

function removeUsername(username) {
  const cleanUsername = String(username || '').trim();
  if (!cleanUsername) return;
  const remove = db.transaction(() => {
    db.prepare('DELETE FROM radcheck WHERE username = ?').run(cleanUsername);
    db.prepare('DELETE FROM radreply WHERE username = ?').run(cleanUsername);
    db.prepare('DELETE FROM radusergroup WHERE username = ?').run(cleanUsername);
  });
  remove();
}

function syncCustomer(customerId) {
  const customer = db.prepare(`
    SELECT c.id, c.name, c.status, c.connection_type, c.is_radius,
           c.pppoe_username, c.pppoe_password, c.pppoe_remote_address,
           c.static_ip, c.isolir_profile,
           p.speed_up, p.speed_down
    FROM customers c
    LEFT JOIN packages p ON p.id = c.package_id
    WHERE c.id = ?
  `).get(customerId);
  if (!customer) throw new Error('Pelanggan tidak ditemukan');

  const username = String(customer.pppoe_username || '').trim();
  if (!username) return { synced: false, reason: 'Username PPPoE kosong' };

  const sync = db.transaction(() => {
    removeUsername(username);

    const eligible = Number(customer.is_radius) === 1 &&
      String(customer.connection_type || 'pppoe') === 'pppoe' &&
      ['active', 'suspended'].includes(String(customer.status || '').toLowerCase());
    if (!eligible) return;

    const status = String(customer.status).toLowerCase();
    if (status === 'suspended' && getSetting('radius_isolir_action', 'pool') === 'reject') return;

    db.prepare(`
      INSERT INTO radcheck (username, attribute, op, value)
      VALUES (?, 'Cleartext-Password', ':=', ?)
    `).run(username, String(customer.pppoe_password || ''));

    if (getSetting('radius_limit_simultaneous', '1') === '1') {
      db.prepare(`
        INSERT INTO radcheck (username, attribute, op, value)
        VALUES (?, 'Simultaneous-Use', ':=', '1')
      `).run(username);
    }

    let rateLimit = getSetting('radius_default_rate_limit', '5M/10M');
    if (status === 'suspended') {
      rateLimit = getSetting('radius_isolir_rate_limit', '512k/512k');
      const isolirPool = String(customer.isolir_profile || getSetting('radius_isolir_pool', 'isolir')).trim();
      if (isolirPool) {
        const attribute = getSetting('radius_isolir_ip_pool_enabled', '1') === '1' ? 'Framed-Pool' : 'Mikrotik-Group';
        db.prepare(`INSERT INTO radreply (username, attribute, op, value) VALUES (?, ?, ':=', ?)`).run(username, attribute, isolirPool);
      }
    } else {
      const up = speedToRadius(customer.speed_up);
      const down = speedToRadius(customer.speed_down);
      if (up && down) rateLimit = `${up}/${down}`;

      const fixedIp = String(customer.static_ip || customer.pppoe_remote_address || '').trim();
      if (fixedIp) {
        db.prepare(`INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Framed-IP-Address', ':=', ?)`).run(username, fixedIp);
      } else if (getSetting('radius_ip_pool_enabled', '1') === '1') {
        const pool = String(getSetting('radius_framed_pool', 'pool-pppoe')).trim();
        if (pool) db.prepare(`INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Framed-Pool', ':=', ?)`).run(username, pool);
      }
    }

    if (rateLimit) {
      db.prepare(`INSERT INTO radreply (username, attribute, op, value) VALUES (?, 'Mikrotik-Rate-Limit', ':=', ?)`).run(username, rateLimit);
    }
  });
  sync();
  return { synced: true, username };
}

function syncAllCustomers() {
  const customers = db.prepare(`
    SELECT id FROM customers
    WHERE connection_type = 'pppoe' AND pppoe_username <> ''
  `).all() || [];
  let synced = 0;
  const errors = [];
  for (const customer of customers) {
    try {
      syncCustomer(customer.id);
      synced += 1;
    } catch (error) {
      errors.push(`ID ${customer.id}: ${error.message}`);
    }
  }
  return { total: customers.length, synced, errors };
}

function getOnlineSessions() {
  if (!tableExists('radacct')) return [];
  return db.prepare(`
    SELECT
      radacctid AS id,
      username,
      acctsessionid AS session_id,
      nasipaddress AS nas_ip,
      framedipaddress AS framed_ip,
      acctinputoctets AS input_octets,
      acctoutputoctets AS output_octets,
      0 AS input_gigawords,
      0 AS output_gigawords,
      acctsessiontime AS session_time,
      acctstarttime AS created_at,
      acctupdatetime AS updated_at,
      c.name AS customer_name
    FROM radacct ra
    LEFT JOIN customers c ON c.pppoe_username = ra.username
    WHERE ra.acctstoptime IS NULL
    ORDER BY COALESCE(ra.acctupdatetime, ra.acctstarttime) DESC
    LIMIT 200
  `).all() || [];
}

function getAccountingLogs(limit = 100) {
  if (!tableExists('radacct')) return [];
  return db.prepare(`
    SELECT
      radacctid AS id,
      username,
      acctsessionid AS session_id,
      nasipaddress AS nas_ip,
      framedipaddress AS framed_ip,
      CASE WHEN acctstoptime IS NULL THEN 3 ELSE 2 END AS status_type,
      acctinputoctets AS input_octets,
      acctoutputoctets AS output_octets,
      0 AS input_gigawords,
      0 AS output_gigawords,
      acctsessiontime AS session_time,
      acctstarttime AS created_at,
      acctupdatetime AS updated_at
    FROM radacct
    ORDER BY radacctid DESC
    LIMIT ?
  `).all(Number(limit) || 100) || [];
}

function getTodayStats() {
  if (!tableExists('radacct')) return { total_events: 0, total_bytes: 0 };
  return db.prepare(`
    SELECT COUNT(*) AS total_events,
           COALESCE(SUM(acctinputoctets + acctoutputoctets), 0) AS total_bytes
    FROM radacct
    WHERE DATE(acctstarttime) = CURRENT_DATE()
  `).get() || { total_events: 0, total_bytes: 0 };
}

async function disconnectSession(username, sessionId, nasIp, framedIp) {
  const nas = db.prepare(`
    SELECT * FROM radius_nas
    WHERE nasname = ? AND is_active = 1
    LIMIT 1
  `).get(String(nasIp || '').trim());
  if (!nas) throw new Error(`NAS aktif untuk IP ${nasIp || '-'} tidak ditemukan`);
  const result = await sendDisconnect({
    host: nas.nasname,
    port: Number(getSetting('radius_coa_port', '3799')) || 3799,
    secret: nas.secret,
    username,
    sessionId,
    framedIp
  });
  logger.info(`[FreeRADIUS CoA] Disconnect-ACK untuk ${username} dari NAS ${nas.nasname}`);
  return result;
}

async function disconnectUser(username) {
  const cleanUsername = String(username || '').trim();
  if (!cleanUsername) throw new Error('Username RADIUS kosong');
  const sessions = db.prepare(`
    SELECT acctsessionid AS session_id, nasipaddress AS nas_ip, framedipaddress AS framed_ip
    FROM radacct
    WHERE username = ? AND acctstoptime IS NULL
  `).all(cleanUsername) || [];
  if (!sessions.length) throw new Error(`Tidak ada sesi RADIUS aktif untuk ${cleanUsername}`);
  const results = [];
  for (const session of sessions) {
    results.push(await disconnectSession(cleanUsername, session.session_id, session.nas_ip, session.framed_ip));
  }
  return results;
}

function buildMikrotikScript(nas, serverIp) {
  const safeServer = String(serverIp || '').trim();
  const safeNas = String(nas.nasname || '').trim();
  return `# NexaID FreeRADIUS - ${nas.shortname || safeNas}\n` +
    `/radius remove [find comment="NEXA-FREERADIUS"]\n` +
    `/radius add service=ppp address=${safeServer} src-address=${safeNas} secret="${nas.secret}" authentication-port=1812 accounting-port=1813 timeout=3s require-message-auth=yes comment="NEXA-FREERADIUS"\n` +
    `/radius incoming set accept=yes port=3799\n` +
    `/ppp aaa set use-radius=yes accounting=yes interim-update=1m\n`;
}

module.exports = {
  getStatus,
  listNas,
  mirrorNas,
  mirrorNasById,
  generateSecret,
  syncCustomer,
  syncAllCustomers,
  removeUsername,
  getOnlineSessions,
  getAccountingLogs,
  getTodayStats,
  disconnectSession,
  disconnectUser,
  buildMikrotikScript
};
