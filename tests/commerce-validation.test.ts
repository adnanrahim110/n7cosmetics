import assert from "node:assert/strict";
import test from "node:test";
import { checkoutInputSchema, quoteInputSchema } from "../lib/commerce/validation";
import { calculateBuyXGetYPricing } from "../lib/commerce/sale-pricing";

test("quote input rejects duplicate lines and excessive quantities", () => {
  assert.equal(quoteInputSchema.safeParse({ items: [{ slug: "amber", quantity: 1 }, { slug: "amber", quantity: 2 }], countryCode: "GB" }).success, false);
  assert.equal(quoteInputSchema.safeParse({ items: [{ slug: "amber", quantity: 100 }], countryCode: "GB" }).success, false);
});

test("checkout requires matching delivery country and valid idempotency", () => {
  const base = {
    items: [{ slug: "amber", quantity: 1 }], countryCode: "GB", idempotencyKey: "1e7e8efe-9f52-4c1c-a2a0-f2dc38ecabb8",
    customer: { name: "N7 Customer", email: "customer@example.com" },
    shippingAddress: { fullName: "N7 Customer", line1: "1 Test Street", city: "London", postalCode: "SW1A 1AA", countryCode: "GB" },
    paymentMethod: "CASH_ON_DELIVERY",
  };
  assert.equal(checkoutInputSchema.safeParse(base).success, true);
  assert.equal(checkoutInputSchema.safeParse({ ...base, shippingAddress: { ...base.shippingAddress, countryCode: "US" } }).success, false);
});

test("buy X get Y pricing discounts qualifying units without customer selection", () => {
  const result = calculateBuyXGetYPricing([
    { key: "amber", quantity: 2, unitPricePence: 4500 },
    { key: "oud", quantity: 2, unitPricePence: 3300 },
    { key: "musk", quantity: 1, unitPricePence: 4000 },
  ], 5, 1);
  assert.equal(result.qualifyingQuantity, 5);
  assert.equal(result.freeQuantity, 1);
  assert.equal(result.amountPence, 3300);
  assert.deepEqual([...result.allocations], [["oud", 3300]]);
});

test("buy X get Y pricing repeats only for complete groups", () => {
  const incomplete = calculateBuyXGetYPricing([
    { key: "amber", quantity: 4, unitPricePence: 4500 },
  ], 5, 1);
  assert.equal(incomplete.amountPence, 0);

  const repeated = calculateBuyXGetYPricing([
    { key: "amber", quantity: 5, unitPricePence: 4500 },
    { key: "oud", quantity: 5, unitPricePence: 3300 },
  ], 5, 1);
  assert.equal(repeated.freeQuantity, 2);
  assert.equal(repeated.amountPence, 6600);
});
