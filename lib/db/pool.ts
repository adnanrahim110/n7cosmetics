import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";
import { getDatabaseConfig } from "../env";

declare global {
  var n7MySqlPool: Pool | undefined;
}

function createPool(): Pool {
  const config = getDatabaseConfig();

  return mysql.createPool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionLimit: config.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    decimalNumbers: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: false,
    charset: "utf8mb4",
    ssl: config.ssl ? {} : undefined,
  });
}

export function getPool(): Pool {
  if (!globalThis.n7MySqlPool) {
    globalThis.n7MySqlPool = createPool();
  }
  return globalThis.n7MySqlPool;
}
