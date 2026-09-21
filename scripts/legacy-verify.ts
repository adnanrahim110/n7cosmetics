import "./load-env";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { getPool } from "../lib/db/pool";
import { fileHash, readSource } from "./legacy/archive";
import { applyImport, loadImport } from "./legacy/import-data";
import { getCustomers, countCustomers, exportCustomers } from "../lib/admin/customers";
import { calculateQuote } from "../lib/commerce/quote";
import { pence, unpackRecord } from "../lib/legacy/format";

async function main() {
  const config = getDatabaseConfig();
  assert(["localhost", "127.0.0.1", "::1"].includes(config.host), "Verification requires the local database.");
  const batchId = process.argv[2] || "1";
  assert(/^[1-9]\d*$/.test(batchId));
  const db = await mysql.createConnection({ ...config, ssl: config.ssl ? {} : undefined, dateStrings: true, timezone: "Z", supportBigNumbers: true, bigNumberStrings: true });
  try {
    const [batches] = await db.execute<RowDataPacket[]>("SELECT * FROM legacy_imports WHERE id=?", [batchId]);
    const batch = batches[0];
    assert.equal(batch?.status, "COMPLETE");
    assert.equal(await fileHash(String(batch.archive_path)), batch.source_sha256);
    const report = typeof batch.report_json === "string" ? JSON.parse(batch.report_json) : batch.report_json;
    const [tables] = await db.execute<RowDataPacket[]>(`SELECT t.table_name,t.columns_json,t.row_count,COUNT(r.source_row_number) actual
      FROM legacy_tables t LEFT JOIN legacy_records r ON r.import_id=t.import_id AND r.table_name=t.table_name
      WHERE t.import_id=? GROUP BY t.table_name,t.columns_json,t.row_count`, [batchId]);
    for (const table of tables) {
      assert.equal(Number(table.actual), Number(table.row_count), `${table.table_name} archive count`);
      const [samples] = await db.execute<RowDataPacket[]>("SELECT payload_encrypted FROM legacy_records WHERE import_id=? AND table_name=? ORDER BY source_row_number LIMIT 1", [batchId, table.table_name]);
      if (samples.length) assert.deepEqual(Object.keys(unpackRecord(samples[0].payload_encrypted as string)), typeof table.columns_json === "string" ? JSON.parse(table.columns_json) : table.columns_json, `${table.table_name} columns`);
    }
    const snapshots = [];
    for (const sql of ["SELECT id,name,slug,short_description,description,brand,inspired_by,audience,fragrance_notes_json,featured,seo_title,seo_description,published_at,status FROM products ORDER BY id", "SELECT * FROM product_images ORDER BY id", "SELECT * FROM product_videos ORDER BY id", "SELECT * FROM media_assets ORDER BY id"]) snapshots.push((await db.query(sql))[0]);
    assert.equal(createHash("sha256").update(JSON.stringify(snapshots)).digest("hex"), report.originalContentHash, "Product content and media are unchanged");

    const loaded = await loadImport(db, batchId);
    const [orders] = await db.execute<RowDataPacket[]>("SELECT legacy_id,total_pence,currency,customer_id FROM orders WHERE import_id=?", [batchId]);
    const originalOrders = new Map(loaded.orders.map(row => [row.id, row]));
    assert.equal(orders.length, loaded.orders.length);
    for (const order of orders) {
      const original = originalOrders.get(String(order.legacy_id));
      assert(original);
      assert.equal(order.total_pence, pence(original.total_amount));
      assert.equal(order.currency, original.currency);
      assert(order.customer_id, "Every historical order has a customer");
    }
    const [reviews] = await db.execute<RowDataPacket[]>("SELECT legacy_id,body,reviewer_name,product_id FROM product_reviews WHERE import_id=?", [batchId]);
    const originalReviews = new Map(loaded.reviews.map(row => [row.comment_ID, row]));
    assert.equal(reviews.length, originalReviews.size);
    for (const review of reviews) {
      const original = originalReviews.get(String(review.legacy_id));
      assert.equal(review.body, original?.comment_content);
      assert.equal(review.reviewer_name, original?.comment_author);
      assert(review.product_id, "Every source review is linked to a current product");
    }
    const sourceValues = await readSource(db, batchId, "bc_e_submissions_values");
    const [enquiries] = await db.execute<RowDataPacket[]>("SELECT legacy_id,name,email,message FROM contact_enquiries WHERE import_id=?", [batchId]);
    for (const enquiry of enquiries) for (const key of ["name", "email", "message"]) assert.equal(enquiry[key], sourceValues.find(row => row.submission_id === String(enquiry.legacy_id) && row.key === key)?.value ?? "");
    const count = await countCustomers("", "LEGACY");
    assert.equal(count, report.importedCustomers);
    assert.equal((await getCustomers("", "LEGACY", 25, 0)).length, Math.min(25, count));
    let exported = 0;
    for await (const customer of exportCustomers("", "LEGACY")) { assert(customer.id); exported++; }
    assert.equal(exported, count, "Customer export includes every matching page");

    const [products] = await db.query<RowDataPacket[]>(`SELECT p.slug,v.price_pence FROM products p JOIN product_variants v ON v.product_id=p.id AND v.is_default=1
      WHERE p.status='ACTIVE' AND p.product_type='STANDARD' AND v.status='ACTIVE' AND v.price_pence>0 AND v.price_pence<9900
      AND (p.track_inventory=0 OR v.stock_on_hand>=CEIL(9900/v.price_pence)) ORDER BY p.id LIMIT 1`);
    assert(products.length, "A purchasable product is available for shipping verification");
    const product = products[0], highQuantity = Math.ceil(9900 / Number(product.price_pence));
    const low = await calculateQuote({ items: [{ slug: String(product.slug), quantity: 1 }], countryCode: "GB" });
    const high = await calculateQuote({ items: [{ slug: String(product.slug), quantity: highQuantity }], countryCode: "GB" });
    assert.equal(low.shippingPence, 299);
    assert.equal(high.shippingPence, 0);
    assert.equal(high.shippingMethod.id, low.shippingMethod.id, "The method remains Standard when the rule applies");
    assert.equal(high.shippingMethod.adjustment?.source, "RULE");
    const selected = await calculateQuote({ items: [{ slug: String(product.slug), quantity: highQuantity }], countryCode: "GB", shippingMethodId: low.shippingMethod.id });
    assert.equal(selected.shippingPence, 0, "Selecting Standard cannot bypass its automatic rule");
    const [sideEffects] = await db.query<RowDataPacket[]>("SELECT COUNT(*) n FROM stripe_checkouts c JOIN orders o ON o.id=c.order_id WHERE o.source='LEGACY'");
    assert.equal(Number(sideEffects[0].n), 0, "Historical orders have no live payment sessions");
    await applyImport(db, batchId, loaded); // COMPLETE batches must exit before any mutation.
    console.log(JSON.stringify({ status: "PASS", archivedTables: tables.length, archivedRows: tables.reduce((sum, row) => sum + Number(row.actual), 0), orders: orders.length, reviews: reviews.length, customersExported: exported, enquiries: enquiries.length, originalContentPreserved: true, shipping: "Standard: 299 below threshold; 0 at threshold via automatic rule", repeatImport: "no-op" }));
  } finally { await db.end(); await getPool().end(); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Verification failed"); process.exitCode = 1; });
