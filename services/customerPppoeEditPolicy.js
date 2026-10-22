function isRouterOsEmptyReply(error) {
  return /unknown reply:\s*!empty/i.test(String(error?.message || error || ''));
}

function resolvePppoeEditSyncAction({ secretExists, passwordProvided }) {
  if (secretExists) return 'update';
  if (passwordProvided) return 'create';
  return 'skip';
}

module.exports = { isRouterOsEmptyReply, resolvePppoeEditSyncAction };
