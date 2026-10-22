const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function loadFresh() {
  const modulePath = require.resolve('../config/databasePath');
  delete require.cache[modulePath];
  return require('../config/databasePath');
}

test('resolveDatabasePath uses NEXAID_DB_PATH when configured', () => {
  const previous = process.env.NEXAID_DB_PATH;
  process.env.NEXAID_DB_PATH = path.join(projectRoot, 'storage', 'test.sqlite');
  try {
    const { resolveDatabasePath } = loadFresh();
    assert.equal(resolveDatabasePath(), path.resolve(process.env.NEXAID_DB_PATH));
  } finally {
    if (previous === undefined) delete process.env.NEXAID_DB_PATH;
    else process.env.NEXAID_DB_PATH = previous;
  }
});

test('resolveDatabasePath defaults to storage/data/nexaid.sqlite', () => {
  const previous = process.env.NEXAID_DB_PATH;
  delete process.env.NEXAID_DB_PATH;
  try {
    const { resolveDatabasePath } = loadFresh();
    assert.equal(
      resolveDatabasePath(),
      path.join(projectRoot, 'storage', 'data', 'nexaid.sqlite'),
    );
  } finally {
    if (previous !== undefined) process.env.NEXAID_DB_PATH = previous;
  }
});
