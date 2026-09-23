import "./load-env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import mysql, { type RowDataPacket } from "mysql2/promise";
import { getDatabaseConfig } from "../lib/env";
import { executeMutation, selectOne } from "../lib/db/query";
import { getStorefrontStock } from "../lib/commerce/stock-data";
import { calculateCartPricing, calculateQuote, CommerceError } from "../lib/commerce/quote";
import { createOrder } from "../lib/commerce/orders";
import { applyPaymentIntent } from "../lib/payments/stripe";
import type { CheckoutInput } from "../lib/commerce/validation";

async function run() {
  const config = getDatabaseConfig();
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(config.host), "Stock checks require a local database");
  const database = `n7_stock_test_${Date.now()}`;
  assert.match(database, /^n7_stock_test_\d+$/);
  const options = { host: config.host, port: config.port, user: process.env.DB_ROOT_PASSWORD ? "root" : config.user, password: process.env.DB_ROOT_PASSWORD || config.password };
  const db = await mysql.createConnection({ ...options, multipleStatements: true });
  let created = false;
  let checks = 0;
  const check = (condition: unknown, message: string) => { assert.ok(condition, message); checks++; };
  try {
    await db.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    await db.changeUser({ database });
    for (const file of (await readdir("database/migrations")).filter((file) => file.endsWith(".sql")).sort()) await db.query(await readFile(`database/migrations/${file}`, "utf8"));
    globalThis.n7MySqlPool = mysql.createPool({ ...options, database, connectionLimit: 5, supportBigNumbers: true, bigNumberStrings: true });
    const product = async (slug: string, stock: number, type = "STANDARD", tracked = true) => {
      const p = await executeMutation("INSERT INTO products (slug,name,status,product_type,track_inventory) VALUES (?,?,'ACTIVE',?,?)", [slug, slug, type, tracked]);
      const v = await executeMutation("INSERT INTO product_variants (product_id,title,sku,price_pence,stock_on_hand,is_default) VALUES (?,'100 ml',?,1000,?,1)", [p.insertId, slug, stock]);
      return { id: String(p.insertId), variant: String(v.insertId), slug };
    };
    const amber = await product("stock-amber", 5);
    const empty = await product("stock-empty", 0);
    const unlimited = await product("stock-unlimited", 0, "STANDARD", false);
    const bundle = await product("stock-bundle", 10, "BUNDLE");
    const secondBundle = await product("stock-second-bundle", 10, "BUNDLE");
    for (const b of [bundle, secondBundle]) await executeMutation("INSERT INTO bundle_items (bundle_product_id,component_variant_id,quantity) VALUES (?,?,2)", [b.id, amber.variant]);
    const initial = await getStorefrontStock();
    check(initial.products[empty.slug].soldOut && initial.products[empty.slug].maxQuantity === 0, "The catalog marks zero-stock products sold out before cart interaction");
    check(initial.products[unlimited.slug].availableQuantity === null && !initial.products[unlimited.slug].soldOut, "Untracked products remain available at zero stock");
    check(initial.products[bundle.slug].availableQuantity === 2, "Bundle availability reflects required component quantities");

    const stockBefore = async () => Number((await selectOne<RowDataPacket>("SELECT stock_on_hand FROM product_variants WHERE id=?", [amber.variant]))?.stock_on_hand);
    const soldOutCart = await getStorefrontStock([{ slug: empty.slug, quantity: 1 }]);
    check(soldOutCart.issues[0]?.code === "OUT_OF_STOCK", "Add-to-cart validation rejects zero stock without changing inventory");
    await assert.rejects(calculateCartPricing({ items: [{ slug: empty.slug, quantity: 1 }] }), (error: unknown) => error instanceof CommerceError && error.code === "OUT_OF_STOCK"); checks++;
    const valid = [{ slug: amber.slug, quantity: 1 }, { slug: bundle.slug, quantity: 2 }];
    const invalid = [{ slug: amber.slug, quantity: 2 }, { slug: bundle.slug, quantity: 2 }];
    check((await getStorefrontStock(valid)).issues.length === 0, "A bottle and bundle can exactly use all shared component stock");
    check((await calculateCartPricing({ items: valid })).lines.length === 2, "Cart pricing uses the same valid stock decision");
    check((await getStorefrontStock(invalid)).issues.length === 2, "Add-to-cart detects combined stock overuse across different items");
    await assert.rejects(calculateCartPricing({ items: invalid }), (error: unknown) => error instanceof CommerceError && error.code === "OUT_OF_STOCK"); checks++;
    await assert.rejects(calculateCartPricing({ items: [{ slug: bundle.slug, quantity: 2 }, { slug: secondBundle.slug, quantity: 1 }] }), (error: unknown) => error instanceof CommerceError && error.code === "OUT_OF_STOCK"); checks++;
    check(await stockBefore() === 5, "Catalog and cart validation never reserve inventory");

    await executeMutation("UPDATE product_variants SET stock_on_hand=0 WHERE id=?", [amber.variant]);
    const changed = await getStorefrontStock(valid);
    check(changed.products[amber.slug].soldOut && changed.products[bundle.slug].soldOut && changed.products[secondBundle.slug].soldOut, "A stock change updates standalone and bundle availability together");
    check(changed.issues.length === 2, "Saved carts are invalidated after inventory runs out");
    await executeMutation("UPDATE product_variants SET stock_on_hand=5 WHERE id=?", [amber.variant]);
    check((await getStorefrontStock(valid)).issues.length === 0, "Restocking restores availability without stale sold-out values");
    await executeMutation("UPDATE product_variants SET status='DISABLED' WHERE id=?", [amber.variant]);
    const inactive = await getStorefrontStock([{ slug: amber.slug, quantity: 1 }]);
    check(!Object.hasOwn(inactive.products, amber.slug) && inactive.products[bundle.slug].soldOut && inactive.issues[0].code === "CART_CHANGED", "Inactive variants disappear from availability and disable their bundles");
    await executeMutation("UPDATE product_variants SET status='ACTIVE' WHERE id=?", [amber.variant]);
    const emptyBundle = await product("stock-empty-bundle", 10, "BUNDLE");
    check((await getStorefrontStock()).products[emptyBundle.slug].soldOut, "A bundle without components cannot be sold");
    check((await calculateCartPricing({ items: [{ slug: unlimited.slug, quantity: 99 }] })).lines[0].quantity === 99, "Cart and checkout honor untracked inventory");

    const zone = await executeMutation("INSERT INTO shipping_zones (name) VALUES ('Stock test UK')");
    await executeMutation("INSERT INTO shipping_zone_countries (zone_id,country_code) VALUES (?,'GB')", [zone.insertId]);
    const delivery = await executeMutation("INSERT INTO shipping_methods (name,method_type,price_pence) VALUES ('Stock test delivery','DELIVERY',299)");
    await executeMutation("INSERT INTO shipping_method_rates (method_id,zone_id,price_pence) VALUES (?,?,299)", [delivery.insertId, zone.insertId]);
    const address = { fullName: "Stock Test", line1: "1 Test Road", city: "London", postalCode: "SW1A 1AA", countryCode: "GB" as const, phone: "02079460000" };
    const input = async (items: CheckoutInput["items"]): Promise<CheckoutInput> => {
      const quote = await calculateQuote({ items, countryCode: "GB", shippingMethodId: String(delivery.insertId) });
      return { items, countryCode: "GB", shippingMethodId: String(delivery.insertId), idempotencyKey: randomUUID(), expectedTotalPence: quote.totalPence,
        customer: { name: address.fullName, email: "stock-test@example.com", phone: address.phone }, billingAddress: address, shippingAddress: address, paymentMethod: "STRIPE" };
    };
    const checkoutInput = await input(valid);
    const checkout = await createOrder(checkoutInput, "test");
    check(await stockBefore() === 0, "Checkout reserves combined bottle and bundle component stock exactly once");
    check((await getStorefrontStock()).products[bundle.slug].soldOut, "Pending checkout reservations immediately make affected bundles sold out");
    check((await getStorefrontStock(valid, checkoutInput.idempotencyKey)).issues.length === 0, "The customer can still purchase stock held by their own pending payment");
    check((await getStorefrontStock(valid, randomUUID())).issues.length === 2, "Another customer cannot use that reservation");
    check((await calculateCartPricing({ items: valid, reservationKey: checkoutInput.idempotencyKey })).lines.length === 2, "Cart refresh preserves a payment retry's reserved stock");
    check((await calculateQuote({ items: valid, countryCode: "GB", reservationKey: checkoutInput.idempotencyKey })).totalPence === checkout.total_pence, "Checkout and wallet quotes include their own reservation");
    await assert.rejects(createOrder({ ...checkoutInput, idempotencyKey: randomUUID(), reservationKey: checkoutInput.idempotencyKey } as CheckoutInput, "test"), (error: unknown) => error instanceof CommerceError && error.code === "OUT_OF_STOCK"); checks++;
    check((await createOrder(checkoutInput, "test")).id === checkout.id && await stockBefore() === 0, "Retrying the same payment neither blocks nor reserves the stock twice");
    await executeMutation("UPDATE stripe_checkouts SET expires_at=DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE order_id=?", [checkout.id]);
    check((await getStorefrontStock(valid, checkoutInput.idempotencyKey)).issues.length === 2, "Expired reservations cannot inflate available stock");
    await executeMutation("UPDATE stripe_checkouts SET expires_at=DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE) WHERE order_id=?", [checkout.id]);
    await applyPaymentIntent({ id: `pi_stock_${checkout.id}`, metadata: { n7_order_id: checkout.id }, status: "canceled", amount: checkout.total_pence, amount_received: 0, currency: "gbp", livemode: false });
    check(await stockBefore() === 5 && !(await getStorefrontStock()).products[bundle.slug].soldOut, "Canceling checkout restores stock and storefront availability together");
    check((await getStorefrontStock(valid, checkoutInput.idempotencyKey)).products[amber.slug].availableQuantity === 5, "Released reservations are never added to stock a second time");

    await executeMutation("UPDATE product_variants SET stock_on_hand=1 WHERE id=?", [amber.variant]);
    const first = await input([{ slug: amber.slug, quantity: 1 }]);
    const second = { ...first, idempotencyKey: randomUUID() };
    const orders = await Promise.allSettled([createOrder(first, "test"), createOrder(second, "test")]);
    check(orders.filter((order) => order.status === "fulfilled").length === 1 && await stockBefore() === 0, "Concurrent customers cannot purchase the same final unit");
    check((await getStorefrontStock()).products[amber.slug].soldOut, "The final reservation is reflected in all storefront stock reads");
    console.log(`${checks} stock integration checks passed; isolated local database, no Stripe calls or emails sent.`);
  } finally {
    await globalThis.n7MySqlPool?.end();
    globalThis.n7MySqlPool = undefined;
    if (created) await db.query(`DROP DATABASE \`${database}\``);
    await db.end();
  }
}

void run().catch((error) => { console.error(error instanceof Error ? error.message : "Stock verification failed"); process.exitCode = 1; });
