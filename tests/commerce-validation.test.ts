import assert from "node:assert/strict";
import test from "node:test";
import { cartPricingInputSchema, checkoutInputSchema, quoteInputSchema } from "../lib/commerce/validation";
import { calculateBuyXGetYPricing, getSaleProgress } from "../lib/commerce/sale-pricing";
import { defaultSalePageConfiguration } from "../lib/storefront-pages/config";
import { checkoutAddressFromForm, checkoutCouponSchema, checkoutFieldErrors, checkoutFormSchema, readCheckoutFieldErrors, CheckoutValidationError } from "../lib/commerce/checkout-validation";

const checkoutFormFixture = {
  email: " customer@example.com ", notes: " Leave with reception ",
  billingAddress: {
    firstName: " N7 ", lastName: " Customer ", company: "", line1: " 1 Test Street ", line2: "", city: "London",
    region: "", postalCode: "sw1a 1aa", countryCode: "GB", phone: "+44 20 7946 0000",
  },
};

function checkoutServerFixture() {
  const form = checkoutFormSchema.parse(checkoutFormFixture);
  const address = checkoutAddressFromForm(form.billingAddress);
  return {
    items: [{ slug: "amber", quantity: 1 }], countryCode: "GB", expectedTotalPence: 4799,
    idempotencyKey: "1e7e8efe-9f52-4c1c-a2a0-f2dc38ecabb8", paymentMethod: "STRIPE",
    customer: { name: address.fullName, email: form.email, phone: address.phone, notes: form.notes },
    billingAddress: address, shippingAddress: address,
  };
}

test("checkout form normalizes contact details and produces a server-valid order", () => {
  const form = checkoutFormSchema.parse({ ...checkoutFormFixture, email: " Customer@Example.COM " });
  assert.equal(form.email, "customer@example.com");
  assert.equal(form.billingAddress.postalCode, "SW1A 1AA");
  assert.equal(form.notes, "Leave with reception");
  assert.equal(checkoutAddressFromForm(form.billingAddress).fullName, "N7 Customer");
  assert.equal(checkoutInputSchema.safeParse(checkoutServerFixture()).success, true);
  assert.equal(checkoutFormSchema.safeParse({ ...checkoutFormFixture, notes: "", billingAddress: { ...checkoutFormFixture.billingAddress, firstName: "Élodie", lastName: "O’Connor" } }).success, true);
});

test("client and server reject malformed email, postcode and phone with matching field errors", () => {
  const server = checkoutServerFixture();
  for (const email of ["", " customer ", "person@", "person @example.com"]) {
    const clientResult = checkoutFormSchema.safeParse({ ...checkoutFormFixture, email });
    const serverResult = checkoutInputSchema.safeParse({ ...server, customer: { ...server.customer, email } });
    assert.equal(clientResult.success, false);
    assert.equal(serverResult.success, false);
    if (!clientResult.success && !serverResult.success) assert.equal(checkoutFieldErrors(clientResult.error.issues).email, checkoutFieldErrors(serverResult.error.issues).email);
  }
  for (const [field, invalid] of [["postalCode", "SW1A"], ["postalCode", "12345"], ["phone", "-------"], ["phone", "+44 123"], ["phone", "020CALLME"], ["phone", "1234567890123456"], ["line1", "  "], ["city", " "], ["countryCode", "US"]]) {
    const clientResult = checkoutFormSchema.safeParse({ ...checkoutFormFixture, billingAddress: { ...checkoutFormFixture.billingAddress, [field]: invalid } });
    const serverResult = checkoutInputSchema.safeParse({ ...server, billingAddress: { ...server.billingAddress, [field]: invalid } });
    assert.equal(clientResult.success, false, `client ${field}: ${invalid}`);
    assert.equal(serverResult.success, false, `server ${field}: ${invalid}`);
    if (!clientResult.success && !serverResult.success) assert.deepEqual(checkoutFieldErrors(clientResult.error.issues), checkoutFieldErrors(serverResult.error.issues));
  }
});

test("different delivery addresses and optional field limits are enforced on both sides", () => {
  const server = checkoutServerFixture();
  const clientResult = checkoutFormSchema.safeParse({ ...checkoutFormFixture, shippingAddress: { ...checkoutFormFixture.billingAddress, postalCode: "" }, notes: "x".repeat(2001) });
  const serverResult = checkoutInputSchema.safeParse({ ...server, shippingAddress: { ...server.shippingAddress, postalCode: "" }, customer: { ...server.customer, notes: "x".repeat(2001) } });
  assert.equal(clientResult.success, false);
  assert.equal(serverResult.success, false);
  if (!clientResult.success && !serverResult.success) {
    assert.deepEqual(checkoutFieldErrors(clientResult.error.issues), checkoutFieldErrors(serverResult.error.issues));
    assert.equal(checkoutFieldErrors(clientResult.error.issues)["shipping.postalCode"], "Enter your postcode.");
  }
  for (const [field, limit] of [["company", 190], ["line2", 190], ["region", 120]] as const) {
    assert.equal(checkoutFormSchema.safeParse({ ...checkoutFormFixture, billingAddress: { ...checkoutFormFixture.billingAddress, [field]: "x".repeat(limit + 1) } }).success, false);
    assert.equal(checkoutInputSchema.safeParse({ ...server, billingAddress: { ...server.billingAddress, [field]: "x".repeat(limit + 1) } }).success, false);
  }
  assert.equal(checkoutFormSchema.safeParse({ ...checkoutFormFixture, billingAddress: { ...checkoutFormFixture.billingAddress, firstName: " " } }).success, false);
  assert.equal(checkoutInputSchema.safeParse({ ...server, billingAddress: { ...server.billingAddress, fullName: " " } }).success, false);
});

test("discount codes normalize consistently and reject unsupported characters", () => {
  assert.equal(checkoutCouponSchema.parse(" save-10_n7 "), "SAVE-10_N7");
  for (const code of ["", " ", "SAVE 10", "SAVE!", "x".repeat(81)]) {
    assert.equal(checkoutCouponSchema.safeParse(code).success, false);
    assert.equal(cartPricingInputSchema.safeParse({ items: [{ slug: "amber", quantity: 1 }], couponCode: code }).success, false);
  }
});

test("server field feedback is restricted to known checkout fields", () => {
  assert.deepEqual(readCheckoutFieldErrors({ email: "Check your email.", unknown: "Ignore this", "billing.phone": "x".repeat(300) }), { email: "Check your email.", "billing.phone": "x".repeat(240) });
  assert.deepEqual(readCheckoutFieldErrors({ email: { invalid: true } }), {});
  const error = new CheckoutValidationError("Check your details.", { "shipping.postalCode": "Enter your postcode.", paymentMethod: "Ignore this" });
  assert.equal(error.message, "Check your details.");
  assert.deepEqual(error.fieldErrors, { "shipping.postalCode": "Enter your postcode." });
});

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
  assert.equal(checkoutInputSchema.parse(base).marketingOptOut, undefined);
  assert.equal(checkoutInputSchema.parse({ ...base, marketingOptOut: false }).marketingOptOut, false);
  assert.equal(checkoutInputSchema.parse({ ...base, marketingOptOut: true }).marketingOptOut, true);
  for (const invalid of ["false", "true", 0, 1, null]) {
    assert.equal(checkoutInputSchema.safeParse({ ...base, marketingOptOut: invalid }).success, false);
  }
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
