import assert from "node:assert/strict";
import test from "node:test";
import { clearSavedCheckoutDetails, emptyCheckoutAddress, loadSavedCheckoutDetails, SAVED_CHECKOUT_KEY, saveCheckoutDetails, walletCheckoutDetails, type SavedCheckoutDetails } from "../lib/commerce/saved-checkout";
import { newsletterEmail } from "../lib/email/templates";
import { readCheckoutAttempt } from "../lib/payments/checkout-attempt";
import { checkoutInternationalPhone, checkoutPhoneNumber } from "../lib/commerce/checkout-phone";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

function savedDetails(): SavedCheckoutDetails {
  const billingAddress = { ...emptyCheckoutAddress(), firstName: "Alex", lastName: "Test", line1: "1 Test Road", city: "London", postalCode: "SW1A 1AA", phone: "02079460000" };
  return { version: 1, email: "alex@example.com", billingAddress, shippingAddress: { ...billingAddress, firstName: "Sam", line1: "2 Delivery Road" }, differentShipping: true };
}

test("saved details restore separate addresses and can be forgotten without clearing the cart", () => {
  const storage = memoryStorage();
  const details = savedDetails();
  storage.setItem("n7-cart-v1", "cart stays");
  assert.equal(loadSavedCheckoutDetails(storage), null);
  assert.equal(saveCheckoutDetails(storage, details), true);
  assert.deepEqual(loadSavedCheckoutDetails(storage), details);
  assert.equal(clearSavedCheckoutDetails(storage), true);
  assert.equal(loadSavedCheckoutDetails(storage), null);
  assert.equal(storage.getItem("n7-cart-v1"), "cart stays");
});

test("saving only keeps contact/address fields and drops unused delivery addresses", () => {
  const storage = memoryStorage();
  const details = { ...savedDetails(), differentShipping: false, marketingOptOut: false, notes: "private note", cardNumber: "4242424242424242", clientSecret: "payment-secret" };
  details.billingAddress = { ...details.billingAddress, ...{ cardNumber: "4242424242424242" } };
  assert.equal(saveCheckoutDetails(storage, details), true);
  const raw = storage.getItem(SAVED_CHECKOUT_KEY)!;
  assert.doesNotMatch(raw, /marketingOptOut|notes|cardNumber|clientSecret|payment-secret|Delivery Road/);
  assert.deepEqual(loadSavedCheckoutDetails(storage)?.shippingAddress, savedDetails().billingAddress);
});

test("malformed, unsupported and invalid saved data cannot prefill checkout", () => {
  const storage = memoryStorage();
  for (const raw of ["broken json", "null", "[]", JSON.stringify({ ...savedDetails(), version: 2 }), JSON.stringify({ ...savedDetails(), email: "bad-email" }), JSON.stringify({ ...savedDetails(), billingAddress: { ...savedDetails().billingAddress, countryCode: "US" } })]) {
    storage.setItem(SAVED_CHECKOUT_KEY, raw);
    assert.equal(loadSavedCheckoutDetails(storage), null);
    assert.equal(storage.getItem(SAVED_CHECKOUT_KEY), null);
  }
});

test("blocked storage and quota failures do not throw or prevent checkout", () => {
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => { throw new Error("blocked"); } };
  assert.equal(loadSavedCheckoutDetails(blocked), null);
  assert.equal(saveCheckoutDetails(blocked, savedDetails()), false);
  assert.equal(clearSavedCheckoutDetails(blocked), false);
});

