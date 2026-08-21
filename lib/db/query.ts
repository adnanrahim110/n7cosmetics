import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { getPool } from "./pool";

export type SqlValue = string | number | boolean | Date | Buffer | null;

function databaseClient(connection?: PoolConnection): Pool | PoolConnection {
  return connection ?? getPool();
}

export async function selectRows<T extends RowDataPacket>(
  sql: string,
  values: readonly SqlValue[] = [],
  connection?: PoolConnection,
): Promise<T[]> {
  const [rows] = await databaseClient(connection).execute<T[]>(sql, [...values]);
  return rows;
}

export async function selectOne<T extends RowDataPacket>(
  sql: string,
  values: readonly SqlValue[] = [],
  connection?: PoolConnection,
): Promise<T | null> {
  const rows = await selectRows<T>(sql, values, connection);
  return rows[0] ?? null;
}

export async function executeMutation(
  sql: string,
  values: readonly SqlValue[] = [],
  connection?: PoolConnection,
): Promise<ResultSetHeader> {
  const [result] = await databaseClient(connection).execute<ResultSetHeader>(sql, [...values]);
  return result;
}
