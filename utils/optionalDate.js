function normalizeOptionalDate(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

module.exports = { normalizeOptionalDate };
