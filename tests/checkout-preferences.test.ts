import assert from "node:assert/strict";
import test from "node:test";
import { clearSavedCheckoutDetails, emptyCheckoutAddress, loadSavedCheckoutDetails, SAVED_CHECKOUT_KEY, saveCheckoutDetails, walletCheckoutDetails, type SavedCheckoutDetails } from "../lib/commerce/saved-checkout";
import { newsletterEmail } from "../lib/email/templates";

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

test("checkout marketing welcome explains the source without claiming explicit confirmation", () => {
  const link = "https://n7.example.com/newsletter/unsubscribe?token=test";
  const email = newsletterEmail({ appUrl: "https://n7.example.com" }, "checkout", link);
  assert.match(email.text, /during checkout/);
  assert.match(email.text, /did not opt out/);
  assert.doesNotMatch(email.text, /confirmed|asked to receive/);
  assert.ok(email.text.includes(link));
  assert.ok(email.html.includes(link));
});
