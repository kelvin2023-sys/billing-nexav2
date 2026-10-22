'use strict';

function toSqlDateTime(value) {
  if (value === null || value === undefined || value === '') return null;

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new TypeError(`Invalid datetime value: ${String(value)}`);
  }

  return date.toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = { toSqlDateTime };
