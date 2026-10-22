const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveRuntimeFlags } = require('../config/runtimeFlags');

test('external workers are disabled by default', () => {
  assert.deepEqual(resolveRuntimeFlags({}), {
    schedulerEnabled: false,
    backupEnabled: false,
    genieacsMonitoringEnabled: false,
    bindHost: '127.0.0.1',
  });
});

test('runtime flags only enable workers from explicit true values', () => {
  assert.deepEqual(
    resolveRuntimeFlags({ scheduler_enabled: true, auto_backup_enabled: '1', genieacs_monitoring_enabled: 'true', server_host: '0.0.0.0' }),
    { schedulerEnabled: true, backupEnabled: true, genieacsMonitoringEnabled: true, bindHost: '0.0.0.0' },
  );
});
