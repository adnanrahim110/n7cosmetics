import "./load-env";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import mysql from "mysql2";
import { getDatabaseConfig } from "../lib/env";
import { snapshotReleaseData, verifyReleaseData } from "./release-data";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(config.host), "Checks require a local database");
  const database = `n7_release_test_${Date.now()}`;
  assert.match(database, /^n7_release_test_\d+$/);
  const db = mysql.createConnection({ host: config.host, port: config.port,
    user: process.env.DB_ROOT_PASSWORD ? "root" : config.user,
    password: process.env.DB_ROOT_PASSWORD || config.password, multipleStatements: true,
    dateStrings: true, supportBigNumbers: true, bigNumberStrings: true });
  const setup = db.promise();
  let created = false, checks = 0;
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await setup.changeUser({ database });
    await setup.query("CREATE TABLE schema_migrations (migration_name VARCHAR(190) PRIMARY KEY)");
    const migrations = (await readdir("database/migrations")).filter(name => name.endsWith(".sql")).sort();
    const applyMigration = async (name: string) => {
      await setup.query(await readFile(`database/migrations/${name}`, "utf8"));
      await setup.query("INSERT INTO schema_migrations (migration_name) VALUES (?)", [name]);
    };
    for (const name of migrations.filter(name => name < "028")) {
      await applyMigration(name);
    }
    await setup.query("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('release.fixture', 'test', '{\"preserve\":true}')");
    await setup.query("INSERT INTO products (name, slug, status) VALUES ('Preserved product', 'release-fixture', 'ACTIVE')");
    // Exercise the same JSON snapshot format retained by failed production deploys.
    const before = JSON.parse(JSON.stringify(await snapshotReleaseData(db)));
    await verifyReleaseData(db, before); checks++;
    for (const name of migrations.filter(name => name >= "028" && name < "030")) {
      await applyMigration(name);
    }
    await verifyReleaseData(db, before); checks++;

    const rejectsChange = async (sql: string, baseline = before) => {
      await setup.beginTransaction();
      try {
        await setup.query(sql);
        await assert.rejects(verifyReleaseData(db, baseline), /Row count changed|Existing values changed/);
        checks++;
      } finally { await setup.rollback(); }
    };
    await rejectsChange("UPDATE site_settings SET value_json = '{}' WHERE setting_key = 'release.fixture'");
    await rejectsChange("DELETE FROM site_settings WHERE setting_key = 'release.fixture'");
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unexpected', 'test', '{}')");
    await rejectsChange("UPDATE site_settings SET value_json = '{\"enabled\":true}' WHERE setting_key = 'meta.configuration'");
    await rejectsChange("UPDATE site_settings SET is_public = 1 WHERE setting_key = 'meta.configuration'");
    await rejectsChange("UPDATE site_settings SET setting_group = 'wrong' WHERE setting_key = 'meta.configuration'");
    await rejectsChange("UPDATE products SET name = 'Changed product' WHERE slug = 'release-fixture'");
    const withDefaultMeta = await snapshotReleaseData(db);
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unexpected', 'test', '{}')", withDefaultMeta);
    await setup.query("UPDATE site_settings SET value_json = '{\"enabled\":true}' WHERE setting_key = 'meta.configuration'");
    const withMeta = await snapshotReleaseData(db);
    await verifyReleaseData(db, withMeta); checks++;
    await rejectsChange("UPDATE site_settings SET value_json = '{}' WHERE setting_key = 'meta.configuration'", withMeta);
    await rejectsChange("DELETE FROM site_settings WHERE setting_key = 'meta.configuration'", withMeta);
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unexpected', 'test', '{}')", withMeta);
    await setup.query("INSERT INTO products (name, slug, status, product_code) VALUES ('Coded product', 'release-coded-fixture', 'ACTIVE', '253')");
    await setup.query(`INSERT INTO orders (order_number, customer_name, customer_email, subtotal_pence, total_pence)
      VALUES ('RELEASE-FIXTURE', 'Release fixture', 'release@example.invalid', 13600, 13600)`);
    await setup.query(`INSERT INTO order_items (order_id, product_id, product_name, variant_title, sku, product_code, unit_price_pence, quantity, line_total_pence)
      SELECT o.id, p.id, p.name, '100 ml', 'N7-P-PLAIN', 'N7-P-PLAIN', 3400, 1, 3400 FROM orders o JOIN products p ON p.slug = 'release-fixture' WHERE o.order_number = 'RELEASE-FIXTURE'`);
    await setup.query(`INSERT INTO order_items (order_id, product_id, product_name, variant_title, sku, product_code, unit_price_pence, quantity, line_total_pence)
      SELECT o.id, p.id, p.name, '100 ml', '253', '253', 3400, 1, 3400 FROM orders o JOIN products p ON p.slug = 'release-coded-fixture' WHERE o.order_number = 'RELEASE-FIXTURE'`);
    await setup.query(`INSERT INTO order_items (order_id, product_id, product_name, variant_title, sku, product_code, unit_price_pence, quantity, line_total_pence)
      SELECT o.id, p.id, p.name, '100 ml', 'N7-P-OLD', 'OLD-CODE', 3400, 1, 3400 FROM orders o JOIN products p ON p.slug = 'release-coded-fixture' WHERE o.order_number = 'RELEASE-FIXTURE'`);
    await setup.query(`INSERT INTO order_items (order_id, product_name, variant_title, sku, product_code, unit_price_pence, quantity, line_total_pence)
      SELECT id, 'Deleted product', '100 ml', 'N7-P-DELETED', 'N7-P-DELETED', 3400, 1, 3400 FROM orders WHERE order_number = 'RELEASE-FIXTURE'`);
    await setup.query("INSERT INTO meta_consents (id,granted,expires_at) VALUES ('12345678-1234-1234-1234-123456789abc',1,DATE_ADD(CURRENT_TIMESTAMP(3),INTERVAL 1 DAY))");
    await setup.query("INSERT INTO meta_event_jobs (pixel_id,event_id,event_name,event_time,status) VALUES ('123456789','preserved-event','PageView',CURRENT_TIMESTAMP(3),'SENT')");
    // A historical entry with the same action must remain fully protected.
    await setup.query(`INSERT INTO audit_logs (action, entity_type, summary, metadata_json)
      VALUES ('GOOGLE_MERCHANT_REVIEW', 'catalogue', 'Preserved earlier review', '{"preserve":true}')`);
    await setup.query("INSERT INTO products (id, name, slug, status) VALUES (93, 'Reviewed original', 'anemoia', 'ACTIVE')");
    await setup.query("INSERT INTO product_variants (product_id, title, sku, price_pence, is_default) VALUES (93, '100 ml', 'reviewed-release-fixture', 3300, 1)");
    const [releaseOrders] = await setup.query<mysql.RowDataPacket[]>("SELECT CAST(id AS CHAR) AS id FROM orders WHERE order_number = 'RELEASE-FIXTURE'");
    const releaseOrderId = String(releaseOrders[0].id);
    const emailFixture = async (dedupeKey: string, template: string) => {
      const [result] = await setup.query<mysql.ResultSetHeader>(`INSERT INTO email_jobs
        (dedupe_key, recipient, subject, template_key, payload_encrypted, status, created_at, updated_at, sent_at)
        VALUES (?, 'release@example.invalid', 'Preserved order email', ?, 'preserved-encrypted-payload', 'SENT', '2020-01-01 00:00:00.000', '2020-01-02 00:00:00.000', '2020-01-02 00:00:00.000')`, [dedupeKey, template]);
      return String(result.insertId);
    };
    const customerEmailId = await emailFixture(`order:${releaseOrderId}:confirmation:customer`, "order-confirmation");
    const teamEmailId = await emailFixture(`notification:new_order:order:${releaseOrderId}:confirmation:team`, "new-order-team");
    const resendEmailId = await emailFixture(`resend:${customerEmailId}:original-copy`, "order-confirmation");
    const unrelatedEmailId = await emailFixture("release:unrelated", "smtp-test");
    const beforeCleanup = JSON.parse(JSON.stringify(await snapshotReleaseData(db)));
    assert.ok(beforeCleanup.orderProductCodeCleanup);
    assert.ok(beforeCleanup.googleMerchantReview);
    await verifyReleaseData(db, beforeCleanup); checks++;
    await rejectsChange("UPDATE order_items SET product_code = NULL WHERE sku = 'N7-P-PLAIN'", beforeCleanup);
    for (const name of migrations.filter(name => name >= "030")) {
      if (name.startsWith("032")) {
        const beforeMatching = await snapshotReleaseData(db);
        await applyMigration(name);
        await verifyReleaseData(db, beforeMatching); checks++;
        const [rows] = await setup.query<mysql.RowDataPacket[]>("SELECT matching_fields_json FROM meta_event_jobs WHERE event_id = 'preserved-event'");
        assert.equal(rows[0].matching_fields_json, null); checks++;
      } else if (name.startsWith("034")) {
        await setup.query("INSERT INTO meta_catalog_state (catalog_id,catalog_name) VALUES ('123456789','Preserved catalogue')");
        await setup.query(`INSERT INTO meta_catalog_items (catalog_id,retailer_id,product_name,operation,desired_payload,desired_hash,sent_hash,status)
          VALUES ('123456789','n7_variant_1','Preserved catalogue item','UPSERT','{}',REPEAT('a',64),REPEAT('a',64),'SYNCED')`);
        const beforeObservations = JSON.parse(JSON.stringify(await snapshotReleaseData(db)));
        await applyMigration(name);
        await verifyReleaseData(db, beforeObservations); checks++;
        const [rows] = await setup.query<mysql.RowDataPacket[]>("SELECT status,meta_observation,meta_observed_hash,meta_checked_at FROM meta_catalog_items WHERE retailer_id = 'n7_variant_1'");
        assert.deepEqual(rows.map(row => [row.status, row.meta_observation, row.meta_observed_hash, row.meta_checked_at]), [["SYNCED", null, null, null]]); checks++;
      } else if (name.startsWith("039")) {
        const beforeEmailContext = await snapshotReleaseData(db);
        await applyMigration(name);
        await verifyReleaseData(db, beforeEmailContext); checks++;
        const [emails] = await setup.query<mysql.RowDataPacket[]>("SELECT CAST(id AS CHAR) AS id, CAST(order_id AS CHAR) AS order_id, order_email_kind, updated_at FROM email_jobs ORDER BY id");
        assert.deepEqual(emails.filter(row => [customerEmailId, teamEmailId, resendEmailId].includes(row.id)).map(row => [row.order_id, row.order_email_kind]), [[releaseOrderId, "confirmation"], [releaseOrderId, "team"], [releaseOrderId, "confirmation"]]); checks++;
        assert.equal(emails.find(row => row.id === unrelatedEmailId)?.order_id, null); checks++;
        assert.ok(emails.every(row => row.updated_at === "2020-01-02 00:00:00.000")); checks++;
      } else await applyMigration(name);
    }
    await verifyReleaseData(db, beforeCleanup); checks++;
    const [reviewRows] = await setup.query<mysql.RowDataPacket[]>("SELECT JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.applied_rows')) AS applied_rows FROM audit_logs WHERE summary <> 'Preserved earlier review'");
    assert.equal(Number(reviewRows[0].applied_rows), 1); checks++;
    const reviewAction = "action = 'GOOGLE_MERCHANT_REVIEW' AND summary <> 'Preserved earlier review'";
    await rejectsChange("UPDATE audit_logs SET summary = 'Changed historical entry' WHERE summary = 'Preserved earlier review'", beforeCleanup);
    await rejectsChange("DELETE FROM audit_logs WHERE summary = 'Preserved earlier review'", beforeCleanup);
    await rejectsChange("INSERT INTO audit_logs (action, entity_type, summary) VALUES ('UNEXPECTED', 'catalogue', 'Unexpected addition')", beforeCleanup);
    await rejectsChange(`DELETE FROM audit_logs WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange(`UPDATE audit_logs SET action = 'UNEXPECTED' WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange(`UPDATE audit_logs SET entity_id = 'unexpected' WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange(`UPDATE audit_logs SET metadata_json = JSON_SET(metadata_json, '$.confirmed_at', '2000-01-01') WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange(`UPDATE audit_logs SET metadata_json = JSON_SET(metadata_json, '$.scope', 'unexpected') WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange(`UPDATE audit_logs SET metadata_json = JSON_SET(metadata_json, '$.applied_rows', -1) WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange(`UPDATE audit_logs SET metadata_json = JSON_SET(metadata_json, '$.applied_rows', '0') WHERE ${reviewAction}`, beforeCleanup);
    await rejectsChange("DELETE FROM schema_migrations WHERE migration_name = '038_google_merchant_reviewed_catalog.sql'", beforeCleanup);
    const legacyAuditSnapshot = { ...beforeCleanup, googleMerchantReview: undefined };
    await assert.rejects(verifyReleaseData(db, legacyAuditSnapshot), /Row count changed in audit_logs/); checks++;
    await rejectsChange("UPDATE site_settings SET value_json = '{\"enabled\":true}' WHERE setting_key = 'tiktok.configuration'", beforeCleanup);
    await rejectsChange("UPDATE site_settings SET is_public = 1 WHERE setting_key = 'tiktok.configuration'", beforeCleanup);
    await rejectsChange("UPDATE site_settings SET setting_group = 'wrong' WHERE setting_key = 'tiktok.configuration'", beforeCleanup);
    await rejectsChange("INSERT INTO site_settings (setting_key, setting_group, value_json) VALUES ('unrelated.tiktok', 'tiktok', '{}')", beforeCleanup);
    const [codes] = await setup.query<mysql.RowDataPacket[]>("SELECT product_code FROM order_items ORDER BY id");
    assert.deepEqual(codes.map(row => row.product_code), [null, '253', 'OLD-CODE', null]); checks++;
    // Old snapshots must still fail closed rather than silently exempt order items.
    const legacySnapshot = { ...beforeCleanup, orderProductCodeCleanup: undefined };
    await assert.rejects(verifyReleaseData(db, legacySnapshot), /Existing values changed in order_items/); checks++;
    await rejectsChange("UPDATE order_items SET product_name = 'Unexpected change' WHERE sku = 'N7-P-PLAIN'", beforeCleanup);
    await rejectsChange("UPDATE order_items SET quantity = 2 WHERE sku = '253'", beforeCleanup);
    await rejectsChange("UPDATE order_items SET unit_price_pence = 1 WHERE sku = '253'", beforeCleanup);
    await rejectsChange("UPDATE order_items SET product_code = 'WRONG' WHERE sku = '253'", beforeCleanup);
    await rejectsChange("UPDATE order_items SET product_code = 'WRONG' WHERE sku = 'N7-P-PLAIN'", beforeCleanup);
    await rejectsChange("DELETE FROM order_items WHERE sku = 'N7-P-DELETED'", beforeCleanup);
    const afterCleanup = await snapshotReleaseData(db);
    assert.equal(afterCleanup.orderProductCodeCleanup, undefined);
    assert.equal(afterCleanup.googleMerchantReview, undefined);
    await verifyReleaseData(db, afterCleanup); checks++;
    await rejectsChange(`UPDATE audit_logs SET summary = 'Changed completed review' WHERE ${reviewAction}`, afterCleanup);
    await rejectsChange("INSERT INTO audit_logs (action, entity_type, summary) VALUES ('GOOGLE_MERCHANT_REVIEW', 'catalogue', 'Unexpected repeat')", afterCleanup);
    await rejectsChange("DELETE FROM site_settings WHERE setting_key = 'tiktok.configuration'", afterCleanup);
    await rejectsChange("UPDATE site_settings SET value_json = '{\"pixelEnabled\":false}' WHERE setting_key = 'tiktok.configuration'", afterCleanup);
    await rejectsChange("UPDATE order_items SET product_code = NULL WHERE sku = '253'", afterCleanup);
    // A fresh database has no historical audit rows, as in the CI service.
    await setup.query("DELETE FROM audit_logs");
    await setup.query("DELETE FROM schema_migrations WHERE migration_name = '038_google_merchant_reviewed_catalog.sql'");
    const emptyAuditSnapshot = JSON.parse(JSON.stringify(await snapshotReleaseData(db)));
    assert.equal(emptyAuditSnapshot.googleMerchantReview.lastAuditId, "0");
    await applyMigration("038_google_merchant_reviewed_catalog.sql");
    await verifyReleaseData(db, emptyAuditSnapshot); checks++;
    console.log(`${checks} release integrity checks passed; all migrations verified, including product-code cleanup and the exact Google Merchant review audit entry.`);
  } finally {
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
void run().catch(error => { console.error(error instanceof Error ? error.message : "Release integrity checks failed"); process.exitCode = 1; });
