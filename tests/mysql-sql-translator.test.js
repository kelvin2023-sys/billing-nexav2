const test = require('node:test');
const assert = require('node:assert/strict');

const { translateSql } = require('../config/mysqlSqlTranslator');

test('normalizes legacy DML into MySQL syntax', () => {
  assert.equal(
    translateSql("INSERT OR IGNORE INTO users (name) VALUES (?)"),
    "INSERT IGNORE INTO users (name) VALUES (?)",
  );
  assert.equal(
    translateSql("INSERT OR REPLACE INTO users (id, name) VALUES (?, ?)"),
    "REPLACE INTO users (id, name) VALUES (?, ?)",
  );
});

test('normalizes date functions and collation for MySQL', () => {
  assert.equal(
    translateSql("SELECT datetime('now'), date('now'), strftime('%Y-%m', created_at) FROM invoices WHERE name = ? COLLATE NOCASE"),
    "SELECT CURRENT_TIMESTAMP, CURRENT_DATE, DATE_FORMAT(created_at, '%Y-%m') FROM invoices WHERE name = ?",
  );
});

test('translates last insert helper and schema tokens', () => {
  assert.equal(
    translateSql('SELECT last_insert_rowid(); CREATE TABLE x (id INTEGER PRIMARY KEY AUTOINCREMENT)'),
    'SELECT LAST_INSERT_ID(); CREATE TABLE x (id INTEGER PRIMARY KEY AUTO_INCREMENT)',
  );
});

test('keeps parameter placeholders unchanged', () => {
  assert.equal(
    translateSql('SELECT * FROM customers WHERE id = ? AND status IN (?, ?)'),
    'SELECT * FROM customers WHERE id = ? AND status IN (?, ?)',
  );
});

test('normalizes legacy runtime expressions used by NexaID', () => {
  assert.equal(
    translateSql("SELECT NOW_LOCAL(), datetime('now', '-2 hours'), date('now', 'localtime')"),
    'SELECT CURRENT_TIMESTAMP, DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), CURRENT_DATE',
  );
  assert.equal(
    translateSql("SELECT value FROM app_settings WHERE key = 'x'"),
    "SELECT value FROM app_settings WHERE `key` = 'x'",
  );
  assert.equal(
    translateSql("UPDATE invoices SET notes=CASE WHEN notes IS NULL THEN ? ELSE notes || '\\n' || ? END"),
    "UPDATE invoices SET notes=CASE WHEN notes IS NULL THEN ? ELSE CONCAT(notes, '\\n', ?) END",
  );
  assert.equal(
    translateSql("SELECT COUNT(*) FROM audit_trail WHERE created_at >= datetime(NOW_LOCAL(), '-24 hours')"),
    'SELECT COUNT(*) FROM audit_trail WHERE created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR)',
  );
  assert.equal(
    translateSql('PRAGMA table_info(customers)'),
    "SELECT COLUMN_NAME AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'customers' ORDER BY ORDINAL_POSITION",
  );
});


test('normalizes IS placeholder comparisons for MySQL', () => {
  assert.equal(
    translateSql('SELECT id FROM customers WHERE router_id IS ? AND pppoe_username = ? LIMIT 1'),
    'SELECT id FROM customers WHERE router_id <=> ? AND pppoe_username = ? LIMIT 1',
  );
  assert.equal(
    translateSql('SELECT id FROM customers WHERE router_id IS NOT ? LIMIT 1'),
    'SELECT id FROM customers WHERE NOT (router_id <=> ?) LIMIT 1',
  );
});


test('removes legacy datetime wrappers around columns for MySQL', () => {
  assert.equal(
    translateSql('SELECT * FROM invoices ORDER BY datetime(i.paid_at) DESC'),
    'SELECT * FROM invoices ORDER BY i.paid_at DESC',
  );
});
