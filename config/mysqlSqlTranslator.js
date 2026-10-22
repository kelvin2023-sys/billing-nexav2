function translateSql(input) {
  let sql = String(input || '');

  sql = sql.replace(/\bINSERT\s+OR\s+IGNORE\b/gi, 'INSERT IGNORE');
  sql = sql.replace(/\bINSERT\s+OR\s+REPLACE\b/gi, 'REPLACE');
  sql = sql.replace(/\blast_insert_rowid\s*\(\s*\)/gi, 'LAST_INSERT_ID()');
  sql = sql.replace(/\bNOW_LOCAL\s*\(\s*\)/gi, 'CURRENT_TIMESTAMP');
  sql = sql.replace(/\bAUTOINCREMENT\b/gi, 'AUTO_INCREMENT');
  sql = sql.replace(/\s+COLLATE\s+NOCASE\b/gi, '');
  sql = sql.replace(/\b([A-Za-z0-9_.]+)\s+IS\s+NOT\s+\?/gi, 'NOT ($1 <=> ?)');
  sql = sql.replace(/\b([A-Za-z0-9_.]+)\s+IS\s+\?/gi, '$1 <=> ?');
  sql = sql.replace(/\bdatetime\s*\(\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\)/gi, '$1');

  sql = sql.replace(
    /\bdatetime\s*\(\s*['"]now['"]\s*,\s*['"]-(\d+)\s+(minute|minutes|hour|hours|day|days)['"]\s*\)/gi,
    (_match, amount, unit) => `DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${amount} ${unit.replace(/s$/i, '').toUpperCase()})`,
  );
  sql = sql.replace(
    /\bdatetime\s*\(\s*CURRENT_TIMESTAMP\s*,\s*['"]-(\d+)\s+(minute|minutes|hour|hours|day|days)['"]\s*\)/gi,
    (_match, amount, unit) => `DATE_SUB(CURRENT_TIMESTAMP, INTERVAL ${amount} ${unit.replace(/s$/i, '').toUpperCase()})`,
  );
  sql = sql.replace(/\bdatetime\s*\(\s*['"]now['"]\s*(?:,\s*['"]localtime['"]\s*)?\)/gi, 'CURRENT_TIMESTAMP');
  sql = sql.replace(/\bdate\s*\(\s*['"]now['"]\s*(?:,\s*['"]localtime['"]\s*)?\)/gi, 'CURRENT_DATE');
  sql = sql.replace(
    /\bstrftime\s*\(\s*(['"])([^'"]+)\1\s*,\s*([^\)]+)\)/gi,
    (_match, _quote, format, expression) => `DATE_FORMAT(${expression.trim()}, '${format}')`,
  );

  if (/\bapp_settings\b/i.test(sql)) {
    sql = sql.replace(/\bWHERE\s+key\b/gi, 'WHERE `key`');
    sql = sql.replace(/\bSELECT\s+key\s*,/gi, 'SELECT `key`,');
    sql = sql.replace(/\(\s*key\s*,/gi, '(`key`,');
  }

  sql = sql.replace(/notes\s*\|\|\s*(['"]\\n['"])\s*\|\|\s*\?/gi, 'CONCAT(notes, $1, ?)');
  sql = sql.replace(
    /^PRAGMA\s+table_info\s*\(\s*([A-Za-z0-9_]+)\s*\)$/i,
    (_match, table) => `SELECT COLUMN_NAME AS name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = '${table}' ORDER BY ORDINAL_POSITION`,
  );

  return sql.trim();
}

module.exports = { translateSql };
