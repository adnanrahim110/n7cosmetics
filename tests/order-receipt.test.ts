import assert from "node:assert/strict";
import test from "node:test";
import type Stripe from "stripe";
import { stripeReceiptPayment, paymentProviderLabel } from "../lib/payments/receipt-details";
import { receiptSummary } from "../lib/admin/order-receipt-summary";
import { productNameWithCode } from "../lib/commerce/product-label";
import { renderOrderReceipt } from "../lib/admin/order-receipt-pdf";
import type { OrderReceiptData } from "../lib/admin/order-receipt-data";

const order = { id: "123", reference: "pi_receipt", total: 5000, currency: "GBP", mode: "test" as const };
const intent = {
  id: "pi_receipt", metadata: { n7_order_id: "123" }, amount: 5000, amount_received: 5000, currency: "gbp", livemode: false,
  latest_charge: { id: "ch_receipt", payment_intent: "pi_receipt", paid: true, captured: true, status: "succeeded", created: 1780000000, amount_refunded: 1500,
    payment_method_details: { card: { brand: "mastercard", last4: "4444", wallet: { type: "apple_pay" }, fingerprint: "private-fingerprint" } },
  }, client_secret: "never-include-this",
} as unknown as Stripe.PaymentIntent;

test("receipt uses only verified charge details and masks the card", () => {
  const payment = stripeReceiptPayment(intent, order)!;
  assert.equal(payment.method, "Mastercard •••• 4444 (Apple Pay)");
  assert.equal(payment.amountPaid, 5000);
  assert.equal(payment.amountRefunded, 1500);
  assert.equal(payment.reference, "ch_receipt");
  assert.equal(payment.testMode, true);
  assert.doesNotMatch(JSON.stringify(payment), /private-fingerprint|never-include-this|client_secret/);
});

test("receipt rejects mismatched orders, money, accounts and unsuccessful charges", () => {
  for (const changes of [{ id: "124" }, { reference: "pi_other" }, { total: 1 }, { currency: "USD" }, { mode: "live" as const }]) {
    assert.equal(stripeReceiptPayment(intent, { ...order, ...changes }), null);
  }
  assert.equal(stripeReceiptPayment({ ...intent, latest_charge: "ch_not_expanded" }, order), null);
  const charge = intent.latest_charge as Stripe.Charge;
  for (const changes of [{ paid: false }, { captured: false }, { status: "failed" as const }, { payment_intent: "pi_other" }]) {
    assert.equal(stripeReceiptPayment({ ...intent, latest_charge: { ...charge, ...changes } }, order), null);
  }
});

test("receipt handles Visa, missing card details, and non-card providers", () => {
  const charge = structuredClone(intent.latest_charge) as Stripe.Charge;
  charge.payment_method_details!.card!.brand = "visa";
  charge.payment_method_details!.card!.last4 = "4242";
  charge.payment_method_details!.card!.wallet = null;
  assert.equal(stripeReceiptPayment({ ...intent, latest_charge: charge }, order)?.method, "Visa •••• 4242");
  charge.payment_method_details!.card!.last4 = "4242424242424242";
  assert.equal(stripeReceiptPayment({ ...intent, latest_charge: charge }, order)?.method, "Visa");
  delete charge.payment_method_details!.card;
  assert.equal(stripeReceiptPayment({ ...intent, latest_charge: charge }, order)?.method, "Card");
  assert.equal(paymentProviderLabel("BANK_TRANSFER"), "Bank transfer");
  assert.equal(paymentProviderLabel(null), "Not recorded");
});

test("pending and failed orders never read as paid, and refunds show net payment", () => {
  for (const status of ["PENDING", "UNPAID", "FAILED"]) {
    const summary = receiptSummary(status, 5000, 0, null);
    assert.equal(summary.title, "ORDER SUMMARY");
    assert.equal(summary.paid, 0);
    assert.equal(summary.balance, 5000);
    assert.match(summary.note!, /not proof of payment/);
  }
  const partial = receiptSummary("PAID", 5000, 1500, 5000);
  assert.equal(partial.status, "PARTIALLY_REFUNDED");
  assert.equal(partial.netPaid, 3500);
  assert.equal(partial.balance, 0);
  const full = receiptSummary("REFUNDED", 5000, 5000, null);
  assert.equal(full.netPaid, 0);
  assert.equal(full.balance, 0);
  assert.equal(receiptSummary("PENDING", 5000, 0, 5000).status, "PAID", "A verified payment can arrive before the webhook updates the order.");
  assert.equal(receiptSummary("FAILED", 5000, 0, null, "CANCELLED").balance, 0, "Cancelled orders must not request payment.");
});

test("product labels prefer N7 codes with a SKU fallback for missing codes", () => {
  assert.equal(productNameWithCode("Aventus", " 253 ", "INTERNAL-SKU"), "253 - Aventus");
  assert.equal(productNameWithCode("Aventus", "", "N7-SKU"), "N7-SKU - Aventus");
  assert.equal(productNameWithCode("Historical product", null, ""), "Historical product");
});

test("PDF receipts render with empty imported items and long multi-page orders", async () => {
  const data = {
    order: { order_number: "N7-TEST", status: "CONFIRMED", payment_status: "PAID", currency: "GBP", customer_name: "Zoë Martin", customer_email: "zoe@example.com", placed_at: new Date("2026-09-30T09:00:00Z"), subtotal_pence: 5000, discount_pence: 0, shipping_pence: 0, tax_pence: 0, total_pence: 5000 },
    addresses: [], items: [], brand: { appUrl: "https://n7.example.com" }, payment: stripeReceiptPayment(intent, order)!, refundedPence: 1500,
  } as unknown as OrderReceiptData;
  for (const count of [0, 80]) {
    data.items = Array.from({ length: count }, (_, i) => ({ id: String(i), product_name: "A very long fragrance name ".repeat(8), product_code: `N7-${i}`, sku: "SKU", variant_title: "100 ml", quantity: 2, unit_price_pence: 2500, discount_pence: 500, line_total_pence: 4500, image_url: null })) as OrderReceiptData["items"];
    const bytes = await renderOrderReceipt(data);
    assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
    assert.ok(bytes.length > 1000);
    const pageCount = Buffer.from(bytes).toString("latin1").match(/\/Type \/Page\b/g)?.length || 0;
    if (count === 0) assert.equal(pageCount, 1, "The footer must not create blank pages.");
    else assert.ok(pageCount > 1, "Long orders must continue on additional pages.");
  }
});
