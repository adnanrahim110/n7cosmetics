import "./load-env";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import mysql, { type Connection, type RowDataPacket } from "mysql2";
import { getDatabaseConfig } from "../lib/env";

interface Fingerprint { columns: string[]; count: number; digest: string }
interface Snapshot {
  tables: Record<string, Fingerprint>;
  shipping: RowDataPacket[] | null;
  orderProductCodeCleanup?: Fingerprint;
  googleMerchantReview?: { lastAuditId: string };
}
interface FingerprintOptions { excludeSettings?: readonly string[]; cleanProductCodes?: boolean; maximumId?: string }
const productCodeMigration = "030_remove_order_product_code_fallbacks.sql";
const googleMerchantReviewMigration = "038_google_merchant_reviewed_catalog.sql";
const identifier = (value: string) => `\`${value.replaceAll("`", "``")}\``;
const modulus = 1n << 256n;

export async function fingerprintReleaseTable(db: Connection, table: string, columns: string[], options: FingerprintOptions = {}): Promise<Fingerprint> {
  let count = 0, sum = 0n;
  const { cleanProductCodes = false, excludeSettings = [], maximumId } = options;
  // Project precisely migration 030's expected values before changing any data.
  // All other columns and rows remain part of the same fingerprint.
  const selection = cleanProductCodes ? columns.map(column => column === "product_code"
    ? `CASE WHEN NULLIF(TRIM(oi.product_code), '') = NULLIF(TRIM(oi.sku), '')
        AND NOT (NULLIF(TRIM(oi.product_code), '') <=> NULLIF(TRIM(p.product_code), ''))
      THEN NULLIF(TRIM(p.product_code), '') ELSE oi.product_code END AS product_code`
    : `oi.${identifier(column)}`).join(",") : columns.map(identifier).join(",");
  const conditions: string[] = [], values: string[] = [];
  if (excludeSettings.length) {
    conditions.push(`setting_key NOT IN (${excludeSettings.map(() => "?").join(",")})`);
    values.push(...excludeSettings);
  }
  if (maximumId !== undefined) { conditions.push("id <= ?"); values.push(maximumId); }
  const stream = db.query(
    `SELECT ${selection} FROM ${identifier(table)}${cleanProductCodes ? " oi LEFT JOIN products p ON p.id = oi.product_id" : ""}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""}`,
    values,
  ).stream();
  for await (const row of stream) {
    sum = (sum + BigInt(`0x${createHash("sha256").update(JSON.stringify(row)).digest("hex")}`)) % modulus;
    count++;
  }
  return { columns, count, digest: sum.toString(16).padStart(64, "0") };
}

async function migrationApplied(db: Connection, name: string): Promise<boolean> {
  const [rows] = await db.promise().query<RowDataPacket[]>("SELECT migration_name FROM schema_migrations WHERE migration_name = ?", [name]);
  return rows.length > 0;
}

