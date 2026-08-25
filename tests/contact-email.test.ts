import assert from "node:assert/strict";
import test from "node:test";
import { buildContactEmail, escapeEmailHtml } from "../lib/contact/email";

test("contact email HTML escapes submitted customer content", () => {
  const email = buildContactEmail({
    name: '<img src=x onerror="alert(1)">',
    email: "customer@example.com",
    phone: "+44 1234 567890",
    topic: "Order support",
    message: "Hello <script>alert('x')</script>\nPlease help.",
  });

  assert.equal(email.html.includes("<script>"), false);
  assert.match(email.html, /&lt;script&gt;/);
  assert.match(email.html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(email.text, /customer@example\.com/);
});

test("contact email subjects cannot inject additional headers", () => {
  const email = buildContactEmail({
    name: "Customer",
    email: "customer@example.com",
    topic: "Order support\r\nBcc: attacker@example.com",
    message: "I need some assistance with my recent order.",
  });

  assert.equal(email.subject.includes("\r"), false);
  assert.equal(email.subject.includes("\n"), false);
});

test("email HTML escaping covers the reserved characters", () => {
  assert.equal(
    escapeEmailHtml(`<tag attr="value">Tom & Jerry's</tag>`),
    "&lt;tag attr=&quot;value&quot;&gt;Tom &amp; Jerry&#039;s&lt;/tag&gt;",
  );
});
