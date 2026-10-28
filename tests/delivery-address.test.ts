import assert from "node:assert/strict";
import test from "node:test";
import { walletCheckoutInput } from "../lib/commerce/wallet-checkout";
import { walletCheckoutDetails } from "../lib/commerce/saved-checkout";
import { checkoutInputSchema } from "../lib/commerce/validation";
import { deliveryReviewInputSchema, deliveryReviewRequired } from "../lib/commerce/delivery-review";
import { stripeConfirmationDetails } from "../lib/payments/confirmation-details";
import { orderUpdateSchema } from "../lib/admin/order-status";
import { shippingAddressEditError } from "../lib/admin/order-address";
import { orderEmail } from "../lib/email/templates";
import type { CheckoutQuote } from "../lib/commerce/quote";

const quote: CheckoutQuote = {
  lines: [], subtotalPence: 5000, discountPence: 0, freeQuantity: 0, totalPence: 5500, currency: "GBP", discount: null,
  shippingPence: 500, taxPence: 0, shippingEstimated: false, shippingMethods: [],
  shippingMethod: { id: "1", name: "Standard", zoneId: "1", zoneName: "UK", basePricePence: 500, pricePence: 500, estimatedDaysMin: 2, estimatedDaysMax: 4, adjustment: null },
};
const wallet = {
  billingDetails: { name: "Wallet Cardholder", email: "wallet@example.com", phone: "02079460000", address: { line1: "1 Billing Road", line2: null, city: "London", state: "", postal_code: "SW1A 1AA", country: "GB" } },
  shippingAddress: { name: "Delivery Recipient", address: { line1: "9 Wallet Street", line2: "Flat 4", city: "London", state: "", postal_code: "SW1A 2AA", country: "GB" } },
};
const payload = walletCheckoutInput(wallet, quote, [{ slug: "selected-fragrance", quantity: 2 }], { marketingOptOut: true });

test("both wallet purchases keep their supplied address for the post-payment review", () => {
  for (const name of ["Apple Pay recipient", "Google Pay recipient"]) {
    const input = walletCheckoutInput({ ...wallet, shippingAddress: { ...wallet.shippingAddress, name } }, quote, payload.items, {});
    assert.equal(input.deliveryAddressConfirmed, false);
    assert.equal(input.shippingAddress.fullName, name);
    assert.equal(input.shippingAddress.line1, "9 Wallet Street");
    assert.equal(input.billingAddress.line1, "1 Billing Road");
    assert.equal(input.customer.email, "wallet@example.com");
    assert.deepEqual(input.items, [{ slug: "selected-fragrance", quantity: 2 }]);
    const stripe = stripeConfirmationDetails(input, wallet.billingDetails);
    assert.equal(stripe.shipping.address.line1, "9 Wallet Street");
    assert.equal(stripe.payment_method_data.billing_details.address.line1, "1 Billing Road");
    const saved = walletCheckoutDetails(input);
    assert.equal(saved.shippingAddress.line1, "9 Wallet Street");
    assert.equal("deliveryAddressConfirmed" in saved, false, "Saved browser details cannot confirm a future order");
  }
});

test("card and wallet orders declare their different delivery confirmation state", () => {
  const input = { ...payload, idempotencyKey: "12345678-1234-4234-8234-123456789abc" };
  assert.equal(checkoutInputSchema.safeParse(input).success, true);
  assert.equal(checkoutInputSchema.safeParse({ ...input, deliveryAddressConfirmed: true }).success, true);
  assert.equal(checkoutInputSchema.safeParse({ ...input, deliveryAddressConfirmed: undefined }).success, false);
  assert.throws(() => walletCheckoutInput({ ...wallet, shippingAddress: undefined }, quote, payload.items, {}));
  assert.throws(() => walletCheckoutInput({ ...wallet, shippingAddress: { ...wallet.shippingAddress, address: { ...wallet.shippingAddress.address, country: "US" } } }, quote, payload.items, {}));
});

test("customer address review requires a guest key, valid UK address and revision", () => {
  const input = { key: "12345678-1234-4234-8234-123456789abc", address: payload.shippingAddress, revision: 0 };
  assert.equal(deliveryReviewInputSchema.safeParse(input).success, true);
  for (const changed of [{ ...input, key: "invalid" }, { ...input, revision: -1 }, { ...input, address: { ...input.address, postalCode: "bad" } }, { ...input, address: { ...input.address, countryCode: "US" } }, { ...input, address: { ...input.address, phone: "" } }]) assert.equal(deliveryReviewInputSchema.safeParse(changed).success, false);
});

test("staff corrections and dispatch still enforce order state and destination review", () => {
  const order = { source: "LIVE", status: "PROCESSING", payment_status: "PAID", fulfillment_status: "UNFULFILLED", tracking_reference: null };
  assert.equal(shippingAddressEditError(order), null);
  for (const changed of [{ ...order, payment_status: "PENDING" }, { ...order, status: "SHIPPED" }, { ...order, status: "CANCELLED" }, { ...order, fulfillment_status: "PARTIAL" }, { ...order, tracking_reference: "VU123GB" }]) assert.ok(shippingAddressEditError(changed));
  const tracking = { kind: "tracking", postageService: "Tracked 48", trackingReference: "VU123GB", addressRevision: 0, addressConfirmed: true };
  assert.equal(orderUpdateSchema.safeParse(tracking).success, true);
  assert.equal(orderUpdateSchema.safeParse({ ...tracking, addressConfirmed: false }).success, false);
});

test("pending wallet receipts link back to review and confirmed corrections show the new address", () => {
  const data = { number: "N7-1", name: "Alex", email: "wallet@example.com", currency: "GBP", status: "CONFIRMED", paymentStatus: "PAID", fulfillmentStatus: "UNFULFILLED", paymentMethod: "STRIPE", subtotal: 5000, discount: 0, shipping: 500, tax: 0, total: 5500, address: "12 Corrected Street\nSW1A 1AA", items: [] };
  const pending = orderEmail({ appUrl: "https://example.com" }, { ...data, addressReviewRequired: true, addressReviewUrl: "https://example.com/checkout/confirmation?key=test" }, "confirmation");
  assert.match(pending.text, /cannot be dispatched yet/);
  assert.match(pending.html, /confirmation\?key=test/);
  const confirmed = orderEmail({ appUrl: "https://example.com" }, data, "address");
  assert.match(confirmed.subject, /Delivery address updated/);
  assert.match(confirmed.text, /12 Corrected Street/);
  assert.doesNotMatch(confirmed.text, /cannot be dispatched|has been dispatched/);
});

test("cancelled, refunded and completed orders do not ask customers for delivery review", () => {
  const order = { delivery_address_review_required: 1, status: "CONFIRMED", payment_status: "PAID", fulfillment_status: "UNFULFILLED", tracking_reference: null };
  assert.equal(deliveryReviewRequired(order), true);
  for (const change of [{ ...order, status: "CANCELLED" }, { ...order, payment_status: "REFUNDED" }, { ...order, status: "COMPLETED" }, { ...order, fulfillment_status: "FULFILLED" }, { ...order, delivery_address_review_required: 0 }]) assert.equal(deliveryReviewRequired(change), false);
});
