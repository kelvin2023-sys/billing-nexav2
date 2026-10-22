const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createMysqlDatabase } = require('./mysqlDatabase');

// NexaID Billing V2 is MySQL-only. Failing fast here prevents the application
// from silently creating or using a local database file.
const configuredDriver = String(process.env.DB_DRIVER || 'mysql').trim().toLowerCase();
if (configuredDriver !== 'mysql') {
  throw new Error(`NexaID Billing V2 only supports MySQL (received DB_DRIVER=${configuredDriver})`);
}

const db = createMysqlDatabase();
db.getAppSetting = (key, defaultValue = null) => {
  try {
    const row = db.prepare('SELECT value FROM app_settings WHERE `key` = ?').get(key);
    return row ? JSON.parse(row.value) : defaultValue;
  } catch (_) {
    return defaultValue;
  }
};
db.saveAppSetting = (key, value) => {
  try {
    db.prepare(`
      INSERT INTO app_settings (\`key\`, value, updated_at)
      VALUES (?, ?, NOW_LOCAL())
      ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = VALUES(updated_at)
    `).run(key, JSON.stringify(value));
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = db;
