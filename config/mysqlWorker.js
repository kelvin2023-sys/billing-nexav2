const { parentPort, workerData } = require('node:worker_threads');
const mysql = require('mysql2/promise');
const { TextEncoder } = require('node:util');

const encoder = new TextEncoder();
const transactions = new Map();
const pool = mysql.createPool({
  host: workerData.host,
  port: workerData.port,
  user: workerData.user,
  password: workerData.password,
  database: workerData.database,
  waitForConnections: true,
  connectionLimit: workerData.connectionLimit || 10,
  queueLimit: 0,
  multipleStatements: true,
  namedPlaceholders: true,
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: false,
  charset: 'utf8mb4',
});

function finish(shared, payload, failed = false) {
  const state = new Int32Array(shared, 0, 3);
  const serializedPayload = payload === undefined ? { __nexaidUndefined: true } : payload;
  const bytes = encoder.encode(JSON.stringify(serializedPayload));
  const output = new Uint8Array(shared, 12);
  if (bytes.length > output.length) {
    const fallback = encoder.encode(JSON.stringify({
      name: 'MysqlAdapterResponseTooLarge',
      message: `MySQL response exceeds ${output.length} byte synchronous buffer`,
    }));
    output.set(fallback.subarray(0, output.length));
    Atomics.store(state, 1, Math.min(fallback.length, output.length));
    Atomics.store(state, 2, 1);
  } else {
    output.set(bytes);
    Atomics.store(state, 1, bytes.length);
    Atomics.store(state, 2, failed ? 1 : 0);
  }
  Atomics.store(state, 0, 1);
  Atomics.notify(state, 0, 1);
}

async function execute(message) {
  const { operation, sql, params, transactionId } = message;

  if (operation === 'ping') {
    await pool.query('SELECT 1 AS ok');
    return { ok: true };
  }

  if (operation === 'begin') {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    transactions.set(transactionId, connection);
    return { ok: true };
  }

  if (operation === 'commit' || operation === 'rollback') {
    const connection = transactions.get(transactionId);
    if (!connection) throw new Error(`Unknown transaction ${transactionId}`);
    try {
      if (operation === 'commit') await connection.commit();
      else await connection.rollback();
    } finally {
      transactions.delete(transactionId);
      connection.release();
    }
    return { ok: true };
  }

  if (operation === 'close') {
    for (const connection of transactions.values()) {
      try { await connection.rollback(); } catch (_) {}
      connection.release();
    }
    transactions.clear();
    await pool.end();
    return { ok: true };
  }

  const executor = transactionId ? transactions.get(transactionId) : pool;
  if (!executor) throw new Error(`Unknown transaction ${transactionId}`);
  const [result] = await executor.query(sql, params);

  if (operation === 'run') {
    return {
      changes: Number(result.affectedRows || 0),
      lastInsertRowid: Number(result.insertId || 0),
    };
  }
  if (operation === 'get') return Array.isArray(result) ? (result[0] || undefined) : result;
  if (operation === 'all') return Array.isArray(result) ? result : [];
  return { ok: true };
}

parentPort.on('message', async (message) => {
  try {
    finish(message.shared, await execute(message), false);
  } catch (error) {
    finish(message.shared, {
      name: error?.name || 'MysqlAdapterError',
      code: error?.code || '',
      errno: error?.errno || 0,
      sqlState: error?.sqlState || '',
      message: error?.message || String(error),
      sql: error?.sql || message.sql || '',
    }, true);
  }
});
