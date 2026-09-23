import "./load-env";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne, selectRows } from "../lib/db/query";
import { saveOrderUpdate } from "../lib/admin/order-updates";
import { orderStatuses, royalMailTrackingUrl } from "../lib/admin/order-status";
import { decryptSecret } from "../lib/security/encryption";

async function run() {
  const config = getDatabaseConfig();
  if (!["localhost", "127.0.0.1", "::1"].includes(config.host)) throw new Error("Order tracking checks require a local database server.");
  const database = `n7_order_tracking_test_${Date.now()}`;
  assert.match(database, /^n7_order_tracking_test_[0-9]+$/);
  const options = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password, ssl: config.ssl ? {} : undefined };
  const setup = await mysql.createConnection({ ...options, multipleStatements: true });
  let created = false;
  let checks = 0;
  const check = (value: unknown, description: string) => { assert.ok(value, description); checks++; };
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await setup.changeUser({ database });
    for (const migration of (await readdir("database/migrations")).filter((file) => file.endsWith(".sql")).sort()) await setup.query(await readFile(path.join("database/migrations", migration), "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({ ...options, database, connectionLimit: 5, supportBigNumbers: true, bigNumberStrings: true });
    const admin = await executeMutation("INSERT INTO administrators (name, email, password_hash, role) VALUES ('Test admin', 'admin@example.com', 'test-only', 'OWNER')");
    const owner = { id: String(admin.insertId), role: "OWNER" as const };
    const fulfillment = { ...owner, role: "FULFILLMENT" as const };
    const inserted = await executeMutation("INSERT INTO orders (order_number, status, payment_status, payment_provider, customer_email, customer_name, subtotal_pence, total_pence, shipping_method_name, admin_notes) VALUES ('N7-TRACK-TEST', 'PROCESSING', 'PAID', 'STRIPE', 'customer@example.com', 'Alex Morgan', 5000, 5000, 'Checkout standard delivery', 'Private packing note')");
    const id = String(inserted.insertId);
    await executeMutation("INSERT INTO order_items (order_id, product_name, variant_title, sku, image_url, unit_price_pence, quantity, line_total_pence) VALUES (?, 'Test fragrance', '100 ml', 'TRACK-TEST', '/imgs/products/1.png', 5000, 1, 5000)", [id]);
    await executeMutation("INSERT INTO order_addresses (order_id, address_type, full_name, line_1, city, postal_code, country_code) VALUES (?, 'SHIPPING', 'Alex Morgan', '12 Sample Street', 'London', 'SW1A 1AA', 'GB')", [id]);
    const state = () => selectOne<RowDataPacket>("SELECT * FROM orders WHERE id = ?", [id]);
    const jobs = () => selectRows<RowDataPacket>("SELECT * FROM email_jobs WHERE recipient = 'customer@example.com' ORDER BY id");
    const history = () => selectRows<RowDataPacket>("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id", [id]);
    const save = (input: unknown) => saveOrderUpdate(id, input, owner, null);
    const tracking = { kind: "tracking", postageService: " Tracked 48 ", trackingReference: " vu628 745615gb " };

    for (const input of [{ kind: "status", status: "SHIPPED" }, { ...tracking, postageService: "" }, { ...tracking, trackingReference: "" }, { ...tracking, trackingReference: "<script>" }, { ...tracking, postageService: "Tracked\n48" }, { kind: "status", status: "UNKNOWN" }]) check(!(await save(input)).success, "Invalid or missing tracking/status must be rejected");
    check((await state())?.status === "PROCESSING" && (await jobs()).length === 0 && (await history()).length === 0, "Rejected changes leave the order, emails and history untouched");
    check(!(await saveOrderUpdate(id, { kind: "status", status: "CANCELLED" }, fulfillment, null)).success, "Fulfilment staff cannot cancel orders");
    check(!(await saveOrderUpdate(id, { kind: "status", status: "REFUNDED" }, fulfillment, null)).success, "Fulfilment staff cannot refund orders");
    check(!(await saveOrderUpdate("invalid", tracking, owner, null)).success, "Invalid IDs are rejected");
    check(!(await saveOrderUpdate("999999999", tracking, owner, null)).success, "Missing orders are rejected");

    const concurrent = await Promise.all([save(tracking), save(tracking)]);
    check(concurrent.every((result) => result.success) && concurrent.filter((result) => result.success && result.changed).length === 1, "Concurrent duplicate saves make one change");
    const shipped = await state();
    check(shipped?.status === "SHIPPED" && shipped.fulfillment_status === "FULFILLED", "Tracking automatically ships and fulfils the order");
    check(shipped?.postage_service === "Tracked 48" && shipped.tracking_reference === "VU628745615GB" && shipped.tracking_url === royalMailTrackingUrl, "Tracking is normalised and the Royal Mail link is automatic");
    check(shipped?.payment_status === "PAID" && shipped.admin_notes === "Private packing note" && shipped.shipping_method_name === "Checkout standard delivery", "Tracking preserves payment, internal notes and checkout delivery service");
    check((await jobs()).length === 1 && (await history()).length === 1, "A shipment produces one customer email and one history entry");
    const email = JSON.parse(decryptSecret((await jobs())[0].payload_encrypted)) as { subject: string; text: string; html: string };
    check(email.subject.includes("Order dispatched"), "The customer receives a dispatch subject");
    check(/<img src="https?:\/\/[^\"]+\/imgs\/products\/1\.png"/.test(email.html), "Dispatch email includes the saved order-item thumbnail with an absolute URL");
    check(/<img src="https?:\/\/[^\"]+\/imgs\/logo-w\.png"/.test(email.html), "Dispatch email includes the N7 logo");
    for (const value of ["Destination", "Alex Morgan", "12 Sample Street", "Postage service", "Tracked 48", "Tracking number", "VU628745615GB", royalMailTrackingUrl]) check(email.text.includes(value) && email.html.includes(value), `Both email versions include ${value}`);
    check(!email.text.includes("Private packing note") && !email.html.includes("Private packing note"), "Internal notes stay private");

    check((await save({ ...tracking, trackingReference: "VU628745616GB" })).success && (await jobs()).length === 2, "A corrected tracking number queues an updated notification");
    check((await save({ ...tracking, postageService: "Tracked 24", trackingReference: "VU628745616GB" })).success && (await jobs()).length === 3, "A corrected postage service queues an updated notification");
    const beforeStatus = await state();
    for (const status of orderStatuses.filter((value) => value !== "SHIPPED")) check((await save({ kind: "status", status })).success, `Owner can select ${status}`);
    const afterStatus = await state();
    check(afterStatus?.tracking_reference === beforeStatus?.tracking_reference && afterStatus?.postage_service === beforeStatus?.postage_service && afterStatus?.payment_status === beforeStatus?.payment_status && afterStatus?.admin_notes === beforeStatus?.admin_notes, "Status-only changes preserve other order fields");

    const beforeNotes = (await jobs()).length;
    check((await save({ kind: "details", paymentStatus: "REFUNDED", fulfillmentStatus: "FULFILLED", adminNotes: "Updated private note", historyNote: null })).success, "General order details remain editable");
    check((await state())?.payment_status === "PAID" && (await state())?.status === "ON_HOLD" && (await jobs()).length === beforeNotes, "Stripe payment remains protected and notes do not change status or notify customers");
    await executeMutation("UPDATE orders SET payment_provider = 'BANK_TRANSFER' WHERE id = ?", [id]);
    await saveOrderUpdate(id, { kind: "details", paymentStatus: "REFUNDED", fulfillmentStatus: "FULFILLED", adminNotes: "Updated private note", historyNote: null }, fulfillment, null);
    check((await state())?.payment_status === "PAID", "Fulfilment staff cannot alter offline payments");

    await setup.query("CREATE TRIGGER fail_tracking_email BEFORE INSERT ON email_jobs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mock queue failure'");
    const beforeFailure = await state();
    const beforeHistory = (await history()).length;
    await assert.rejects(save(tracking)); checks++;
    const afterFailure = await state();
    check(afterFailure?.status === beforeFailure?.status && afterFailure?.tracking_reference === beforeFailure?.tracking_reference && (await history()).length === beforeHistory, "Queue failure rolls back status, tracking and history together");
    await setup.query("DROP TRIGGER fail_tracking_email");

    await executeMutation("UPDATE orders SET source = 'LEGACY' WHERE id = ?", [id]);
    const beforeLegacy = (await jobs()).length;
    check((await save(tracking)).success && (await state())?.status === "SHIPPED" && (await jobs()).length === beforeLegacy, "Historical orders save tracking without sending customer emails");
    check((await selectRows<RowDataPacket>("SELECT * FROM audit_logs WHERE entity_type = 'order' AND entity_id = ?", [id])).length === (await history()).length, "Every committed change is audited");
    console.log(`${checks} order tracking integration checks passed. No emails were sent.`);
  } finally {
    await globalThis.n7MySqlPool?.end();
    globalThis.n7MySqlPool = undefined;
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}

run().catch((error) => { console.error(error instanceof Error ? error.message : "Order tracking checks failed."); process.exitCode = 1; });
