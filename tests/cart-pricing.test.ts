import assert from "node:assert/strict";
import test from "node:test";
import type { PoolConnection } from "mysql2/promise";
import { calculateCartPricing, calculateQuote, CommerceError } from "../lib/commerce/quote";

const products = [
  { product_id: "1", variant_id: "11", product_type: "STANDARD", slug: "amber", product_name: "Amber", price_pence: 4500 },
  { product_id: "2", variant_id: "12", product_type: "STANDARD", slug: "oud", product_name: "Oud", price_pence: 3000 },
  { product_id: "3", variant_id: "13", product_type: "STANDARD", slug: "outside-sale", product_name: "Outside sale", price_pence: 1000 },
];

function database(options: { coupon?: boolean; automatic?: boolean; shipping?: boolean; stock?: number } = {}) {
  const queried: string[] = [];
  const connection = {
    async execute(sql: string, values: unknown[]) {
      queried.push(sql);
      if (sql.includes("FROM products p")) return [products.filter((p) => values.includes(p.slug)).map((p) => ({
        ...p, variant_title: "100 ml", sku: p.slug, stock_on_hand: options.stock ?? 99,
        track_inventory: 1, image_url: "/test.png", category_ids: null, collection_ids: null,
      }))];
      if (sql.includes("FROM discounts d")) return [options.coupon || options.automatic ? [{
        id: "5", name: options.coupon ? "WELCOME10" : "Half price", method: options.coupon ? "COUPON" : "AUTOMATIC",
        discount_type: "PERCENTAGE", value: options.coupon ? 10 : 50, applies_to: "ALL",
        minimum_subtotal_pence: null, maximum_discount_pence: null, coupon_id: options.coupon ? "7" : null,
        coupon_code: options.coupon ? "WELCOME10" : null, usage_limit: null, per_email_limit: null,
        used_count: 0, product_ids: null, category_ids: null, collection_ids: null,
      }] : []];
      if (sql.includes("FROM sales s")) return [[{ id: "1", name: "Buy 5 Get 1 Free", buy_quantity: 5, free_quantity: 1, product_ids: "1,2" }]];
      if (sql.includes("FROM shipping_methods")) return [options.shipping ? [{ id: "1", name: "Standard", method_type: "FLAT_RATE", price_pence: 500, free_over_pence: null, estimated_days_min: 2, estimated_days_max: 4 }] : []];
      throw new Error(`Unexpected query: ${sql}`);
    },
  } as unknown as PoolConnection;
  return { connection, queried };
}

test("server cart pricing works without delivery and discounts only eligible bottles", async () => {
  const db = database();
  const five = await calculateCartPricing({ items: [{ slug: "amber", quantity: 5 }, { slug: "outside-sale", quantity: 1 }] }, db.connection);
  assert.equal(five.discountPence, 0);
  const six = await calculateCartPricing({ items: [{ slug: "amber", quantity: 5 }, { slug: "oud", quantity: 1 }, { slug: "outside-sale", quantity: 1 }] }, db.connection);
  assert.equal(six.freeQuantity, 1);
  assert.equal(six.discountPence, 3000);
  assert.equal(six.lines.find((line) => line.slug === "oud")?.totalPence, 0);
  assert.equal(six.lines.find((line) => line.slug === "outside-sale")?.freeQuantity, 0);
  assert.equal(six.totalPence, six.subtotalPence - six.discountPence);
  assert.equal(six.discount?.saleId, "1");
  assert.equal(db.queried.some((sql) => sql.includes("shipping_methods")), false);
});

test("cart and checkout use identical product prices, free units and savings", async () => {
  const input = { items: [{ slug: "amber", quantity: 6 }, { slug: "oud", quantity: 6 }] };
  const cart = await calculateCartPricing(input, database().connection);
  const quote = await calculateQuote({ ...input, countryCode: "GB" }, database({ shipping: true }).connection);
  assert.deepEqual(quote.lines, cart.lines);
  assert.deepEqual(quote.discount, cart.discount);
  assert.equal(quote.freeQuantity, 2);
  assert.equal(quote.discountPence, 6000);
  assert.equal(quote.totalPence, cart.totalPence + 500);
});

test("coupons replace the sale and leave no stale free labels", async () => {
  const db = database({ coupon: true });
  const priced = await calculateCartPricing({ items: [{ slug: "amber", quantity: 6 }], couponCode: "WELCOME10" }, db.connection);
  assert.equal(priced.discountPence, 2700);
  assert.equal(priced.freeQuantity, 0);
  assert.equal(priced.lines[0].freeQuantity, 0);
  assert.equal(priced.discount?.saleId, null);
  assert.equal(priced.discount?.couponCode, "WELCOME10");
  assert.equal(db.queried.some((sql) => sql.includes("FROM sales s")), false);
});

test("a better automatic discount replaces the sale without stacking", async () => {
  const priced = await calculateCartPricing({ items: [{ slug: "amber", quantity: 6 }] }, database({ automatic: true }).connection);
  assert.equal(priced.discountPence, 13500);
  assert.equal(priced.freeQuantity, 0);
  assert.equal(priced.discount?.name, "Half price");
});

test("free bottles still require stock and checkout still requires delivery", async () => {
  const input = { items: [{ slug: "amber", quantity: 6 }] };
  await assert.rejects(calculateCartPricing(input, database({ stock: 5 }).connection), (error: unknown) => error instanceof CommerceError && error.code === "OUT_OF_STOCK");
  await assert.rejects(calculateQuote({ ...input, countryCode: "GB" }, database().connection), (error: unknown) => error instanceof CommerceError && error.code === "DELIVERY_UNAVAILABLE");
});
