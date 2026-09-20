import "./load-env";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { archiveSource } from "./legacy/archive";
import { applyImport, loadImport } from "./legacy/import-data";
import { mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";

async function main() {
  const config = getDatabaseConfig();
  if (!["localhost", "127.0.0.1", "::1"].includes(config.host)) throw new Error("Run this migration against the local database first.");
  const db = await mysql.createConnection({ ...config, ssl: config.ssl ? {} : undefined, dateStrings: true, timezone: "Z", supportBigNumbers: true, bigNumberStrings: true });
  try {
    const [lock] = await db.query<RowDataPacket[]>("SELECT GET_LOCK('n7_legacy_import', 0) AS acquired");
    if (!Number(lock[0].acquired)) throw new Error("Another legacy import is running.");
    const command = process.argv[2];
    if (command === "archive" && process.argv[3]) await archiveSource(db, process.argv[3]);
    else if (["plan", "apply"].includes(command) && /^[1-9]\d*$/.test(process.argv[3] ?? "")) {
      const batchId = process.argv[3];
      const loaded = await loadImport(db, batchId);
      await mkdir("reports/legacy", { recursive: true });
      await writeFile(`reports/legacy/plan-${batchId}.json`, JSON.stringify(loaded.report, null, 2));
      console.log(JSON.stringify({ orders: loaded.orders.length, refunds: loaded.refunds.length, reviews: loaded.reviews.length, matchedProducts: loaded.matches.filter(row => row.current).length, unmatchedProducts: loaded.matches.filter(row => !row.current).length, unmatchedReviews: loaded.report.unmatchedReviews, sourceOrderTotalPence: loaded.report.sourceOrderTotalPence, sourceRefundTotalPence: loaded.report.sourceRefundTotalPence }));
      if (command === "apply") {
        const backup = path.resolve(process.argv[4] || "reports/legacy/before-legacy-migration.sql.gz");
        if (!(await stat(backup)).size) throw new Error("A pre-migration database backup is required.");
        await db.execute("UPDATE legacy_imports SET backup_path=? WHERE id=?", [backup, batchId]);
        await applyImport(db, batchId, loaded);
      }
    } else throw new Error("Usage: legacy-import archive <source.sql> | plan <batch> | apply <batch> [backup.sql.gz]");
  } finally { await db.query("SELECT RELEASE_LOCK('n7_legacy_import')"); await db.end(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Legacy migration failed."); process.exitCode = 1; });
