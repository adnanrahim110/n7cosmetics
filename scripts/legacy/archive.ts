import { createHash } from "node:crypto";
import { createReadStream, constants } from "node:fs";
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import type { Connection, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { packRecord, parseSqlRows, unpackRecord, type LegacyRow } from "../../lib/legacy/format";

export async function fileHash(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export async function archiveSource(db: Connection, source: string): Promise<string> {
  const checksum = await fileHash(source);
  const [existing] = await db.execute<RowDataPacket[]>("SELECT CAST(id AS CHAR) id, status FROM legacy_imports WHERE source_sha256 = ?", [checksum]);
  if (existing[0] && ["READY", "IMPORTING", "COMPLETE"].includes(existing[0].status)) return existing[0].id as string;
  const directory = path.resolve("reports", "legacy", checksum);
  await mkdir(directory, { recursive: true });
  const archive = path.join(directory, "source.sql");
  try { await copyFile(source, archive, constants.COPYFILE_EXCL); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  if (await fileHash(archive) !== checksum) throw new Error("Archived source checksum does not match.");
  const bytes = (await stat(source)).size;
  const [insert] = await db.execute<ResultSetHeader>("INSERT INTO legacy_imports (source_name, source_sha256, source_bytes, archive_path) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id), status = 'ARCHIVING'", [path.basename(source), checksum, bytes, archive]);
  const importId = String(insert.insertId);
  let table = "", definition = "", defining = false, columns: string[] = [], count = 0, total = 0, bufferedBytes = 0;
  let records: (string | number)[][] = [];
  const flush = async () => {
    if (!records.length) return;
    await db.query("INSERT IGNORE INTO legacy_records (import_id,table_name,source_row_number,source_key,payload_encrypted) VALUES ?", [records]);
    records = []; bufferedBytes = 0;
  };
  const finish = async () => {
    if (!table) return;
    await flush();
    const [stored] = await db.execute<RowDataPacket[]>("SELECT COUNT(*) n FROM legacy_records WHERE import_id = ? AND table_name = ?", [importId, table]);
    if (Number(stored[0].n) !== count) throw new Error(`Archive count mismatch for ${table}.`);
    await db.execute("UPDATE legacy_tables SET columns_json = ?, row_count = ? WHERE import_id = ? AND table_name = ?", [JSON.stringify(columns), count, importId, table]);
    total += count;
    console.log(`Archived ${table}: ${count} rows`);
  };
  let lineNumber = 0;
  try {
    for await (const line of createInterface({ input: createReadStream(archive, { encoding: "utf8" }), crlfDelay: Infinity })) {
      lineNumber++;
      const start = /^CREATE TABLE `([A-Za-z0-9_]+)` \(/.exec(line);
      if (start) { await finish(); table = start[1]; definition = line + "\n"; defining = true; columns = []; count = 0; continue; }
      if (defining) {
        definition += line + "\n";
        const column = /^\s+`([^`]+)`/.exec(line); if (column) columns.push(column[1]);
        if (line.startsWith(")")) {
          defining = false;
          await db.execute("INSERT INTO legacy_tables (import_id, table_name, definition_sql, columns_json) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE definition_sql = VALUES(definition_sql)", [importId, table, definition, JSON.stringify(columns)]);
        }
        continue;
      }
      const insert = /^INSERT INTO `([^`]+)` \((.*?)\) VALUES\s*(.*)$/.exec(line);
      if (insert) {
        if (insert[1] !== table) throw new Error("Unexpected insert table.");
        const insertColumns = [...insert[2].matchAll(/`([^`]+)`/g)].map(m => m[1]);
        if (JSON.stringify(columns) !== JSON.stringify(insertColumns)) throw new Error("Insert columns do not match the source schema.");
        if (!insert[3]) continue;
      }
      const values = insert?.[3] || line;
      if (values.startsWith("(") && table) {
        for (const row of parseSqlRows(values, columns)) {
          const payload = packRecord(row);
          records.push([importId, table, ++count, (row[columns[0]] ?? String(count)).slice(0, 190), payload]);
          bufferedBytes += Buffer.byteLength(payload);
          if (records.length >= 500 || bufferedBytes > 1000000) await flush();
        }
      }
    }
    await finish();
    await db.execute("UPDATE legacy_imports SET status = 'READY', report_json = ? WHERE id = ?", [JSON.stringify({ archivedRows: total, checksum }), importId]);
    console.log(`Archive verified: ${total} rows, batch ${importId}`);
    return importId;
  } catch (error) {
    await db.execute("UPDATE legacy_imports SET status = 'FAILED' WHERE id = ?", [importId]);
    throw new Error(`Source archive failed near line ${lineNumber}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

export async function readSource(db: Connection, importId: string, table: string): Promise<LegacyRow[]> {
  const rows: LegacyRow[] = [];
  let after = 0;
  while (true) {
    const [batch] = await db.execute<RowDataPacket[]>("SELECT source_row_number, payload_encrypted FROM legacy_records WHERE import_id = ? AND table_name = ? AND source_row_number > ? ORDER BY source_row_number LIMIT 1000", [importId, table, after]);
    if (!batch.length) break;
    for (const record of batch) rows.push(unpackRecord(record.payload_encrypted as string));
    after = Number(batch[batch.length - 1].source_row_number);
  }
  return rows;
}
