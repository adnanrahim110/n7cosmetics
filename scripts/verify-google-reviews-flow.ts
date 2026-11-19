import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne } from "../lib/db/query";
import { getGoogleReviewsSettings, saveGoogleReviewsSettings } from "../lib/google-reviews/settings";
import { getGoogleReviewSurvey } from "../lib/google-reviews/orders";
import { googleReviewSurveyResponse } from "../lib/google-reviews/endpoint";
import { googleReviewsSettingKey } from "../lib/google-reviews/config";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["localhost", "127.0.0.1", "::1"].includes(config.host), "Google Reviews checks require a local database");
  const database = `n7_google_reviews_test_${Date.now()}`;
  assert.match(database, /^n7_google_reviews_test_\d+$/);
  const options = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password };
  const setup = await mysql.createConnection({ ...options, multipleStatements: true });
  const originalUrl = process.env.APP_URL, originalFetch = globalThis.fetch;
  process.env.APP_URL = "https://n7cosmetics.co.uk";
  globalThis.fetch = async () => { throw new Error("These checks must not call Google or Stripe"); };
  let created = false, checks = 0;
  const check = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; };
  try {
    await setup.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); created = true;
    await setup.changeUser({ database });
    for (const name of (await readdir("database/migrations")).filter(name => name.endsWith(".sql")).sort()) await setup.query(await readFile(`database/migrations/${name}`, "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({ ...options, database, connectionLimit: 6, timezone: "Z", supportBigNumbers: true, bigNumberStrings: true });
    const administrator = await executeMutation("INSERT INTO administrators (name,email,password_hash,role) VALUES ('Review fixture','reviews@example.test','not-a-login-password','MANAGER')");
    const adminId = String(administrator.insertId);
    const initial = await getGoogleReviewsSettings();
    check(initial.settings.merchantId === "5876486574" && initial.settings.surveyEnabled && initial.settings.widgetEnabled, "Migration configures the supplied account and both integrations");
    const fixture = async (mode = "live") => {
      const key = randomUUID();
      const order = await executeMutation(`INSERT INTO orders (order_number,customer_name,customer_email,subtotal_pence,total_pence,payment_status,paid_at,shipping_snapshot_json)
        VALUES (?, 'Review buyer', 'buyer@example.test',4500,4799,'PAID',CURRENT_TIMESTAMP(3),?)`, [`REV-${randomUUID().slice(0, 12)}`, JSON.stringify({ id: "1", estimatedDaysMax: 2 })]);
      const id = String(order.insertId);
      await executeMutation("INSERT INTO payments (order_id,provider,status,amount_pence,idempotency_key) VALUES (?,'STRIPE','SUCCEEDED',4799,?)", [id, key]);
      await executeMutation("INSERT INTO stripe_checkouts (order_id,request_hash,stripe_mode,expires_at,inventory_state) VALUES (?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE),'COMMITTED')", [id, "0".repeat(64), mode]);
      await executeMutation("INSERT INTO order_addresses (order_id,address_type,full_name,line_1,city,postal_code,country_code) VALUES (?,'SHIPPING','Actual recipient','Private street','Paris','75001','FR')", [id]);
      return { id, key };
    };
    const order = await fixture();
    const survey = await getGoogleReviewSurvey(order.key);
    assert.ok(survey);
    check(survey.merchant_id === 5876486574 && survey.email === "buyer@example.test" && survey.delivery_country === "FR", "Survey uses the real order email and destination rather than billing or configured widget country");
    check(Object.keys(survey).sort().join(",") === "delivery_country,email,estimated_delivery_date,merchant_id,opt_in_style,order_id", "Survey includes only the required transaction data and presentation option");
    check((await getGoogleReviewSurvey(order.key))?.estimated_delivery_date === survey.estimated_delivery_date, "Repeated reads preserve the paid-date estimate");
    check(await getGoogleReviewSurvey(randomUUID()) === null && await getGoogleReviewSurvey("invalid") === null, "Unknown and invalid receipt credentials reveal nothing");
    for (const state of ["PENDING", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]) {
      await executeMutation("UPDATE orders SET payment_status=? WHERE id=?", [state, order.id]);
      check(await getGoogleReviewSurvey(order.key) === null, `${state} orders cannot produce survey payloads`);
    }
    await executeMutation("UPDATE orders SET payment_status='PAID' WHERE id=?", [order.id]);
    for (const state of ["RESERVED", "RELEASED"]) {
      await executeMutation("UPDATE stripe_checkouts SET inventory_state=? WHERE order_id=?", [state, order.id]);
      check(await getGoogleReviewSurvey(order.key) === null, `${state} checkouts are excluded`);
    }
    await executeMutation("UPDATE stripe_checkouts SET inventory_state='COMMITTED' WHERE order_id=?", [order.id]);
    await executeMutation("UPDATE orders SET source='LEGACY' WHERE id=?", [order.id]);
    check(await getGoogleReviewSurvey(order.key) === null, "Imported historical orders cannot trigger surveys");
    await executeMutation("UPDATE orders SET source='LIVE',delivery_address_review_required=1 WHERE id=?", [order.id]);
    check(await getGoogleReviewSurvey(order.key) === null, "Wallet orders wait for delivery-address confirmation");
    await executeMutation("UPDATE orders SET delivery_address_review_required=0 WHERE id=?", [order.id]);
    check(Boolean(await getGoogleReviewSurvey(order.key)), "Address confirmation makes the paid order eligible");
    await executeMutation("UPDATE orders SET paid_at=DATE_SUB(CURRENT_TIMESTAMP(3),INTERVAL 3 DAY) WHERE id=?", [order.id]);
    check(await getGoogleReviewSurvey(order.key) === null, "Stale receipt visits do not share old customer data");
    await executeMutation("UPDATE orders SET paid_at=CURRENT_TIMESTAMP(3) WHERE id=?", [order.id]);
    const testOrder = await fixture("test");
    check(await getGoogleReviewSurvey(testOrder.key) === null, "Stripe test payments are excluded");
    const saved = await saveGoogleReviewsSettings({ ...initial.settings, merchantId: "123456789", surveyEnabled: false }, initial.revision, adminId);
    check("revision" in saved && await getGoogleReviewSurvey(order.key) === null, "Admin can disable invitations independently of the widget");
    check("error" in await saveGoogleReviewsSettings(initial.settings, initial.revision, adminId), "Stale settings cannot overwrite another session");
    const current = await getGoogleReviewsSettings();
    check("revision" in await saveGoogleReviewsSettings({ ...current.settings, surveyEnabled: true }, current.revision, adminId), "Admin can re-enable invitations");
    check((await getGoogleReviewSurvey(order.key))?.merchant_id === 123456789, "Payloads use the currently saved Merchant ID");
    const before = await getGoogleReviewsSettings();
    await assert.rejects(saveGoogleReviewsSettings({ ...before.settings, merchantId: "999999999" }, before.revision, "99999999")); checks++;
    check((await getGoogleReviewsSettings()).revision === before.revision, "Audit failure rolls back the settings change");
    await setup.query(await readFile("database/migrations/042_google_customer_reviews.sql", "utf8"));
    check((await getGoogleReviewsSettings()).revision === before.revision, "Migration never overwrites existing customized settings");
    const metadata = await selectOne<RowDataPacket>("SELECT is_public,setting_group FROM site_settings WHERE setting_key=?", [googleReviewsSettingKey]);
    check(metadata?.is_public === 0 && metadata.setting_group === "google", "Raw settings remain private");
    const request = (body: unknown, origin = "https://n7cosmetics.co.uk") => new Request("https://n7cosmetics.co.uk/api/google/customer-reviews", { method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(body) });
    const response = await googleReviewSurveyResponse(request({ key: order.key }));
    check(response.status === 200 && response.headers.get("cache-control") === "private, no-store", "Authorized transaction response cannot be cached");
    check(response.headers.get("referrer-policy") === "no-referrer", "Receipt credentials cannot be forwarded through referrers");
    check((await googleReviewSurveyResponse(request({ key: order.key }, "https://evil.test"))).status === 403, "Cross-origin callers cannot obtain transaction data");
    check((await googleReviewSurveyResponse(request({ key: order.key, email: "injected@example.test" }))).status === 400, "Browser-supplied customer fields are rejected");
    check((await googleReviewSurveyResponse(request({ key: "invalid" }))).status === 400, "Malformed receipt keys are rejected");
    check((await googleReviewSurveyResponse(request({ key: randomUUID() }))).status === 204, "Unknown receipts return no customer payload");
    check((await googleReviewSurveyResponse(request({ key: order.key, padding: "x".repeat(2000) }))).status === 400, "Oversized streamed bodies are bounded");
    console.log(`${checks} Google Customer Reviews integration checks passed; disposable database removed; no Google, Stripe, email or browser calls.`);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.APP_URL; else process.env.APP_URL = originalUrl;
    await globalThis.n7MySqlPool?.end(); globalThis.n7MySqlPool = undefined;
    if (created) await setup.query(`DROP DATABASE \`${database}\``);
    await setup.end();
  }
}
void run().catch(error => { console.error(error instanceof Error ? error.message : "Google review checks failed"); process.exitCode = 1; });
