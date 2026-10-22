/** Read-only MySQL health and schema verification. */
require('dotenv').config();

const db = require('../config/database');

const requiredTables = [
  'app_settings', 'customers', 'packages', 'invoices', 'routers',
  'olts', 'odps', 'audit_trail', 'public_voucher_orders'
];

const requiredColumns = {
  customers: ['id', 'name', 'router_id', 'auto_isolate', 'promo_cycles_used'],
  invoices: ['id', 'customer_id', 'amount', 'status'],
  routers: ['id', 'name', 'host', 'is_active'],
  public_voucher_orders: ['id', 'payment_method']
};

try {
  const databaseName = String(process.env.DB_NAME || '').trim();
  if (!databaseName) throw new Error('DB_NAME wajib diisi');

  const ping = db.prepare('SELECT 1 AS ok').get();
  if (Number(ping?.ok) !== 1) throw new Error('MySQL tidak merespons health check');

  const tables = new Set(db.prepare(`
    SELECT TABLE_NAME AS name
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
  `).all(databaseName).map((row) => row.name));

  const missingTables = requiredTables.filter((name) => !tables.has(name));
  const missingColumns = [];
  for (const [table, columns] of Object.entries(requiredColumns)) {
    const existing = new Set(db.prepare(`
      SELECT COLUMN_NAME AS name
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `).all(databaseName, table).map((row) => row.name));
    for (const column of columns) {
      if (!existing.has(column)) missingColumns.push(`${table}.${column}`);
    }
  }

  if (missingTables.length || missingColumns.length) {
    if (missingTables.length) console.error(`Tabel hilang: ${missingTables.join(', ')}`);
    if (missingColumns.length) console.error(`Kolom hilang: ${missingColumns.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log(`MySQL sehat: ${databaseName}, ${tables.size} tabel terdeteksi.`);
  }
} catch (error) {
  console.error(`Verifikasi MySQL gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (db?.open) db.close();
}
