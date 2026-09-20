// A private, consistent SQL snapshot. Never logs credentials or customer data.
const { createWriteStream, existsSync, mkdirSync, writeFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { resolve, dirname } = require('node:path');
const { createGzip } = require('node:zlib');
const { once } = require('node:events');
const { pipeline } = require('node:stream/promises');
const mysql = require('mysql2/promise');
for (const file of ['.env.local', '.env']) if (existsSync(file)) process.loadEnvFile(file);
async function main() {
  if (!['127.0.0.1', 'localhost', '::1'].includes(process.env.DB_HOST)) throw new Error('This command is restricted to the local database.');
  const output = resolve(process.argv[2] || `reports/legacy/pre-migration-${Date.now()}.sql.gz`);
  mkdirSync(dirname(output), { recursive: true });
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true, timezone: 'Z' });
  const gzip = createGzip();
  const saving = pipeline(gzip, createWriteStream(output, { flags: 'wx' }));
  const write = async (text) => { if (!gzip.write(text)) await once(gzip, 'drain'); };
  const manifest = { database: process.env.DB_NAME, createdAt: new Date().toISOString(), tables: [] };
  try {
    await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await db.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    await write('SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\nSET time_zone="+00:00";\n');
    const [tables] = await db.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
    for (const table of tables) {
      const name = Object.values(table)[0];
      const quoted = mysql.escapeId(name);
      const [ddl] = await db.query(`SHOW CREATE TABLE ${quoted}`);
      const [keys] = await db.query(`SHOW KEYS FROM ${quoted} WHERE Key_name='PRIMARY'`);
      const primaryKey = keys.sort((a, b) => a.Seq_in_index - b.Seq_in_index).map(key => key.Column_name);
      if (!primaryKey.length) throw new Error(`No stable primary key for ${name}.`);
      const order = primaryKey.map(mysql.escapeId).join(',');
      const digest = createHash('sha256');
      await write(`DROP TABLE IF EXISTS ${quoted};\n${ddl[0]['Create Table']};\n`);
      let offset = 0;
      while (true) {
        const [rows] = await db.query(`SELECT * FROM ${quoted} ORDER BY ${order} LIMIT 500 OFFSET ?`, [offset]);
        if (!rows.length) break;
        const columns = Object.keys(rows[0]);
        for (const row of rows) digest.update(JSON.stringify(row) + '\n');
        await write(`INSERT INTO ${quoted} (${columns.map(mysql.escapeId).join(',')}) VALUES\n${rows.map(row => '(' + columns.map(c => mysql.escape(row[c] !== null && typeof row[c] === 'object' && !Buffer.isBuffer(row[c]) ? JSON.stringify(row[c]) : row[c])).join(',') + ')').join(',\n')};\n`);
        offset += rows.length;
      }
      manifest.tables.push({ name, primaryKey, count: offset, sha256: digest.digest('hex') });
    }
    await write('SET FOREIGN_KEY_CHECKS=1;\n');
    await db.commit(); gzip.end(); await saving;
    writeFileSync(`${output}.manifest.json`, JSON.stringify(manifest, null, 2), { flag: 'wx' });
    console.log(`Backup saved: ${output}`);
  } finally { await db.end(); }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
