const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function resolveDatabasePath() {
  const configuredPath = String(process.env.NEXAID_DB_PATH || '').trim();
  if (configuredPath) return path.resolve(configuredPath);
  return path.join(projectRoot, 'storage', 'data', 'nexaid.sqlite');
}

module.exports = { resolveDatabasePath };
