// Imports the existing SQL export only into an empty, project-specific database.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

async function main() {
  const root = path.resolve(__dirname, '..');
  process.chdir(root);
  const envPath = path.join(root, '.env.local');
  let source = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : fs.readFileSync('.env.example', 'utf8');
  const previous = dotenv.parse(source);
  if (previous.DB_PORT !== '13308' || previous.DB_USER !== 'n7cosmetics' || !previous.DB_ROOT_PASSWORD || previous.DB_ROOT_PASSWORD === 'change-me') {
    fs.mkdirSync('reports', { recursive: true });
    fs.writeFileSync(path.join('reports', `env-before-docker-${Date.now()}.backup`), source, { mode: 0o600 });
    const values = { DB_HOST: '127.0.0.1', DB_PORT: '13308', DB_NAME: 'n7cosmetics', DB_USER: 'n7cosmetics', DB_PASSWORD: randomBytes(32).toString('hex'), DB_ROOT_PASSWORD: randomBytes(32).toString('hex') };
    for (const [key, value] of Object.entries(values)) {
      const expression = new RegExp(`^${key}=.*$`, 'm');
      source = expression.test(source) ? source.replace(expression, `${key}=${value}`) : `${source.trimEnd()}\n${key}=${value}\n`;
    }
    fs.writeFileSync(envPath, source, { mode: 0o600 });
  }
  const env = dotenv.parse(source);
  if (!env.DB_ROOT_PASSWORD) throw new Error('Missing local database root password. Keep the existing Docker credentials.');
  const started = spawnSync('docker', ['compose', '--env-file', '.env.local', '-f', 'docker-compose.local.yml', 'up', '-d', '--wait', 'database'], { stdio: 'inherit' });
  if (started.status !== 0) throw new Error('Unable to start local MariaDB.');
  const connection = await mysql.createConnection({ host: env.DB_HOST, port: Number(env.DB_PORT), user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME, multipleStatements: true });
  try {
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length) {
      console.log('Existing Docker database preserved; import skipped.');
    } else {
      const dump = path.resolve(process.argv[2] || 'n7cosmetics.sql');
      if (!fs.existsSync(dump)) throw new Error('Provide the existing SQL export: pnpm db:local:setup path/to/export.sql');
      await connection.query(fs.readFileSync(dump, 'utf8'));
      console.log('Existing SQL export imported into empty Docker database.');
    }
    // The supplied export has no delivery configuration. Set the existing
    // storefront's UK delivery defaults only when no UK zone exists.
    const [countries] = await connection.query("SELECT zone_id FROM shipping_zone_countries WHERE country_code = 'GB' LIMIT 1");
    if (!countries.length) {
      await connection.beginTransaction();
      try {
        const [zone] = await connection.query("INSERT INTO shipping_zones (name) VALUES ('United Kingdom')");
        await connection.query("INSERT INTO shipping_zone_countries (zone_id, country_code) VALUES (?, 'GB')", [zone.insertId]);
        await connection.query("INSERT INTO shipping_methods (zone_id, name, method_type, price_pence, free_over_pence) VALUES (?, 'Standard delivery', 'FLAT_RATE', 299, 9900)", [zone.insertId]);
        await connection.commit();
        console.log('Added UK delivery: £2.99, free from £99; editable in Admin → Delivery.');
      } catch (error) { await connection.rollback(); throw error; }
    }
    const [rows] = await connection.query('SELECT VERSION() AS version, (SELECT COUNT(*) FROM products) AS products, (SELECT COUNT(*) FROM administrators) AS administrators, (SELECT COUNT(*) FROM orders) AS orders');
    console.log(JSON.stringify(rows[0]));
  } finally { await connection.end(); }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
