import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import mysql from "mysql2/promise";
import { createConnection } from "mysql2";
import { snapshotReleaseData, verifyReleaseData } from "./release-data";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne } from "../lib/db/query";
import { getShippingConfiguration } from "../lib/commerce/shipping-data";
import { calculateQuote, CommerceError } from "../lib/commerce/quote";
import { createOrder } from "../lib/commerce/orders";
import type { CheckoutInput } from "../lib/commerce/validation";

async function run() {
  const config = getDatabaseConfig();
  assert(["127.0.0.1", "localhost", "::1"].includes(config.host), "Use a local database for shipping checks");
  const database = `n7_shipping_test_${Date.now()}`;
  assert.match(database, /^n7_shipping_test_\d+$/);
  const options = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password };
  const db = await mysql.createConnection({ ...options, multipleStatements: true });
  let created = false;
  let checks = 0;
  const check = (condition: unknown, message: string) => { assert(condition, message); checks++; };
  try {
    await db.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await db.changeUser({ database });
    const files = (await readdir("database/migrations")).filter(name => name.endsWith(".sql")).sort();
    for (const file of files.filter(name => name < "022_")) await db.query(await readFile(`database/migrations/${file}`, "utf8"));
    await db.query(`INSERT INTO shipping_zones (id,name) VALUES (1,'UK'),(2,'Other country');
      INSERT INTO shipping_zone_countries VALUES (1,'GB'),(2,'US');
      INSERT INTO shipping_methods (id,zone_id,name,method_type,price_pence,free_over_pence,threshold_basis,legacy_id,sort_order)
      VALUES (1,1,'Standard delivery','FLAT_RATE',299,NULL,'BEFORE_DISCOUNT',7,10),
        (2,1,'Free shipping','FREE_SHIPPING',0,9900,'BEFORE_DISCOUNT',2,0),
        (3,2,'Other delivery','FLAT_RATE',599,15000,'AFTER_DISCOUNT',NULL,0);
      INSERT INTO orders (order_number,customer_email,customer_name,subtotal_pence,shipping_pence,total_pence,shipping_method_name)
      VALUES ('HISTORICAL','history@example.com','Historical Customer',10000,0,10000,'Free shipping');`);
    const migration = await readFile("database/migrations/022_shipping_methods_rules.sql", "utf8");
    await db.query("INSERT INTO shipping_methods (id,zone_id,name,method_type,price_pence) VALUES (4,1,'Ambiguous delivery','FLAT_RATE',699)");
    await assert.rejects(db.query(migration)); checks++;
    const [beforeGuard] = await db.query("SHOW TABLES LIKE 'shipping_rules'");
    check(Array.isArray(beforeGuard) && beforeGuard.length === 0, "Ambiguous migration fails before persistent changes");
    await db.query("DELETE FROM shipping_methods WHERE id=4");
    const verifier = createConnection({ ...options, database, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true });
    try {
      const before = await snapshotReleaseData(verifier);
      await db.query(migration);
      check((await verifyReleaseData(verifier, before)).tables > 0, "Every existing row and shipping configuration survives migration");
      await db.beginTransaction();
      await db.query("UPDATE orders SET total_pence=1 WHERE order_number='HISTORICAL'");
      await db.commit();
      await assert.rejects(verifyReleaseData(verifier, before), /Existing values changed in orders/); checks++;
      await db.query("UPDATE orders SET total_pence=10000,updated_at=placed_at WHERE order_number='HISTORICAL'");
    } finally { await verifier.promise().end(); }
    for (const file of files.filter(name => name > "022_shipping_methods_rules.sql")) await db.query(await readFile(`database/migrations/${file}`, "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({ ...options, database, connectionLimit: 5, supportBigNumbers: true, bigNumberStrings: true });
    const migrated = await getShippingConfiguration();
    check(migrated.methods.length === 2 && migrated.methods[0].methodType === "DELIVERY", "Free shipping becomes a rule instead of a method");
    check(migrated.rules.length === 2, "Both separate free services and embedded thresholds migrate");
    check(migrated.rules.some(rule => rule.methodIds.includes("1") && rule.minimumSubtotalPence === 9900 && rule.thresholdBasis === "BEFORE_DISCOUNT"), "The current UK threshold and scope are preserved");
    check(migrated.rules.some(rule => rule.methodIds.includes("3") && rule.minimumSubtotalPence === 15000 && rule.thresholdBasis === "AFTER_DISCOUNT"), "Embedded thresholds retain their discount basis");
    const historical = await selectOne("SELECT total_pence,shipping_method_name,shipping_snapshot_json FROM orders WHERE order_number='HISTORICAL'");
    check(historical?.total_pence === 10000 && historical.shipping_method_name === "Free shipping" && historical.shipping_snapshot_json === null, "Migration leaves historical financials unchanged");
    const product = await executeMutation("INSERT INTO products (name,slug,status,track_inventory) VALUES ('Shipping fixture','shipping-fixture','ACTIVE',1)");
    const variant = await executeMutation("INSERT INTO product_variants (product_id,title,sku,price_pence,stock_on_hand,is_default) VALUES (?,'100 ml','SHIPPING-FIXTURE',9899,100,1)", [product.insertId]);
    const base = { items: [{ slug: "shipping-fixture", quantity: 1 }], countryCode: "GB" as const, postalCode: "SW1A 1AA" };
    let quote = await calculateQuote(base);
    check(quote.shippingPence === 299 && quote.shippingMethods.length === 1, "Only Standard is offered below threshold");
    await executeMutation("UPDATE product_variants SET price_pence=9900 WHERE id=?", [variant.insertId]);
    quote = await calculateQuote(base);
    check(quote.shippingPence === 0 && quote.shippingMethod.id === "1" && quote.shippingMethod.adjustment?.source === "RULE", "The exact threshold makes Standard free automatically");
    const discount = await executeMutation("INSERT INTO discounts (name,method,discount_type,value,applies_to) VALUES ('Ten percent','AUTOMATIC','PERCENTAGE',10,'ALL')");
    quote = await calculateQuote(base);
    check(quote.discountPence === 990 && quote.shippingPence === 0, "Automatic shipping stacks with merchandise discounts");
    await executeMutation("UPDATE shipping_rules SET threshold_basis='AFTER_DISCOUNT' WHERE zone_id=1");
    check((await calculateQuote(base)).shippingPence === 299, "After-discount thresholds use the discounted merchandise total");
    await executeMutation("UPDATE shipping_rules SET threshold_basis='BEFORE_DISCOUNT' WHERE zone_id=1");
    await executeMutation("UPDATE discounts SET is_active=0 WHERE id=?", [discount.insertId]);
    const express = await executeMutation("INSERT INTO shipping_methods (name,method_type,pricing_mode,price_pence,sort_order) VALUES ('Express','DELIVERY','FLAT_RATE',699,20)");
    await executeMutation("INSERT INTO shipping_method_rates (method_id,zone_id,price_pence) VALUES (?,1,699)", [express.insertId]);
    check((await calculateQuote({ ...base, shippingMethodId: String(express.insertId) })).shippingPence === 699, "Express keeps its configured rate above the Standard threshold");
    const couponDiscount = await executeMutation("INSERT INTO discounts (name,method,discount_type,value,applies_to) VALUES ('Free delivery coupon','COUPON','FREE_SHIPPING',0,'ALL')");
    await executeMutation("INSERT INTO coupons (discount_id,code) VALUES (?,'SHIPFREE')", [couponDiscount.insertId]);
    await executeMutation("UPDATE product_variants SET price_pence=5000 WHERE id=?", [variant.insertId]);
    check((await calculateQuote({ ...base, couponCode: "SHIPFREE" })).shippingPence === 0, "Coupons can waive an opted-in method");
    check((await calculateQuote({ ...base, couponCode: "SHIPFREE", shippingMethodId: String(express.insertId) })).shippingPence === 699, "Coupons cannot waive Express without opt-in");
    const region = await executeMutation("INSERT INTO shipping_zones (name,sort_order) VALUES ('Northern Ireland',10)");
    await executeMutation("INSERT INTO shipping_zone_countries VALUES (?,'GB')", [region.insertId]);
    await executeMutation("INSERT INTO shipping_zone_postcodes VALUES (?,'BT*')", [region.insertId]);
    await executeMutation("UPDATE shipping_methods SET pricing_mode='ZONE_RATES' WHERE id=1");
    await executeMutation("INSERT INTO shipping_method_rates (method_id,zone_id,price_pence) VALUES (1,?,899)", [region.insertId]);
    quote = await calculateQuote({ ...base, postalCode: "bt1 1aa" });
    check(quote.shippingPence === 899 && quote.shippingMethods.length === 1, "Postcode zones use their own rates and method availability");
    check((await calculateQuote({ items: base.items, countryCode: "GB" })).shippingEstimated, "A missing postcode is marked as an estimate when regional zones exist");
    await assert.rejects(calculateQuote({ ...base, postalCode: "BT1 1AA", shippingMethodId: String(express.insertId) }), error => error instanceof CommerceError && error.code === "DELIVERY_UNAVAILABLE"); checks++;
    const address = { fullName: "Shipping Customer", line1: "1 Test Street", city: "Belfast", postalCode: "BT1 1AA", countryCode: "GB" as const, phone: "02079460000" };
    const input: CheckoutInput = { ...base, idempotencyKey: randomUUID(), shippingMethodId: "1", expectedTotalPence: 5299,
      customer: { name: address.fullName, email: "shipping@example.com", phone: address.phone }, billingAddress: address, shippingAddress: address, paymentMethod: "STRIPE" };
    await assert.rejects(createOrder(input, "test"), error => error instanceof CommerceError && error.code === "CART_CHANGED"); checks++;
    const order = await createOrder({ ...input, idempotencyKey: randomUUID(), expectedTotalPence: 5899 }, "test");
    const saved = await selectOne("SELECT shipping_pence,shipping_snapshot_json FROM orders WHERE id=?", [order.id]);
    const snapshot = typeof saved?.shipping_snapshot_json === "string" ? JSON.parse(saved.shipping_snapshot_json) : saved?.shipping_snapshot_json;
    check(saved?.shipping_pence === 899 && snapshot.zoneName === "Northern Ireland" && snapshot.basePricePence === 899, "Orders use the actual address and retain their zone and price");
    await executeMutation("UPDATE shipping_method_rates SET price_pence=1299 WHERE method_id=1 AND zone_id=?", [region.insertId]);
    check((await selectOne("SELECT shipping_pence FROM orders WHERE id=?", [order.id]))?.shipping_pence === 899, "Later rate edits cannot alter order charges");
    await executeMutation("UPDATE product_variants SET price_pence=9900 WHERE id=?", [variant.insertId]);
    const freeOrder = await createOrder({ ...input, idempotencyKey: randomUUID(), shippingAddress: { ...address, postalCode: "SW1A 1AA" }, expectedTotalPence: 9900 }, "test");
    const stored = await selectOne("SELECT shipping_snapshot_json FROM orders WHERE id=?", [freeOrder.id]);
    const freeSnapshot = typeof stored?.shipping_snapshot_json === "string" ? JSON.parse(stored.shipping_snapshot_json) : stored?.shipping_snapshot_json;
    check(freeSnapshot.adjustment.source === "RULE" && freeSnapshot.adjustment.amountPence === 299, "Free orders retain the rule and actual savings");
    await executeMutation("UPDATE shipping_methods SET is_active=0 WHERE id=1");
    await assert.rejects(calculateQuote({ ...base, shippingMethodId: "1" }), error => error instanceof CommerceError && error.code === "DELIVERY_UNAVAILABLE"); checks++;
    console.log(JSON.stringify({ status: "PASS", checks, migration: "legacy methods and thresholds", checkout: "rules, discounts, coupons, zones, method validation", orders: "actual destination, repricing and immutable shipping snapshots" }));
  } finally {
    await globalThis.n7MySqlPool?.end();
    globalThis.n7MySqlPool = undefined;
    if (created) {
      assert.match(database, /^n7_shipping_test_\d+$/);
      await db.query(`DROP DATABASE \`${database}\``);
    }
    await db.end();
  }
}
run().catch(error => { console.error(error instanceof Error ? error.message : "Shipping checks failed"); process.exitCode = 1; });
