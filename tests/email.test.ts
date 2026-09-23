import assert from "node:assert/strict";
import test from "node:test";
import { emailPreviews } from "../lib/email/previews";
import { contactEmail, contactReceiptEmail, newsletterEmail, orderEmail, passwordResetEmail, type OrderEmailData } from "../lib/email/templates";
import { emailImageUrl, emailUrl } from "../lib/email/layout";
import { newsletterTokenHash, newsletterTokenValid } from "../lib/email/newsletter";
import { MAX_EMAIL_ATTEMPTS, retryDelaySeconds } from "../lib/email/queue";
import { smtpErrorMessage, smtpTransportOptions } from "../lib/email/service";
import { legacyNotificationSettings, normalizeSmtpPassword, notificationRecipients, notificationSettingsSchema, smtpPasswordRequired, smtpSchema } from "../lib/email/settings";
import { emailCopy, emailCopyDefinition, emailCopyTemplates, readEmailCopy, splitEmailCopy, validateEmailCopy, type EmailCopyKey, type EmailCopySettings } from "../lib/email/copy";

const brand = { appUrl: "https://n7.example.com", contactEmail: "care@n7.example.com" };
const order: OrderEmailData = { number: "N7-TEST", name: "Alex <script>alert(1)</script>", email: "alex@example.com", currency: "GBP", status: "NEW", paymentStatus: "UNPAID", fulfillmentStatus: "UNFULFILLED", paymentMethod: "BANK_TRANSFER", subtotal: 10000, discount: 1000, shipping: 500, tax: 0, total: 9500, address: '12 Test Road\n<svg onload="alert(1)">', bankInstructions: "Test bank instructions", items: [{ name: 'Oud <img src=x onerror="alert(1)">', variant: "100 ml", quantity: 2, unitPrice: 5000, total: 9000 }] };

