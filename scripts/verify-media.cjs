/* Read-only deployment check: fail if an uploaded file is missing or corrupt. */
const fs = require("node:fs/promises");
const path = require("node:path");
const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
  });
  try {
    const [assets] = await connection.query("SELECT storage_key, size_bytes FROM media_assets");
    const root = await fs.realpath(process.env.MEDIA_STORAGE_DIR);
    const failures = [];
    for (const asset of assets) {
      try {
        const file = await fs.realpath(path.resolve(root, asset.storage_key));
        const relative = path.relative(root, file);
        if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("outside media directory");
        const stats = await fs.stat(file);
        if (!stats.isFile() || stats.size !== Number(asset.size_bytes)) throw new Error("size mismatch");
      } catch {
        failures.push(asset.storage_key);
      }
    }
    if (failures.length) throw new Error(`Missing or invalid media: ${failures.join(", ")}`);
    console.log(`Verified ${assets.length} database media assets against storage.`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