test("wallet details use the wallet's actual contact and delivery addresses", () => {
  const address = { fullName: "Alex van Test", line1: "1 Test Road", city: "London", postalCode: "SW1A 1AA", countryCode: "GB" as const, phone: "02079460000" };
  const input = { items: [{ slug: "amber", quantity: 1 }], countryCode: "GB" as const, expectedTotalPence: 5000, customer: { name: address.fullName, email: "wallet@example.com", phone: address.phone }, billingAddress: address, shippingAddress: { ...address, fullName: "Sam Recipient", line1: "2 Delivery Road" }, paymentMethod: "STRIPE" as const, marketingOptOut: true };
  const result = walletCheckoutDetails(input);
  assert.equal(result.email, "wallet@example.com");
  assert.equal(result.billingAddress.lastName, "van Test");
  assert.equal(result.shippingAddress.line1, "2 Delivery Road");
  assert.equal(result.differentShipping, true);
  assert.equal(walletCheckoutDetails({ ...input, shippingAddress: address }).differentShipping, false);
  assert.equal("marketingOptOut" in result, false);
});

const paymentAttempt = {
  key: "12345678-1234-4234-8234-123456789abc",
  fingerprint: "a".repeat(64),
};

test("existing cart payments keep their original cart-clearing behavior", () => {
  assert.deepEqual(readCheckoutAttempt(JSON.stringify(paymentAttempt)), {
    ...paymentAttempt,
    preserveCart: false,
    returnPath: "/checkout",
  });
});

test("product wallet payments preserve the cart and can retry on the product page", () => {
  const attempt = { ...paymentAttempt, preserveCart: true, returnPath: "/products/infinity-oud" };
  assert.deepEqual(readCheckoutAttempt(JSON.stringify(attempt)), attempt);
});

test("a cart payment cannot take a product-only retry path", () => {
  const attempt = readCheckoutAttempt(JSON.stringify({
    ...paymentAttempt,
    preserveCart: false,
    returnPath: "/products/infinity-oud",
  }));
  assert.equal(attempt?.preserveCart, false);
  assert.equal(attempt?.returnPath, "/checkout");
});

test("invalid payment sessions cannot be reused", () => {
  for (const value of [null, "broken json", "null", "[]", "{}",
    JSON.stringify({ ...paymentAttempt, key: "invalid-key" }),
    JSON.stringify({ ...paymentAttempt, fingerprint: "invalid-fingerprint" }),
  ]) assert.equal(readCheckoutAttempt(value), null);
});

test("product retries only allow local product or bundle paths", () => {
  for (const returnPath of ["https://example.com", "//example.com", "javascript:alert(1)", "/admin", "/products/../admin", "/products/oud?redirect=external"]) {
    const attempt = readCheckoutAttempt(JSON.stringify({ ...paymentAttempt, preserveCart: true, returnPath }));
    assert.equal(attempt?.returnPath, "/checkout");
  }
  assert.equal(readCheckoutAttempt(JSON.stringify({ ...paymentAttempt, preserveCart: true, returnPath: "/bundles/discovery-set" }))?.returnPath, "/bundles/discovery-set");
});

test("checkout marketing welcome explains the source without claiming explicit confirmation", () => {
  const link = "https://n7.example.com/newsletter/unsubscribe?token=test";
  const email = newsletterEmail({ appUrl: "https://n7.example.com" }, "checkout", link);
  assert.match(email.text, /during checkout/);
  assert.match(email.text, /did not opt out/);
  assert.doesNotMatch(email.text, /confirmed|asked to receive/);
  assert.ok(email.text.includes(link));
  assert.ok(email.html.includes(link));
});

test("checkout phone fields handle saved UK numbers without repeating the country code", () => {
  for (const value of ["07123 456789", "+44 7123 456789", "0044 7123 456789", "7123 456789"]) {
    assert.equal(checkoutPhoneNumber(value), "7123 456789");
    assert.equal(checkoutInternationalPhone(value), "+44 7123 456789");
  }
  assert.equal(checkoutInternationalPhone("020 7946 0000"), "+44 20 7946 0000");
});

test("clearing a checkout phone number leaves the required field empty", () => {
  for (const value of ["", " ", "+44", "0044", "0"]) {
    assert.equal(checkoutInternationalPhone(value), "");
  }
});