test("all transactional and subscription templates have complete HTML and plain text", () => {
  const previews = emailPreviews(brand);
  assert.equal(previews.length, 13);
  for (const { email } of previews) {
    assert.match(email.html, /^<!doctype html>/);
    assert.match(email.html, /<html lang="en">/);
    assert.match(email.html, /#c98a39/);
    assert.match(email.html, /#f7f2e9/);
    assert.match(email.html, /<\/html>$/);
    assert.match(email.html, /<img src="https:\/\/n7\.example\.com\/imgs\/logo-w\.png" alt="N7 Cosmetics"/);
    assert.ok(email.text.length > 80);
    assert.doesNotMatch(email.subject, /[\r\n]/);
    assert.doesNotMatch(email.html, /<script|<form|javascript:/i);
  }
});

test("saved wording updates both versions across all email templates", () => {
  const emailCopy: EmailCopySettings = {};
  for (const key of Object.keys(emailCopyTemplates) as EmailCopyKey[]) {
    const definition = emailCopyDefinition(key);
    emailCopy[key] = validateEmailCopy(key, Object.fromEntries(Object.entries(definition).map(([id, field]) => {
      const { literals } = splitEmailCopy(field.source);
      return [id, literals.map((part, index) => index === 0 ? `[${id}] ${part}` : part)];
    })));
  }
  const customized = { ...brand, emailCopy };
  const scenarios = ["default", "new", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded", "cash", "bankMissing", "other"];
  const previews = scenarios.flatMap((scenario) => emailPreviews(customized, scenario));
  const kinds = { "order-confirmation": "confirmation", "order-status-update": "update", "new-order-team": "team", "order-update-team": "team-update" } as const;
  for (const [key, kind] of Object.entries(kinds)) {
    // Legacy tracking without a Royal Mail service and website-only customer support.
    previews.push({ key: key as EmailCopyKey, label: key, email: orderEmail({ ...customized, contactEmail: undefined }, { ...order, trackingReference: "TRACK-123", trackingUrl: "https://example.com/track" }, kind) });
  }
  for (const key of Object.keys(emailCopyTemplates) as EmailCopyKey[]) {
    const messages = previews.filter((preview) => preview.key === key);
    for (const id of Object.keys(emailCopyDefinition(key))) {
      assert.ok(messages.some(({ email }) => email.text.includes(`[${id}]`)), `${key}.${id} should be editable in plain text`);
      assert.ok(messages.some(({ email }) => email.html.includes(`[${id}]`)), `${key}.${id} should be editable in HTML`);
    }
  }
});

test("wording edits cannot replace dynamic slots, prices, products or URLs", () => {
  const overrides = validateEmailCopy("order-confirmation", { intro: ["Hello ", ", your order ", " is safely received."], paymentPaid: ["Your payment of ", " is complete."], orderTotal: ["Total paid"], title: ["Thank you <script>alert(1)</script>"] });
  const customized = { ...brand, emailCopy: { "order-confirmation": overrides } };
  const email = orderEmail(customized, { ...order, paymentStatus: "PAID", trackingReference: "VU123GB", trackingUrl: "https://www.royalmail.com/track-your-item" }, "confirmation");
  assert.ok(email.text.includes(`Hello ${order.name}, your order ${order.number} is safely received.`));
  assert.match(email.text, /Your payment of £95\.00 is complete\./);
  assert.match(email.text, /Total paid: £95\.00/);
  assert.ok(email.text.includes(order.items[0].name));
  assert.match(email.html, /&lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /href="https:\/\/www\.royalmail\.com\/track-your-item"/);
  for (const invalid of [{ intro: ["Replace the entire introduction"] }, { total: ["£1.00"] }, { productName: ["Replacement"] }, { trackingUrl: ["https://invalid.example"] }, { intro: ["{{customerName}}", "", ""] }, { title: [" "] }, { title: ["a".repeat(161)] }, { title: ["bad\u0000text"] }, { title: [42] }]) {
    assert.throws(() => validateEmailCopy("order-confirmation", invalid));
  }
  assert.deepEqual(readEmailCopy("order-confirmation", { total: ["£1.00"] }), {});
  assert.deepEqual(validateEmailCopy("order-confirmation", { intro: splitEmailCopy(emailCopyTemplates["order-confirmation"].intro.source).literals }), {});
  assert.deepEqual(validateEmailCopy("order-confirmation", {}), {});
});

test("edited messages preserve customer content, token links and expiry values", () => {
  const customized = { ...brand, emailCopy: {
    "contact-receipt": { intro: ["Hello ", ", about ", ": your reference is ", ". Thank you!"] },
    "storefront-contact": { intro: ["A new message has arrived."] },
    "admin-password-reset": { intro: ["Hello ", ", reset your password below."], expiry: ["Link available for ", " minutes only."] },
    "newsletter-confirmation": { intro: ["Please confirm your address within ", " hours."] },
    "newsletter-welcome": { intro: ["Welcome to our fragrance updates."] },
    "newsletter-checkout": { intro: ["Thank you for joining during checkout."] },
  } };
  const receipt = contactReceiptEmail(customized, "Amal", "Order support", "N7-1234");
  assert.match(receipt.text, /Hello Amal, about order support: your reference is N7-1234/);
  const enquiry = contactEmail(customized, { name: "Amal", email: "amal@example.com", topic: "Support", message: "My original enquiry" });
  assert.match(enquiry.text, /My original enquiry/);
  assert.match(enquiry.html, /My original enquiry/);
  const reset = passwordResetEmail(customized, "Admin", `${brand.appUrl}/admin/reset-password?token=real-token`);
  assert.match(reset.text, /Link available for 30 minutes only/);
  assert.match(reset.html, /href="https:\/\/n7.example.com\/admin\/reset-password\?token=real-token"/);
  const confirm = newsletterEmail(customized, "confirm", `${brand.appUrl}/newsletter/confirm?token=real-token`);
  assert.match(confirm.text, /confirm your address within 48 hours/);
  for (const kind of ["welcome", "checkout"] as const) {
    const email = newsletterEmail(customized, kind, `${brand.appUrl}/newsletter/unsubscribe?token=unsubscribe-token`);
    assert.match(email.text, /newsletter\/unsubscribe\?token=unsubscribe-token/);
    assert.match(email.html, /href="https:\/\/n7.example.com\/newsletter\/unsubscribe\?token=unsubscribe-token"/);
    assert.ok(email.text.includes(kind === "welcome" ? "Welcome to our fragrance updates." : "Thank you for joining during checkout."));
  }
  assert.throws(() => emailCopy(customized, "contact-receipt")("intro", { customerName: "Amal" }), /Missing email detail/);
});

test("order emails escape customer and product content and include the saved financial breakdown", () => {
  const email = orderEmail(brand, order, "confirmation");
  assert.doesNotMatch(email.html, /<script|<svg/i);
  assert.equal(email.html.match(/<img\b/g)?.length, 1, "Only the header logo is rendered; injected product markup stays escaped.");
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

test("email thumbnails use absolute safe image URLs and escaped product names", () => {
  const email = orderEmail(brand, { ...order, items: [{ ...order.items[0], imageUrl: "/media/sample-product?size=64&format=png" }] }, "confirmation");
  assert.match(email.html, /src="https:\/\/n7\.example\.com\/media\/sample-product\?size=64&amp;format=png"/);
  assert.match(email.html, /alt="Oud &lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;"/);
  assert.equal(email.html.match(/<img\b/g)?.length, 2);
  assert.equal(emailImageUrl("https://images.example.com/product.png", brand.appUrl), "https://images.example.com/product.png");
  for (const imageUrl of [null, "", "javascript:alert(1)", "data:image/png;base64,test", "file:///private", "https://user:password@example.com/image.png", "https://["]) {
    assert.equal(emailImageUrl(imageUrl, brand.appUrl), null);
    const fallback = orderEmail(brand, { ...order, items: [{ ...order.items[0], imageUrl }] }, "confirmation");
    assert.equal(fallback.html.match(/<img\b/g)?.length, 1);
    assert.ok(fallback.text.includes(order.items[0].name));
  }
});

test("Royal Mail dispatch emails include escaped tracking details and the shipping destination", () => {
  const email = orderEmail(brand, { ...order, status: "SHIPPED", paymentStatus: "PAID", fulfillmentStatus: "FULFILLED", postageService: "Tracked 48 <script>", trackingReference: "VU628745615GB", trackingUrl: "https://www.royalmail.com/track-your-item" }, "update");
  assert.match(email.subject, /Order dispatched/);
  for (const label of ["Destination", "Postage service", "Tracking number", "VU628745615GB", "https://www.royalmail.com/track-your-item"]) {
    assert.ok(email.text.includes(label));
    assert.ok(email.html.includes(label));
  }
  assert.match(email.html, /Tracked 48 &lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script|<svg/);
  assert.match(email.text, /Destination: 12 Test Road/);
  assert.match(email.html, /Track on Royal Mail/);
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

test("custom SMTP accepts non-email usernames and preserves password whitespace", () => {
  const parsed = smtpSchema.parse({ provider: "hosted", host: " MAIL.EXAMPLE.COM ", port: 2525, security: "starttls", user: "smtp-account", password: "  secret with spaces  ", fromName: "N7", fromEmail: "CARE@EXAMPLE.COM" });
  assert.equal(parsed.host, "mail.example.com");
  assert.equal(parsed.fromEmail, "care@example.com");
  assert.equal(normalizeSmtpPassword(parsed.host, parsed.password), "  secret with spaces  ");
  assert.equal(normalizeSmtpPassword("smtp.gmail.com", "abcd efgh ijkl mnop"), "abcdefghijklmnop");
  assert.equal(smtpSchema.safeParse({ ...parsed, host: "https://webmail.example.com/login" }).success, false);
  assert.equal(smtpSchema.safeParse({ ...parsed, host: "mail.example.com:465" }).success, false);
  assert.equal(smtpSchema.safeParse({ ...parsed, fromName: "N7\r\nBcc: other@example.com" }).success, false);
  assert.equal(smtpSchema.safeParse({ ...parsed, port: 465 }).success, false);
  assert.equal(smtpSchema.safeParse({ ...parsed, port: 587, security: "tls" }).success, false);
});

test("saved passwords are retained only for the same SMTP server and username", () => {
  const saved = { host: "smtp.gmail.com", user: "owner@example.com", hasPassword: true };
  assert.equal(smtpPasswordRequired({ host: "SMTP.GMAIL.COM", user: saved.user }, saved), false);
  assert.equal(smtpPasswordRequired({ host: "mail.example.com", user: saved.user }, saved), true);
  assert.equal(smtpPasswordRequired({ host: saved.host, user: "different@example.com" }, saved), true);
  assert.equal(smtpPasswordRequired(saved, { ...saved, hasPassword: false }), true);
  assert.doesNotMatch(smtpErrorMessage(new Error("Failed using secret-value"), "secret-value"), /secret-value/);
});

test("notification lists normalise and deduplicate addresses and enforce recipient requirements", () => {
  const settings = legacyNotificationSettings("store@example.com");
  const parsed = notificationSettingsSchema.parse({ ...settings, defaultRecipients: ["TEAM@example.com", " team@example.com ", "ops@example.com"] });
  assert.deepEqual(notificationRecipients(parsed, "new_order"), ["team@example.com", "ops@example.com"]);
  assert.equal(notificationSettingsSchema.safeParse({ ...settings, defaultRecipients: ["bad address"] }).success, false);
  assert.equal(notificationSettingsSchema.safeParse({ ...settings, defaultRecipients: ["a@example.com\r\nBcc:b@example.com"] }).success, false);
  assert.equal(notificationSettingsSchema.safeParse({ ...settings, defaultRecipients: Array.from({ length: 11 }, (_, i) => `team${i}@example.com`) }).success, false);
  assert.equal(notificationSettingsSchema.safeParse({ ...settings, defaultRecipients: [] }).success, false);
  settings.routes.new_order = { enabled: true, useDefault: false, recipients: [] };
  assert.equal(notificationSettingsSchema.safeParse(settings).success, false);
  assert.equal(notificationSettingsSchema.safeParse(legacyNotificationSettings()).success, true);
});

test("legacy recipients are preserved while category overrides and disabled alerts remain separate", () => {
  const settings = legacyNotificationSettings("contact@example.com", "orders@example.com");
  assert.deepEqual(notificationRecipients(settings, "new_order"), ["orders@example.com"]);
  assert.deepEqual(notificationRecipients(settings, "enquiry"), ["contact@example.com"]);
  for (const type of ["order_update", "payment_failure", "low_stock"] as const) assert.deepEqual(notificationRecipients(settings, type), []);
  settings.routes.new_order.enabled = false;
  assert.deepEqual(notificationRecipients(settings, "new_order"), []);
  const email = orderEmail(brand, order, "team-update");
  assert.match(email.text, /has been updated/);
  assert.match(email.html, /Open orders in admin/);
  assert.doesNotMatch(email.subject, /New N7 order/);
});
