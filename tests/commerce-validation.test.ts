import assert from "node:assert/strict";
import test from "node:test";
import { checkoutInputSchema, quoteInputSchema } from "../lib/commerce/validation";

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
