import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";

interface AppliedMigrationRow extends RowDataPacket {
  migration_name: string;
}

async function migrate(): Promise<void> {
  const config = getDatabaseConfig();
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    charset: "utf8mb4",
    multipleStatements: true,
    ssl: config.ssl ? {} : undefined,
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_name VARCHAR(190) NOT NULL PRIMARY KEY,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [rows] = await connection.query<AppliedMigrationRow[]>(
      "SELECT migration_name FROM schema_migrations",
    );
    const applied = new Set(rows.map((row) => row.migration_name));
    const migrationsDirectory = path.join(process.cwd(), "database", "migrations");
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const migrationFile of migrationFiles) {
      if (applied.has(migrationFile)) continue;

      const sql = await readFile(path.join(migrationsDirectory, migrationFile), "utf8");
      process.stdout.write(`Applying ${migrationFile}... `);
      await connection.query(sql);
      await connection.execute(
        "INSERT INTO schema_migrations (migration_name) VALUES (?)",
        [migrationFile],
      );
      process.stdout.write("done\n");
    }

    process.stdout.write("Database schema is up to date.\n");
  } finally {
    await connection.end();
  }
}

migrate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
