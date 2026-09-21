import "./load-env";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import mysql, { type Connection, type RowDataPacket } from "mysql2";
import { getDatabaseConfig } from "../lib/env";

interface Fingerprint { columns: string[]; count: number; digest: string }
interface Snapshot { tables: Record<string, Fingerprint>; shipping: RowDataPacket[] | null }
const identifier = (value: string) => `\`${value.replaceAll("`", "``")}\``;
const modulus = 1n << 256n;

async function fingerprint(db: Connection, table: string, columns: string[]): Promise<Fingerprint> {
  let count = 0, sum = 0n;
  const stream = db.query(`SELECT ${columns.map(identifier).join(",")} FROM ${identifier(table)}`).stream();
  for await (const row of stream) {
    sum = (sum + BigInt(`0x${createHash("sha256").update(JSON.stringify(row)).digest("hex")}`)) % modulus;
    count++;
  }
  return { columns, count, digest: sum.toString(16).padStart(64, "0") };
}

export async function snapshotReleaseData(db: Connection): Promise<Snapshot> {
  const [tables] = await db.promise().query<RowDataPacket[]>("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
  const [shippingColumns] = await db.promise().query<RowDataPacket[]>("SHOW COLUMNS FROM shipping_methods");
  const migratingShipping = shippingColumns.some(column => column.Field === "zone_id");
  const snapshot: Snapshot = { tables: {}, shipping: null };
  for (const { name } of tables) {
    if (name === "schema_migrations" || (name === "shipping_methods" && migratingShipping)) continue;
    const [columns] = await db.promise().query<RowDataPacket[]>(`SHOW COLUMNS FROM ${identifier(name)}`);
    snapshot.tables[name] = await fingerprint(db, name, columns.map(column => String(column.Field)));
  }
  if (migratingShipping) [snapshot.shipping] = await db.promise().query<RowDataPacket[]>("SELECT * FROM shipping_methods ORDER BY id");
  return snapshot;
}

export async function verifyReleaseData(db: Connection, snapshot: Snapshot) {
  for (const [table, before] of Object.entries(snapshot.tables)) {
    const after = await fingerprint(db, table, before.columns);
    assert.equal(after.count, before.count, `Row count changed in ${table}`);
    assert.equal(after.digest, before.digest, `Existing values changed in ${table}`);
  }
  if (snapshot.shipping) {
    const [methods] = await db.promise().query<RowDataPacket[]>("SELECT * FROM shipping_methods ORDER BY id");
    const [rates] = await db.promise().query<RowDataPacket[]>("SELECT * FROM shipping_method_rates");
    const [rules] = await db.promise().query<RowDataPacket[]>("SELECT * FROM shipping_rules");
    const [targets] = await db.promise().query<RowDataPacket[]>("SELECT * FROM shipping_rule_methods");
    const sameId = (a: unknown, b: unknown) => String(a) === String(b);
    const oldMethods = snapshot.shipping.filter(method => method.method_type !== "FREE_SHIPPING");
    assert.equal(methods.length, oldMethods.length, "All delivery and pickup methods must survive");
    for (const old of oldMethods) {
      const current = methods.find(method => sameId(method.id, old.id));
      assert(current, "A delivery method was lost");
      for (const field of Object.keys(old).filter(field => !["zone_id", "free_over_pence", "threshold_basis", "method_type", "updated_at"].includes(field))) {
        assert.deepEqual(current[field], old[field], `Shipping field changed: ${field}`);
      }
      assert.equal(current.method_type, old.method_type === "FLAT_RATE" ? "DELIVERY" : "LOCAL_PICKUP");
      assert(rates.some(rate => sameId(rate.method_id, old.id) && sameId(rate.zone_id, old.zone_id) && rate.price_pence === old.price_pence), "A method's zone rate was lost");
    }
    for (const old of snapshot.shipping.filter(method => method.method_type === "FREE_SHIPPING" || (method.method_type === "FLAT_RATE" && method.free_over_pence !== null))) {
      const rule = rules.find(rule => sameId(rule.migration_method_id, old.id));
      assert(rule, "A shipping threshold was lost");
      assert.equal(rule.minimum_subtotal_pence, old.free_over_pence ?? 0);
      assert.equal(rule.threshold_basis, old.threshold_basis);
      assert.equal(rule.is_active, old.is_active);
      assert(sameId(rule.zone_id, old.zone_id));
      const methodId = old.method_type === "FREE_SHIPPING" ? oldMethods.find(method => method.method_type === "FLAT_RATE" && sameId(method.zone_id, old.zone_id))?.id : old.id;
      assert(targets.some(target => sameId(target.rule_id, rule.id) && sameId(target.method_id, methodId)), "A rule's method target changed");
    }
  }
  return { tables: Object.keys(snapshot.tables).length, rows: Object.values(snapshot.tables).reduce((sum, table) => sum + table.count, 0) };
}

async function main() {
  const config = getDatabaseConfig();
  const db = mysql.createConnection({ host: config.host, port: config.port, database: config.database, user: config.user,
    password: config.password, ssl: config.ssl ? {} : undefined, charset: "utf8mb4", dateStrings: true, supportBigNumbers: true, bigNumberStrings: true });
  try {
    const [command, file] = process.argv.slice(2);
    if (command === "pending") {
      const [rows] = await db.promise().query<RowDataPacket[]>("SELECT migration_name FROM schema_migrations");
      const applied = new Set(rows.map(row => row.migration_name));
      console.log((await readdir("database/migrations")).filter(name => name.endsWith(".sql") && !applied.has(name)).length);
    } else if (command === "snapshot" && file) {
      const snapshot = await snapshotReleaseData(db);
      await writeFile(file, JSON.stringify(snapshot), { mode: 0o600, flag: "wx" });
      console.log(`Saved integrity snapshot for ${Object.keys(snapshot.tables).length} existing tables.`);
    } else if (command === "verify" && file) {
      const result = await verifyReleaseData(db, JSON.parse(await readFile(file, "utf8")) as Snapshot);
      console.log(`Preserved ${result.rows} existing rows across ${result.tables} tables; shipping conversion verified.`);
    } else throw new Error("Use release-data pending, snapshot <file>, or verify <file>");
  } finally { await db.promise().end(); }
}
if (require.main === module) main().catch(error => { console.error(error instanceof Error ? error.message : "Release data verification failed"); process.exitCode = 1; });
