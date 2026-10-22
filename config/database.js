const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const driver = String(process.env.DB_DRIVER || 'sqlite').trim().toLowerCase();

if (driver === 'mysql') {
  const { createMysqlDatabase } = require('./mysqlDatabase');
  const db = createMysqlDatabase();
  db.getAppSetting = (key, defaultValue = null) => {
    try {
      const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
      return row ? JSON.parse(row.value) : defaultValue;
    } catch (_) {
      return defaultValue;
    }
  };
  db.saveAppSetting = (key, value) => {
    try {
      db.prepare('INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, NOW_LOCAL())')
        .run(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  };
  module.exports = db;
} else if (driver === 'sqlite') {
  module.exports = require('./sqliteDatabase');
} else {
  throw new Error(`Unsupported DB_DRIVER: ${driver}`);
}
