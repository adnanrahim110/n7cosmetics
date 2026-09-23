import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import Stripe from "stripe";
import { mock } from "node:test";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne, selectRows } from "../lib/db/query";
import { createOrder } from "../lib/commerce/orders";
import type { CheckoutInput } from "../lib/commerce/validation";
import { applyPaymentIntent, reconcileStripeCheckout, reconcileStripeCheckouts, validIntentForOrder, type PaymentIntentSnapshot } from "../lib/payments/stripe";
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

    // Exercise direct verification and the worker against a real isolated database.
    // Mock the Stripe transport only: no network requests or email delivery.
    const intents = new Map<string, PaymentIntentSnapshot>();
    let unavailable = false;
    const retrieval = mock.method(stripe.paymentIntents, "retrieve", async (id: string) => {
      if (unavailable) throw new Error("Mock Stripe outage");
      const payment = intents.get(id);
      assert.ok(payment, `Unexpected intent retrieval: ${id}`);
      return { ...payment } as Stripe.Response<Stripe.PaymentIntent>;
    });
    const cancellation = mock.method(stripe.paymentIntents, "cancel", async (id: string) => {
      const payment = intents.get(id);
      assert.ok(payment);
      const canceled = { ...payment, status: "canceled" as const };
      intents.set(id, canceled);
      return canceled as Stripe.Response<Stripe.PaymentIntent>;
    });
    const creation = mock.method(stripe.paymentIntents, "create", async () => { throw new Error("Verification must not create a new payment for an active checkout"); });
    await executeMutation("UPDATE product_variants SET stock_on_hand = 100 WHERE id = ?", [variant.insertId]);
    const pendingOrder = async (status: PaymentIntentSnapshot["status"] = "succeeded") => {
      const pending = await createOrder({ ...input, idempotencyKey: randomUUID() }, "test");
      const payment = intent(pending.id, status);
      intents.set(payment.id, payment);
      await executeMutation("UPDATE stripe_checkouts SET intent_id = ? WHERE order_id = ?", [payment.id, pending.id]);
      return pending;
    };
    const state = (id: string) => selectOne<RowDataPacket>("SELECT o.payment_status,c.inventory_state FROM orders o JOIN stripe_checkouts c ON c.order_id=o.id WHERE o.id=?", [id]);
    const emailCount = async (id: string) => Number((await selectOne<RowDataPacket>("SELECT COUNT(*) AS n FROM email_jobs WHERE dedupe_key = ?", [`order:${id}:confirmation:customer`]))?.n);
    const releaseLease = (id: string) => executeMutation("UPDATE stripe_checkouts SET reconcile_after = NULL WHERE order_id = ?", [id]);

    await executeMutation("UPDATE site_settings SET value_json = ? WHERE setting_key = 'stripe.webhook_secret_encrypted'", [JSON.stringify("")]);
    const noWebhook = await getStripeSettings();
    check(stripeKeysReady(noWebhook) && !noWebhook.webhookSecret, "Matching API keys enable payments without a webhook secret");
    check(!stripeKeysReady({ ...noWebhook, mode: "live" }), "API keys must still match the selected mode");
    const direct = await pendingOrder();
    const reservedStock = await stock();
    await Promise.all([reconcileStripeCheckout(direct.id, noWebhook, stripe), reconcileStripeCheckout(direct.id, noWebhook, stripe)]);
    check((await state(direct.id))?.payment_status === "PAID", "Direct verification completes payment without a webhook");
    check(retrieval.mock.callCount() === 1, "Concurrent confirmation requests retrieve Stripe once");
    check(await stock() === reservedStock && await emailCount(direct.id) === 1, "Direct verification commits reserved stock and queues one confirmation");
    await applyPaymentIntent(intent(direct.id), { id: "evt_after_direct", type: "payment_intent.succeeded" });
    await reconcileStripeCheckout(direct.id, noWebhook, stripe);
    check(await emailCount(direct.id) === 1 && await stock() === reservedStock && retrieval.mock.callCount() === 1, "Later webhooks and refreshes cannot duplicate payment effects or API calls");

    await executeMutation("UPDATE site_settings SET value_json = ? WHERE setting_key = 'stripe.webhook_secret_encrypted'", [JSON.stringify("unreadable-ciphertext")]);
    check(stripeKeysReady(await getStripeSettings()), "Unreadable webhook settings do not disable API payments");
    await executeMutation("UPDATE site_settings SET value_json = ? WHERE setting_key = 'stripe.webhook_secret_encrypted'", [JSON.stringify(encryptSecret("whsec_" + "z".repeat(24)))]);
    const wrongWebhook = await getStripeSettings();
    assert.throws(() => stripe.webhooks.constructEvent(payload, header, wrongWebhook.webhookSecret)); checks++;
    const withoutBrowser = await pendingOrder();
    await reconcileStripeCheckouts(20, stripe);
    check((await state(withoutBrowser.id))?.payment_status === "PAID", "Worker confirms fresh payments before expiry even with an incorrect webhook and no returning browser");
    check(await emailCount(withoutBrowser.id) === 1, "Worker queues the confirmation without a customer request");

    const unsubmitted = await pendingOrder("requires_payment_method");
    await reconcileStripeCheckout(unsubmitted.id, wrongWebhook, stripe);
    check((await state(unsubmitted.id))?.payment_status === "PENDING" && cancellation.mock.callCount() === 0, "Verification never cancels or fails an unsubmitted active checkout");
    const callsBeforeThrottle = retrieval.mock.callCount();
    await reconcileStripeCheckout(unsubmitted.id, wrongWebhook, stripe);
    check(retrieval.mock.callCount() === callsBeforeThrottle, "Repeated pending checks are throttled across requests");
    const missingIntent = await pendingOrder();
    await executeMutation("UPDATE stripe_checkouts SET intent_id = NULL WHERE order_id = ?", [missingIntent.id]);
    await reconcileStripeCheckout(missingIntent.id, wrongWebhook, stripe);
    check(creation.mock.callCount() === 0 && (await state(missingIntent.id))?.payment_status === "PENDING", "Visiting confirmation cannot create or confirm a new payment");

    const recovering = await pendingOrder();
    unavailable = true;
    await assert.rejects(reconcileStripeCheckout(recovering.id, wrongWebhook, stripe)); checks++;
    check((await state(recovering.id))?.payment_status === "PENDING" && await emailCount(recovering.id) === 0, "A Stripe outage cannot mark a payment successful or failed");
    unavailable = false;
    await releaseLease(recovering.id);
    await reconcileStripeCheckout(recovering.id, wrongWebhook, stripe);
    check((await state(recovering.id))?.payment_status === "PAID", "Verification recovers after a transient Stripe failure");

    const outboxRetry = await pendingOrder();
    await setup.query("CREATE TRIGGER fail_direct_email BEFORE INSERT ON email_jobs FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mock direct confirmation outbox failure'");
    await assert.rejects(reconcileStripeCheckout(outboxRetry.id, wrongWebhook, stripe)); checks++;
    check((await state(outboxRetry.id))?.inventory_state === "RESERVED" && await emailCount(outboxRetry.id) === 0, "Direct confirmation rolls back atomically if saving its email fails");
    await setup.query("DROP TRIGGER fail_direct_email");
    await releaseLease(outboxRetry.id);
    await Promise.all([
      reconcileStripeCheckout(outboxRetry.id, wrongWebhook, stripe),
      applyPaymentIntent(intent(outboxRetry.id), { id: "evt_concurrent_direct", type: "payment_intent.succeeded" }),
    ]);
    check((await state(outboxRetry.id))?.payment_status === "PAID" && await emailCount(outboxRetry.id) === 1, "Concurrent webhook and direct recovery complete payment and queue one email");

    const mismatched = await pendingOrder();
    const wrongId = intent(mismatched.id).id;
    intents.set(wrongId, { ...intent(mismatched.id), metadata: { n7_order_id: direct.id } });
    await assert.rejects(reconcileStripeCheckout(mismatched.id, wrongWebhook, stripe), /order mismatch/); checks++;
    check((await state(mismatched.id))?.payment_status === "PENDING" && await emailCount(mismatched.id) === 0, "Another order's Stripe payment cannot confirm this checkout");
    for (const changes of [{ amount: 1 }, { amount_received: 1 }, { currency: "usd" }, { livemode: true }, { id: "pi_unexpected" }]) {
      intents.set(wrongId, { ...intent(mismatched.id), ...changes });
      await releaseLease(mismatched.id);
      await assert.rejects(reconcileStripeCheckout(mismatched.id, wrongWebhook, stripe)); checks++;
    }

    const declined = await pendingOrder("requires_payment_method");
    intents.set(intent(declined.id).id, { ...intent(declined.id, "requires_payment_method"), last_payment_error: { type: "card_error", code: "card_declined" } });
    await reconcileStripeCheckout(declined.id, wrongWebhook, stripe);
    check((await state(declined.id))?.payment_status === "FAILED", "Direct API verification records a declined card without a webhook");
    intents.set(intent(declined.id).id, intent(declined.id, "processing"));
    await releaseLease(declined.id);
    await reconcileStripeCheckout(declined.id, wrongWebhook, stripe);
    check((await state(declined.id))?.payment_status === "PENDING", "A retried payment returns to pending while Stripe processes it");
    intents.set(intent(declined.id).id, intent(declined.id));
    await releaseLease(declined.id);
    await reconcileStripeCheckout(declined.id, wrongWebhook, stripe);
    check((await state(declined.id))?.payment_status === "PAID" && await emailCount(declined.id) === 1, "A successful retry completes the same order once");

    const processing = await pendingOrder("processing");
    await executeMutation("UPDATE stripe_checkouts SET expires_at = DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE order_id IN (?,?)", [processing.id, unsubmitted.id]);
    await releaseLease(unsubmitted.id);
    const beforeExpiryStock = await stock();
    await reconcileStripeCheckout(processing.id, wrongWebhook, stripe);
    check((await state(processing.id))?.inventory_state === "RESERVED" && await stock() === beforeExpiryStock && cancellation.mock.callCount() === 0, "Expired processing payments retain their stock until Stripe resolves them");
    await reconcileStripeCheckout(unsubmitted.id, wrongWebhook, stripe);
    check((await state(unsubmitted.id))?.inventory_state === "RELEASED" && await stock() === beforeExpiryStock + 1 && cancellation.mock.callCount() === 1, "Expired abandoned payments are canceled before stock is restored");

    // A permanently processing older payment must not starve newer paid orders.
    await executeMutation("UPDATE stripe_checkouts SET reconcile_after = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 1 DAY) WHERE inventory_state = 'RESERVED'");
    const older = await pendingOrder("processing");
    const newer = await pendingOrder();
    await reconcileStripeCheckouts(1, stripe);
    await reconcileStripeCheckouts(1, stripe);
    check((await state(older.id))?.inventory_state === "RESERVED" && (await state(newer.id))?.payment_status === "PAID", "Worker batches rotate past unresolved payments without starving new orders");
    mock.restoreAll();
    console.log(`${checks} Stripe integration checks passed; no Stripe API calls, charges or email sends.`);
  } finally {
    await globalThis.n7MySqlPool?.end();
    globalThis.n7MySqlPool = undefined;
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
run().catch((error) => { console.error(error instanceof Error ? error.message : "Payment checks failed."); process.exitCode = 1; });
