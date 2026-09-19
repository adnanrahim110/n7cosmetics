import assert from "node:assert/strict";
import test from "node:test";
import { cartPricingInputSchema, checkoutInputSchema, quoteInputSchema } from "../lib/commerce/validation";
import { calculateBuyXGetYPricing, getSaleProgress } from "../lib/commerce/sale-pricing";
import { defaultSalePageConfiguration } from "../lib/storefront-pages/config";

test("quote input rejects duplicate lines and excessive quantities", () => {
  assert.equal(quoteInputSchema.safeParse({ items: [{ slug: "amber", quantity: 1 }, { slug: "amber", quantity: 2 }], countryCode: "GB" }).success, false);
  assert.equal(quoteInputSchema.safeParse({ items: [{ slug: "amber", quantity: 100 }], countryCode: "GB" }).success, false);
});

test("checkout requires matching delivery country and valid idempotency", () => {
  const base = {
    items: [{ slug: "amber", quantity: 1 }], countryCode: "GB", idempotencyKey: "1e7e8efe-9f52-4c1c-a2a0-f2dc38ecabb8",
    expectedTotalPence: 4799,
    customer: { name: "N7 Customer", email: "customer@example.com", phone: "02079460000" },
    billingAddress: { fullName: "N7 Customer", line1: "1 Test Street", city: "London", postalCode: "SW1A 1AA", countryCode: "GB", phone: "02079460000" },
    shippingAddress: { fullName: "N7 Recipient", line1: "2 Test Street", city: "London", postalCode: "SW1A 1AA", countryCode: "GB", phone: "02079460001" },
    paymentMethod: "STRIPE",
  };
  assert.equal(checkoutInputSchema.safeParse(base).success, true);
  assert.equal(checkoutInputSchema.safeParse({ ...base, shippingAddress: { ...base.shippingAddress, countryCode: "US" } }).success, false);
  assert.equal(checkoutInputSchema.safeParse({ ...base, billingAddress: undefined }).success, false);
  assert.equal(checkoutInputSchema.safeParse({ ...base, customer: { ...base.customer, phone: "" } }).success, false);
  assert.equal(checkoutInputSchema.safeParse({ ...base, paymentMethod: "CASH_ON_DELIVERY" }).success, false);
  assert.equal(checkoutInputSchema.safeParse({ ...base, paymentMethod: "BANK_TRANSFER" }).success, false);
});

test("buy X get Y pricing discounts qualifying units without customer selection", () => {
  const result = calculateBuyXGetYPricing([
    { key: "amber", quantity: 2, unitPricePence: 4500 },
    { key: "oud", quantity: 2, unitPricePence: 3300 },
    { key: "musk", quantity: 2, unitPricePence: 4000 },
  ], 5, 1);
  assert.equal(result.qualifyingQuantity, 6);
  assert.equal(result.freeQuantity, 1);
  assert.equal(result.amountPence, 3300);
  assert.deepEqual([...result.allocations], [["oud", 3300]]);
});

test("buy X get Y pricing repeats only for complete groups", () => {
  const incomplete = calculateBuyXGetYPricing([
    { key: "amber", quantity: 5, unitPricePence: 4500 },
  ], 5, 1);
  assert.equal(incomplete.amountPence, 0);

  const repeated = calculateBuyXGetYPricing([
    { key: "amber", quantity: 6, unitPricePence: 4500 },
    { key: "oud", quantity: 6, unitPricePence: 3300 },
  ], 5, 1);
  assert.equal(repeated.freeQuantity, 2);
  assert.equal(repeated.amountPence, 6600);
});

test("five paid plus one free repeats at six, twelve and eighteen total bottles", () => {
  for (const [quantity, free] of [[0, 0], [4, 0], [5, 0], [6, 1], [7, 1], [10, 1], [11, 1], [12, 2], [18, 3]]) {
    const result = calculateBuyXGetYPricing([{ key: "amber", quantity, unitPricePence: 3400 }], 5, 1);
    assert.equal(result.freeQuantity, free, `${quantity} bottles`);
    assert.equal(result.amountPence, free * 3400);
    assert.equal([...result.freeUnits.values()].reduce((sum, count) => sum + count, 0), free);
  }
});

