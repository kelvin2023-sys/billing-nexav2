const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function columnNames(db, table) {
  return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((column) => column.name));
}

test('a clean NexaID database contains columns required by startup queries', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexaid-schema-'));
  const dbPath = path.join(tempDir, 'nexaid.sqlite');
  const previous = process.env.NEXAID_DB_PATH;
  const previousDriver = process.env.DB_DRIVER;
  process.env.NEXAID_DB_PATH = dbPath;
  process.env.DB_DRIVER = 'sqlite';

  let db;
  try {
    db = require('../config/database');

    const agentTransactionColumns = columnNames(db, 'agent_transactions');
    assert.ok(agentTransactionColumns.has('digi_refunded'));

    const radiusNasColumns = columnNames(db, 'radius_nas');
    assert.ok(radiusNasColumns.has('updated_at'));

    const voucherOrderColumns = columnNames(db, 'public_voucher_orders');
    assert.ok(voucherOrderColumns.has('payment_method'));
  } finally {
    if (db?.open) db.close();
    if (previous === undefined) delete process.env.NEXAID_DB_PATH;
    else process.env.NEXAID_DB_PATH = previous;
    if (previousDriver === undefined) delete process.env.DB_DRIVER;
    else process.env.DB_DRIVER = previousDriver;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
