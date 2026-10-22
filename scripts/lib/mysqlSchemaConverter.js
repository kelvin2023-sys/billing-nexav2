function mapColumnType({ name, type, indexed }) {
  const normalized = String(type || 'TEXT').toUpperCase();
  if (normalized.includes('INT')) return 'BIGINT';
  if (normalized.includes('REAL') || normalized.includes('FLOA') || normalized.includes('DOUB')) return 'DOUBLE';
  if (normalized.includes('BLOB')) return 'LONGBLOB';
  if (normalized.includes('DATE') || normalized.includes('TIME')) return 'DATETIME';
  if (normalized.includes('NUM') || normalized.includes('DEC')) return 'DECIMAL(20,4)';
  if (indexed) return 'VARCHAR(191)';

  const shortTextNames = /^(status|type|role|code|name|title|phone|email|username|password|month|year|ip|host|port|method|category|brand|model|serial|sn|profile|token|reference|ref_id)$/i;
  if (shortTextNames.test(String(name))) return 'VARCHAR(255)';
  return 'TEXT';
}

function normalizeDefault(defaultValue, mysqlType) {
  if (defaultValue === null || defaultValue === undefined) return '';
  const raw = String(defaultValue).trim();
  if (!raw || /^null$/i.test(raw)) return '';
  if (/NOW_LOCAL\s*\(\s*\)/i.test(raw) || /CURRENT_TIMESTAMP/i.test(raw)) {
    return 'DEFAULT CURRENT_TIMESTAMP';
  }
  if (/^(TEXT|LONGTEXT|MEDIUMTEXT|LONGBLOB|BLOB)$/i.test(mysqlType)) return '';
  if (/^\(.+\)$/.test(raw)) return `DEFAULT ${raw.slice(1, -1)}`;
  return `DEFAULT ${raw}`;
}

function normalizeValue(value, mysqlType) {
  if (value === null || value === undefined) return value;
  if (mysqlType === 'DATETIME' && typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
    if (match) return `${match[1]} ${match[2]}`;
  }
  return value;
}

function quoteIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

module.exports = { mapColumnType, normalizeDefault, normalizeValue, quoteIdentifier };
