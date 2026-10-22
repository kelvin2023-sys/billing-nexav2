#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { resolveDatabasePath } = require('../config/databasePath');
const { mapColumnType, normalizeDefault, normalizeValue, quoteIdentifier } = require('./lib/mysqlSchemaConverter');

function mysqlConfig() {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
    charset: 'utf8mb4',
  };
}

function getTables(sqlite) {
  return sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
}

function tableDefinition(sqlite, tableName) {
  const quotedTable = quoteIdentifier(tableName);
  const columns = sqlite.prepare(`PRAGMA table_info(${quotedTable})`).all();
  const indexes = sqlite.prepare(`PRAGMA index_list(${quotedTable})`).all();
  const indexDefinitions = indexes.map((index) => ({
    ...index,
    columns: sqlite.prepare(`PRAGMA index_info(${quoteIdentifier(index.name)})`).all().map((row) => row.name).filter(Boolean),
  })).filter((index) => index.columns.length > 0);
  const indexedColumns = new Set(indexDefinitions.flatMap((index) => index.columns));
  const primaryColumns = columns.filter((column) => column.pk).sort((a, b) => a.pk - b.pk);
  const singleIntegerPrimary = primaryColumns.length === 1 && /INT/i.test(primaryColumns[0].type || '');

  const columnTypes = new Map();
  const columnSql = columns.map((column) => {
    const mysqlType = mapColumnType({
      name: column.name,
      type: column.type,
      indexed: indexedColumns.has(column.name) || column.pk > 0,
    });
    columnTypes.set(column.name, mysqlType);
    const parts = [quoteIdentifier(column.name), mysqlType];
    if (singleIntegerPrimary && column.pk) {
      parts.push('NOT NULL AUTO_INCREMENT PRIMARY KEY');
      return parts.join(' ');
    }
    if (column.notnull || column.pk) parts.push('NOT NULL');
    const defaultSql = normalizeDefault(column.dflt_value, mysqlType);
    if (defaultSql) parts.push(defaultSql);
    return parts.join(' ');
  });

  if (!singleIntegerPrimary && primaryColumns.length) {
    columnSql.push(`PRIMARY KEY (${primaryColumns.map((column) => quoteIdentifier(column.name)).join(', ')})`);
  }

  const createSql = `CREATE TABLE ${quotedTable} (\n  ${columnSql.join(',\n  ')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
  const createIndexes = indexDefinitions
    .filter((index) => index.origin !== 'pk')
    .map((index, position) => {
      const prefix = index.unique ? 'UNIQUE INDEX' : 'INDEX';
      const generatedName = `${index.unique ? 'uq' : 'idx'}_${tableName}_${position + 1}`.slice(0, 60);
      return `CREATE ${prefix} ${quoteIdentifier(generatedName)} ON ${quotedTable} (${index.columns.map(quoteIdentifier).join(', ')})`;
    });

  return { createSql, createIndexes, columns: columns.map((column) => column.name), columnTypes };
}

async function insertRows(connection, sqlite, tableName, columns, columnTypes) {
  const rows = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(tableName)}`).all();
  if (!rows.length) return 0;
  const batchSize = 200;
  const quotedColumns = columns.map(quoteIdentifier).join(', ');

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const placeholders = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
    const values = batch.flatMap((row) => columns.map((column) => normalizeValue(row[column], columnTypes.get(column))));
    await connection.query(`INSERT INTO ${quoteIdentifier(tableName)} (${quotedColumns}) VALUES ${placeholders}`, values);
  }
  return rows.length;
}

async function main() {
  if (!process.argv.includes('--fresh')) {
    throw new Error('Refusing to replace MySQL schema without explicit --fresh');
  }

  const sourcePath = resolveDatabasePath();
  if (!fs.existsSync(sourcePath)) throw new Error(`SQLite source not found: ${sourcePath}`);

  const sqlite = new Database(sourcePath, { readonly: true, fileMustExist: true });
  const connection = await mysql.createConnection(mysqlConfig());
  const schemaStatements = ['SET NAMES utf8mb4', 'SET FOREIGN_KEY_CHECKS=0'];

  try {
    const tables = getTables(sqlite);
    await connection.query('SET FOREIGN_KEY_CHECKS=0');
    for (const table of [...tables].reverse()) {
      await connection.query(`DROP TABLE IF EXISTS ${quoteIdentifier(table.name)}`);
      schemaStatements.push(`DROP TABLE IF EXISTS ${quoteIdentifier(table.name)}`);
    }

    const definitions = new Map();
    for (const table of tables) {
      const definition = tableDefinition(sqlite, table.name);
      definitions.set(table.name, definition);
      await connection.query(definition.createSql);
      schemaStatements.push(definition.createSql);
    }

    for (const table of tables) {
      for (const indexSql of definitions.get(table.name).createIndexes) {
        await connection.query(indexSql);
        schemaStatements.push(indexSql);
      }
    }

    let copiedRows = 0;
    for (const table of tables) {
      const definition = definitions.get(table.name);
      copiedRows += await insertRows(connection, sqlite, table.name, definition.columns, definition.columnTypes);
    }

    await connection.query('SET FOREIGN_KEY_CHECKS=1');
    schemaStatements.push('SET FOREIGN_KEY_CHECKS=1');
    const schemaPath = path.join(__dirname, '..', 'database', 'mysql-schema.sql');
    fs.writeFileSync(schemaPath, `${schemaStatements.join(';\n\n')};\n`, 'utf8');
    console.log(JSON.stringify({ source: sourcePath, tables: tables.length, copiedRows, schemaPath }));
  } finally {
    sqlite.close();
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