test("free allocations use the cheapest units and recalculate after removals", () => {
  const lines = [
    { key: "premium", quantity: 10, unitPricePence: 4500 },
    { key: "musk", quantity: 1, unitPricePence: 3000 },
    { key: "oud", quantity: 1, unitPricePence: 2500 },
  ];
  const full = calculateBuyXGetYPricing(lines, 5, 1);
  assert.deepEqual([...full.freeUnits], [["oud", 1], ["musk", 1]]);
  assert.equal(full.amountPence, 5500);
  const reduced = calculateBuyXGetYPricing(lines.filter((line) => line.key !== "oud"), 5, 1);
  assert.equal(reduced.freeQuantity, 1);
  assert.deepEqual([...reduced.freeUnits], [["musk", 1]]);
  assert.equal(reduced.amountPence, 3000);
  assert.equal(lines[0].key, "premium");
});

test("equal-price items receive a deterministic allocation regardless of cart order", () => {
  const lines = [{ key: "b", quantity: 3, unitPricePence: 3000 }, { key: "a", quantity: 3, unitPricePence: 3000 }];
  assert.deepEqual([...calculateBuyXGetYPricing(lines, 5, 1).freeUnits], [["a", 1]]);
  assert.deepEqual([...calculateBuyXGetYPricing([...lines].reverse(), 5, 1).freeUnits], [["a", 1]]);
});

test("other offers include the free quantity in their group size", () => {
  assert.equal(calculateBuyXGetYPricing([{ key: "a", quantity: 4, unitPricePence: 2000 }], 3, 2).freeQuantity, 0);
  assert.equal(calculateBuyXGetYPricing([{ key: "a", quantity: 5, unitPricePence: 2000 }], 3, 2).freeQuantity, 2);
  assert.equal(calculateBuyXGetYPricing([{ key: "a", quantity: 10, unitPricePence: 2000 }], 3, 2).freeQuantity, 4);
});

test("progress remains useful after earning an offer and after reducing the cart", () => {
  assert.deepEqual(getSaleProgress(5, 5, 1), { groupQuantity: 6, qualifyingQuantity: 5, freeQuantity: 0, remainingQuantity: 1, progressQuantity: 5 });
  assert.deepEqual(getSaleProgress(6, 5, 1), { groupQuantity: 6, qualifyingQuantity: 6, freeQuantity: 1, remainingQuantity: 6, progressQuantity: 6 });
  assert.equal(getSaleProgress(7, 5, 1).remainingQuantity, 5);
  assert.equal(getSaleProgress(11, 5, 1).remainingQuantity, 1);
  assert.equal(getSaleProgress(12, 5, 1).freeQuantity, 2);
});

test("cart pricing needs no delivery address and retains cart limits", () => {
  assert.equal(cartPricingInputSchema.safeParse({ items: [{ slug: "amber", quantity: 6 }] }).success, true);
  assert.equal(cartPricingInputSchema.safeParse({ items: [{ slug: "amber", quantity: 100 }] }).success, false);
  assert.equal(cartPricingInputSchema.safeParse({ items: Array.from({ length: 51 }, (_, index) => ({ slug: `product-${index}`, quantity: 1 })) }).success, false);
  assert.equal(quoteInputSchema.safeParse({ items: [{ slug: "amber", quantity: 6 }] }).success, false);
});

test("sale copy explains paid bottles, total bottles and repetition", () => {
  const page = defaultSalePageConfiguration("Buy 5 Get 1 Free", 5, 1);
  assert.match(page.hero.intro, /Choose 6 eligible fragrances and pay for 5/);
  assert.match(page.hero.intro, /lowest-priced bottle/);
  assert.deepEqual(page.hero.highlights.slice(0, 2), ["5 paid + 1 free", "Repeats every 6 bottles"]);
});
