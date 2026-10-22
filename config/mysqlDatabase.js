const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { TextDecoder } = require('node:util');
const { translateSql } = require('./mysqlSqlTranslator');

const RESPONSE_BYTES = 16 * 1024 * 1024;
const decoder = new TextDecoder();

function normalizeParameters(args) {
  if (args.length === 0) return [];
  if (args.length === 1 && (Array.isArray(args[0]) || (args[0] && typeof args[0] === 'object'))) {
    return args[0];
  }
  return args;
}

function mysqlConfigFromEnv() {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = required.filter((key) => !String(process.env[key] || '').trim());
  if (missing.length) throw new Error(`MySQL configuration is incomplete: ${missing.join(', ')}`);

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  };
}

class MysqlDatabase {
  constructor(config = mysqlConfigFromEnv()) {
    this.open = true;
    this._transactionId = null;
    this._transactionSequence = 0;
    this._worker = new Worker(path.join(__dirname, 'mysqlWorker.js'), { workerData: config });
    this._worker.unref();
    this._call('ping');
  }

  _call(operation, sql = '', params = []) {
    if (!this.open && operation !== 'close') throw new Error('MySQL database is closed');
    const shared = new SharedArrayBuffer(12 + RESPONSE_BYTES);
    const state = new Int32Array(shared, 0, 3);
    this._worker.postMessage({
      operation,
      sql: translateSql(sql),
      params,
      transactionId: this._transactionId,
      shared,
    });

    const waitResult = Atomics.wait(state, 0, 0, Number(process.env.DB_SYNC_TIMEOUT_MS || 60000));
    if (waitResult === 'timed-out') throw new Error(`MySQL ${operation} timed out`);

    const length = Atomics.load(state, 1);
    const failed = Atomics.load(state, 2) === 1;
    const bytes = new Uint8Array(shared, 12, length);
    const payload = JSON.parse(decoder.decode(bytes));
    if (failed) {
      const error = new Error(payload.message || 'MySQL operation failed');
      Object.assign(error, payload);
      throw error;
    }
    if (payload && payload.__nexaidUndefined === true) return undefined;
    return payload;
  }

  prepare(sql) {
    const database = this;
    return {
      run(...args) {
        return database._call('run', sql, normalizeParameters(args));
      },
      get(...args) {
        return database._call('get', sql, normalizeParameters(args));
      },
      all(...args) {
        return database._call('all', sql, normalizeParameters(args));
      },
      pluck() {
        return this;
      },
      raw() {
        return this;
      },
      expand() {
        return this;
      },
    };
  }

  exec(sql) {
    this._call('exec', sql, []);
    return this;
  }

  transaction(fn) {
    const database = this;
    return function transactionWrapper(...args) {
      if (database._transactionId) return fn.apply(this, args);
      const transactionId = `tx-${process.pid}-${++database._transactionSequence}`;
      database._transactionId = transactionId;
      database._call('begin');
      try {
        const result = fn.apply(this, args);
        if (result && typeof result.then === 'function') {
          throw new Error('Synchronous database transaction callback must not return a Promise');
        }
        database._call('commit');
        return result;
      } catch (error) {
        try { database._call('rollback'); } catch (_) {}
        throw error;
      } finally {
        database._transactionId = null;
      }
    };
  }

  pragma() {
    return [];
  }

  function() {
    return this;
  }

  close() {
    if (!this.open) return;
    try { this._call('close'); } finally {
      this.open = false;
      this._worker.terminate();
    }
  }
}

function createMysqlDatabase(config) {
  return new MysqlDatabase(config);
}

module.exports = { MysqlDatabase, createMysqlDatabase, mysqlConfigFromEnv };
