import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import Stripe from "stripe";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne, selectRows } from "../lib/db/query";
import { createOrder } from "../lib/commerce/orders";
import type { CheckoutInput } from "../lib/commerce/validation";
import { applyPaymentIntent, validIntentForOrder, type PaymentIntentSnapshot } from "../lib/payments/stripe";
import { getStripeSettings, stripeKeysReady } from "../lib/payments/settings";
import { encryptSecret } from "../lib/security/encryption";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(config.host), "Checks must use a local database");
  const database = `n7_payment_test_${Date.now()}`;
  assert.match(database, /^n7_payment_test_\d+$/);
  const options = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password };
  const setup = await mysql.createConnection({ ...options, multipleStatements: true });
  let created = false;
  let checks = 0;
  const check = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; };
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await setup.changeUser({ database });
    for (const name of (await readdir("database/migrations")).filter((name) => name.endsWith(".sql")).sort()) await setup.query(await readFile(path.join("database/migrations", name), "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({ ...options, database, connectionLimit: 5, supportBigNumbers: true, bigNumberStrings: true });
    const product = await executeMutation("INSERT INTO products (name, slug, status, track_inventory) VALUES ('Payment test', 'payment-test', 'ACTIVE', 1)");
    const variant = await executeMutation("INSERT INTO product_variants (product_id, title, sku, price_pence, stock_on_hand, is_default) VALUES (?, '100 ml', 'STRIPE-TEST', 4500, 10, 1)", [product.insertId]);
    const zone = await executeMutation("INSERT INTO shipping_zones (name) VALUES ('UK test')");
    await executeMutation("INSERT INTO shipping_zone_countries (zone_id, country_code) VALUES (?, 'GB')", [zone.insertId]);
    const delivery = await executeMutation("INSERT INTO shipping_methods (name, method_type, price_pence) VALUES ('Delivery', 'DELIVERY', 299)");
    await executeMutation("INSERT INTO shipping_method_rates (method_id,zone_id,price_pence) VALUES (?,?,299)", [delivery.insertId, zone.insertId]);
    const billing = { fullName: "Billing Person", line1: "1 Test Street", city: "London", postalCode: "SW1A 1AA", countryCode: "GB" as const, phone: "02079460000" };
    const input: CheckoutInput = { idempotencyKey: randomUUID(), expectedTotalPence: 4799, items: [{ slug: "payment-test", quantity: 1 }], customer: { name: billing.fullName, email: "customer@example.com", phone: billing.phone }, countryCode: "GB", billingAddress: billing, shippingAddress: { ...billing, fullName: "Shipping Person", line1: "2 Test Street" }, paymentMethod: "STRIPE", shippingMethodId: String(delivery.insertId) };
    const stock = async () => Number((await selectOne<RowDataPacket>("SELECT stock_on_hand FROM product_variants WHERE id = ?", [variant.insertId]))?.stock_on_hand);
    const intent = (orderId: string, status: PaymentIntentSnapshot["status"] = "succeeded"): PaymentIntentSnapshot => ({ id: `pi_fixture_${orderId}`, amount: 4799, amount_received: status === "succeeded" ? 4799 : 0, currency: "gbp", livemode: false, status, metadata: { n7_order_id: orderId } });

    const [order, retry] = await Promise.all([createOrder(input, "test"), createOrder(input, "test")]);
    check(order.id === retry.id && await stock() === 9, "Concurrent retries must reserve inventory and create an order once");
    check((await selectRows("SELECT id FROM email_jobs WHERE template_key = 'order-confirmation'")).length === 0, "Unpaid orders must not queue confirmation");
    const addresses = await selectRows<RowDataPacket>("SELECT address_type, full_name, line_1 FROM order_addresses WHERE order_id = ? ORDER BY address_type", [order.id]);
    check(addresses.length === 2 && addresses[0].line_1 !== addresses[1].line_1, "Billing and shipping must be stored separately");
    await assert.rejects(createOrder({ ...input, expectedTotalPence: 1 }, "test")); checks++;
    await assert.rejects(createOrder({ ...input, idempotencyKey: randomUUID(), expectedTotalPence: 4700 }, "test")); checks++;
    check(await stock() === 9, "Changed totals must not reserve more stock");
    await assert.rejects(applyPaymentIntent({ ...intent(order.id), amount: 1 }, { id: "evt_bad_amount", type: "payment_intent.succeeded" })); checks++;
    check(!validIntentForOrder({ ...intent(order.id), amount_received: 1 }, { total_pence: 4799, currency: "GBP", stripe_mode: "test" }), "Partial receipt cannot mark the order paid");
    check(!validIntentForOrder({ ...intent(order.id), livemode: true }, { total_pence: 4799, currency: "GBP", stripe_mode: "test" }), "Live and test payments cannot mix");
    check(!validIntentForOrder({ ...intent(order.id), currency: "usd" }, { total_pence: 4799, currency: "GBP", stripe_mode: "test" }), "Wrong currency cannot mark an order paid");

    await applyPaymentIntent(intent(order.id), { id: "evt_paid", type: "payment_intent.succeeded" });
    await applyPaymentIntent(intent(order.id), { id: "evt_paid", type: "payment_intent.succeeded" });
    await applyPaymentIntent(intent(order.id), { id: "evt_paid_again", type: "payment_intent.succeeded" });
    await applyPaymentIntent(intent(order.id, "requires_payment_method"), { id: "evt_late_failure", type: "payment_intent.payment_failed" });
    const paid = await selectOne<RowDataPacket>("SELECT status, payment_status FROM orders WHERE id = ?", [order.id]);
    check(paid?.payment_status === "PAID" && paid.status === "CONFIRMED", "Duplicate/out-of-order events must not downgrade successful payment");
    check(await stock() === 9, "Success must not deduct stock twice");
    check((await selectRows("SELECT id FROM email_jobs WHERE template_key = 'order-confirmation'")).length === 1, "Customer confirmation must be queued once");
    await assert.rejects(applyPaymentIntent({ ...intent(order.id), id: "pi_wrong" })); checks++;

    const discount = await executeMutation("INSERT INTO discounts (name, method, discount_type, value, applies_to) VALUES ('Test coupon', 'COUPON', 'FIXED_AMOUNT', 100, 'ALL')");
    const coupon = await executeMutation("INSERT INTO coupons (discount_id, code, usage_limit) VALUES (?, 'PAYMENTTEST', 10)", [discount.insertId]);
    const abandoned = await createOrder({ ...input, idempotencyKey: randomUUID(), expectedTotalPence: 4699, couponCode: "PAYMENTTEST" }, "test");
    check(await stock() === 8, "Unpaid checkout reserves its stock");
    const canceled = { ...intent(abandoned.id, "canceled"), amount: 4699 };
    await applyPaymentIntent(canceled, { id: "evt_cancel", type: "payment_intent.canceled" });
    await applyPaymentIntent(canceled, { id: "evt_cancel_again", type: "payment_intent.canceled" });
    check(await stock() === 9, "Cancellation restores stock exactly once");
    check(Number((await selectOne<RowDataPacket>("SELECT used_count FROM coupons WHERE id = ?", [coupon.insertId]))?.used_count) === 0, "Cancellation releases coupon usage");
    check((await selectRows("SELECT id FROM coupon_redemptions WHERE order_id = ?", [abandoned.id])).length === 0, "Cancelled coupon can be used again");

    const failing = await createOrder({ ...input, idempotencyKey: randomUUID() }, "test");
    await setup.query("CREATE TRIGGER fail_payment_email BEFORE INSERT ON email_jobs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mock email outbox failure'");
    await assert.rejects(applyPaymentIntent(intent(failing.id), { id: "evt_retryable", type: "payment_intent.succeeded" })); checks++;
    check((await selectRows("SELECT event_id FROM stripe_webhook_events WHERE event_id = 'evt_retryable'")).length === 0, "Failed processing must not consume the webhook event");
    await setup.query("DROP TRIGGER fail_payment_email");
    await applyPaymentIntent(intent(failing.id), { id: "evt_retryable", type: "payment_intent.succeeded" });
    check((await selectOne<RowDataPacket>("SELECT payment_status FROM orders WHERE id = ?", [failing.id]))?.payment_status === "PAID", "Webhook retries recover failed email enqueue atomically");

    const fixtureSecret = "sk_test_" + "a".repeat(24);
    const signingSecret = "whsec_" + "b".repeat(24);
    const settings = { "stripe.enabled": true, "stripe.mode": "test", "stripe.publishable_key": "pk_test_" + "c".repeat(24), "stripe.secret_key_encrypted": encryptSecret(fixtureSecret), "stripe.webhook_secret_encrypted": encryptSecret(signingSecret) };
    for (const [key, value] of Object.entries(settings)) await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES (?, 'stripe', ?, 0) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)", [key, JSON.stringify(value)]);
    check(stripeKeysReady(await getStripeSettings()), "Saved encrypted settings must load without environment credentials");
    check(!settings["stripe.secret_key_encrypted"].includes(fixtureSecret), "Database ciphertext must not contain secret key plaintext");
    const stripe = new Stripe(fixtureSecret);
    const payload = JSON.stringify({ id: "evt_signature", object: "event", type: "payment_intent.succeeded", data: { object: intent(order.id) } });
    const header = stripe.webhooks.generateTestHeaderString({ payload, secret: signingSecret });
    check(stripe.webhooks.constructEvent(payload, header, signingSecret).id === "evt_signature", "Valid webhook signature must be accepted");
    assert.throws(() => stripe.webhooks.constructEvent(payload + " ", header, signingSecret)); checks++;
    const old = stripe.webhooks.generateTestHeaderString({ payload, secret: signingSecret, timestamp: Math.floor(Date.now() / 1000) - 600 });
    assert.throws(() => stripe.webhooks.constructEvent(payload, old, signingSecret)); checks++;
    console.log(`${checks} Stripe integration checks passed; no Stripe API calls, charges or email sends.`);
  } finally {
    await globalThis.n7MySqlPool?.end();
    globalThis.n7MySqlPool = undefined;
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
run().catch((error) => { console.error(error instanceof Error ? error.message : "Payment checks failed."); process.exitCode = 1; });
