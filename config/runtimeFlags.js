function isExplicitlyEnabled(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function resolveRuntimeFlags(settings = {}) {
  return {
    schedulerEnabled: isExplicitlyEnabled(settings.scheduler_enabled),
    backupEnabled: isExplicitlyEnabled(settings.auto_backup_enabled),
    genieacsMonitoringEnabled: isExplicitlyEnabled(settings.genieacs_monitoring_enabled),
    bindHost: String(settings.server_host || '127.0.0.1').trim() || '127.0.0.1',
  };
}

module.exports = { isExplicitlyEnabled, resolveRuntimeFlags };