export async function snapshotReleaseData(db: Connection): Promise<Snapshot> {
  const [tables] = await db.promise().query<RowDataPacket[]>("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
  const [shippingColumns] = await db.promise().query<RowDataPacket[]>("SHOW COLUMNS FROM shipping_methods");
  const migratingShipping = shippingColumns.some(column => column.Field === "zone_id");
  const snapshot: Snapshot = { tables: {}, shipping: null };
  for (const { name } of tables) {
    if (name === "schema_migrations" || name === "product_reviews" || (name === "shipping_methods" && migratingShipping)) continue;
    const [columns] = await db.promise().query<RowDataPacket[]>(`SHOW COLUMNS FROM ${identifier(name)}`);
    snapshot.tables[name] = await fingerprintReleaseTable(db, name, columns.map(column => String(column.Field)));
    if (name === "order_items" && snapshot.tables[name].columns.includes("product_code") && !await migrationApplied(db, productCodeMigration)) {
      snapshot.orderProductCodeCleanup = await fingerprintReleaseTable(db, name, snapshot.tables[name].columns, { cleanProductCodes: true });
    }
    if (name === "audit_logs" && !await migrationApplied(db, googleMerchantReviewMigration)) {
      const [rows] = await db.promise().query<RowDataPacket[]>("SELECT COALESCE(MAX(id), 0) AS last_id FROM audit_logs");
      snapshot.googleMerchantReview = { lastAuditId: String(rows[0].last_id) };
    }
  }
  if (migratingShipping) [snapshot.shipping] = await db.promise().query<RowDataPacket[]>("SELECT * FROM shipping_methods ORDER BY id");
  return snapshot;
}

export async function verifyReleaseData(db: Connection, snapshot: Snapshot) {
  for (const [table, before] of Object.entries(snapshot.tables)) {
    let after = await fingerprintReleaseTable(db, table, before.columns);
    let expected = before;
    if (table === "order_items" && snapshot.orderProductCodeCleanup && await migrationApplied(db, productCodeMigration)) {
      assert.deepEqual(snapshot.orderProductCodeCleanup.columns, before.columns, "Order cleanup columns changed");
      assert.equal(snapshot.orderProductCodeCleanup.count, before.count, "Order cleanup row count changed");
      expected = snapshot.orderProductCodeCleanup;
    }
    if (table === "audit_logs" && snapshot.googleMerchantReview && await migrationApplied(db, googleMerchantReviewMigration)) {
      // Migration 038 appends exactly one system review entry. Fingerprint every
      // original row, and validate the new entry rather than exempting audit logs.
      assert.equal(after.count, before.count + 1, "Row count changed in audit_logs");
      const [rows] = await db.promise().query<RowDataPacket[]>(
        "SELECT administrator_id, action, entity_type, entity_id, summary, metadata_json, ip_address FROM audit_logs WHERE id > ?",
        [snapshot.googleMerchantReview.lastAuditId],
      );
      assert.equal(rows.length, 1, "Row count changed in audit_logs");
      const { metadata_json, ...entry } = rows[0];
      assert.deepEqual(entry, {
        administrator_id: null, action: "GOOGLE_MERCHANT_REVIEW", entity_type: "catalogue", entity_id: null,
        summary: "Applied owner-confirmed identifier policy and reviewed gift-set classifications", ip_address: null,
      }, "Existing values changed in audit_logs: invalid Google Merchant review entry");
      const metadata: unknown = typeof metadata_json === "string" ? JSON.parse(metadata_json) : metadata_json;
      assert.ok(metadata && typeof metadata === "object" && "applied_rows" in metadata &&
        typeof metadata.applied_rows === "number" && Number.isSafeInteger(metadata.applied_rows) && metadata.applied_rows >= 0,
      "Existing values changed in audit_logs: invalid Google Merchant review count");
      assert.deepEqual(metadata, {
        confirmed_at: "2026-10-20", applied_rows: metadata.applied_rows,
        scope: "28 reviewed standard products and 6 exact gift-set recipes",
      }, "Existing values changed in audit_logs: invalid Google Merchant review metadata");
      after = await fingerprintReleaseTable(db, table, before.columns, { maximumId: snapshot.googleMerchantReview.lastAuditId });
    }
    const defaults = [{ key: "meta.configuration", group: "meta" }, { key: "tiktok.configuration", group: "tiktok" }];
    const addedCount = after.count - before.count;
    if (table === "site_settings" && addedCount > 0 && addedCount <= defaults.length) {
      // Migrations 028/035 may add only these exact empty, private defaults.
      // An exclusion is accepted ONLY if it reproduces the complete original
      // fingerprint. Existing defaults and unrelated settings remain protected.
      const candidates: string[] = [];
      for (const setting of defaults) {
        const [rows] = await db.promise().query<RowDataPacket[]>("SELECT setting_group, value_json, is_public, updated_by FROM site_settings WHERE setting_key = ?", [setting.key]);
        const added = rows[0];
        if (added?.setting_group === setting.group && added.is_public === 0 && added.updated_by === null && JSON.stringify(typeof added.value_json === "string" ? JSON.parse(added.value_json) : added.value_json) === "{}") candidates.push(setting.key);
      }
      for (let mask = 1; mask < 2 ** candidates.length; mask++) {
        const excluded = candidates.filter((_key, index) => mask & (1 << index));
        if (excluded.length !== addedCount) continue;
        const candidate = await fingerprintReleaseTable(db, table, before.columns, { excludeSettings: excluded });
        if (candidate.count === before.count && candidate.digest === before.digest) { after = candidate; break; }
      }
    }
    assert.equal(after.count, before.count, `Row count changed in ${table}`);
    assert.equal(after.digest, expected.digest, `Existing values changed in ${table}`);
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
