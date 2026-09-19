import assert from "node:assert/strict";
import test from "node:test";
import { emailPreviews } from "../lib/email/previews";
import { orderEmail, passwordResetEmail, type OrderEmailData } from "../lib/email/templates";
import { emailUrl } from "../lib/email/layout";
import { newsletterTokenHash, newsletterTokenValid } from "../lib/email/newsletter";
import { MAX_EMAIL_ATTEMPTS, retryDelaySeconds } from "../lib/email/queue";
import { smtpTransportOptions } from "../lib/email/service";

const brand = { appUrl: "https://n7.example.com", contactEmail: "care@n7.example.com" };
const order: OrderEmailData = { number: "N7-TEST", name: "Alex <script>alert(1)</script>", email: "alex@example.com", currency: "GBP", status: "NEW", paymentStatus: "UNPAID", fulfillmentStatus: "UNFULFILLED", paymentMethod: "BANK_TRANSFER", subtotal: 10000, discount: 1000, shipping: 500, tax: 0, total: 9500, address: '12 Test Road\n<svg onload="alert(1)">', bankInstructions: "Test bank instructions", items: [{ name: 'Oud <img src=x onerror="alert(1)">', variant: "100 ml", quantity: 2, unitPrice: 5000, total: 9000 }] };

test("all transactional and subscription templates have complete HTML and plain text", () => {
  const previews = emailPreviews(brand);
  assert.equal(previews.length, 9);
  for (const { email } of previews) {
    assert.match(email.html, /^<!doctype html>/);
    assert.match(email.html, /<html lang="en">/);
    assert.match(email.html, /#967c55/);
    assert.match(email.html, /#f7f2e9/);
    assert.match(email.html, /<\/html>$/);
    assert.ok(email.text.length > 80);
    assert.doesNotMatch(email.subject, /[\r\n]/);
    assert.doesNotMatch(email.html, /<script|<form|javascript:/i);
  }
});

test("order emails escape customer and product content and include the saved financial breakdown", () => {
  const email = orderEmail(brand, order, "confirmation");
  assert.doesNotMatch(email.html, /<script|<svg|<img/i);
  assert.match(email.html, /&lt;script&gt;/);
  for (const value of ["£100.00", "£10.00", "£5.00", "£95.00", "Test bank instructions", "N7-TEST", "2 × £50.00"]) assert.ok(email.text.includes(value));
  assert.doesNotMatch(email.text, /recorded as paid|Track delivery/);
});

test("cancelled orders never request payment and paid orders omit bank instructions", () => {
  assert.doesNotMatch(orderEmail(brand, { ...order, status: "CANCELLED" }, "update").text, /Test bank instructions|payable on delivery/);
  const paid = orderEmail(brand, { ...order, paymentStatus: "PAID" }, "update");
  assert.match(paid.text, /recorded as paid/);
  assert.doesNotMatch(paid.text, /Test bank instructions/);
});

test("only HTTP(S) destinations can be inserted into email buttons", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,secret", "file:///private"]) assert.throws(() => emailUrl(url));
  assert.match(emailUrl('https://example.com/?a=1&b="2"'), /&amp;/);
  assert.throws(() => passwordResetEmail(brand, "Alex", "javascript:alert(1)"));
});

test("newsletter tokens are high-entropy opaque values stored as hashes", () => {
  const token = "a".repeat(43);
  assert.equal(newsletterTokenValid(token), true);
  assert.equal(newsletterTokenValid("preview"), false);
  assert.equal(newsletterTokenValid("a".repeat(44)), false);
  assert.equal(newsletterTokenHash(token).length, 64);
  assert.notEqual(newsletterTokenHash(token), token);
});

test("SMTP uses TLS and does not allow fetching email content from files or URLs", () => {
  const settings = { host: "smtp.gmail.com", port: 465, secure: true, user: "test@example.com", password: "not-a-real-password", fromName: "N7", fromEmail: "test@example.com" };
  assert.equal(smtpTransportOptions(settings).secure, true);
  const starttls = smtpTransportOptions({ ...settings, port: 587, secure: false });
  assert.equal(starttls.requireTLS, true);
  assert.equal(starttls.disableFileAccess, true);
  assert.equal(starttls.disableUrlAccess, true);
});

test("retries are bounded and increase the delay after repeated failures", () => {
  assert.equal(MAX_EMAIL_ATTEMPTS, 5);
  assert.deepEqual([1, 2, 3, 4, 5].map(retryDelaySeconds), [60, 300, 1500, 3600, 3600]);
});
