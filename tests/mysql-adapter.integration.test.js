const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createMysqlDatabase } = require('../config/mysqlDatabase');

test('MySQL adapter supports better-sqlite3 style run/get/all and transactions', () => {
  const db = createMysqlDatabase();
  const table = '__nexaid_adapter_test';

  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    db.exec(`CREATE TABLE ${table} (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      amount BIGINT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB`);

    const first = db.prepare(`INSERT INTO ${table} (name, amount) VALUES (?, ?)`).run('alpha', 10);
    assert.equal(first.changes, 1);
    assert.ok(Number(first.lastInsertRowid) > 0);

    const row = db.prepare(`SELECT id, name, amount FROM ${table} WHERE id = ?`).get(first.lastInsertRowid);
    assert.equal(row.name, 'alpha');
    assert.equal(Number(row.amount), 10);
    assert.equal(db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(-1), undefined);

    const insertTwo = db.transaction(() => {
      db.prepare(`INSERT INTO ${table} (name, amount) VALUES (?, ?)`).run('beta', 20);
      db.prepare(`INSERT INTO ${table} (name, amount) VALUES (?, ?)`).run('gamma', 30);
    });
    insertTwo();
    assert.equal(db.prepare(`SELECT * FROM ${table} ORDER BY id`).all().length, 3);

    const rollback = db.transaction(() => {
      db.prepare(`INSERT INTO ${table} (name, amount) VALUES (?, ?)`).run('rollback', 99);
      throw new Error('rollback requested');
    });
    assert.throws(rollback, /rollback requested/);
    assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count, 3);
  } finally {
    try { db.exec(`DROP TABLE IF EXISTS ${table}`); } catch (_) {}
    db.close();
  }
});
