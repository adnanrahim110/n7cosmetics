import assert from "node:assert/strict";
import test from "node:test";
import { destinationFromHref, isAllowedDestinationHref } from "../lib/admin/destination";

test("internal and intentional custom destinations are accepted", () => {
  assert.equal(isAllowedDestinationHref("/products/devoir-elixer"), true);
  assert.equal(isAllowedDestinationHref("#newsletter"), true);
  assert.equal(isAllowedDestinationHref("mailto:hello@n7cosmetics.co.uk"), true);
  assert.equal(isAllowedDestinationHref("tel:+441234567890"), true);
  assert.equal(isAllowedDestinationHref("https://example.com/page"), true);
  assert.equal(isAllowedDestinationHref("//example.com/page"), false);
  assert.equal(isAllowedDestinationHref("javascript:alert(1)"), false);
  assert.equal(isAllowedDestinationHref("not-a-route"), false);
});

test("saved destinations resolve to readable selector values", () => {
  assert.deepEqual(destinationFromHref("/recreations"), {
    label: "Recreations",
    href: "/recreations",
    kind: "page",
    description: "Collection page",
  });
  assert.equal(destinationFromHref("/products/devoir-elixer").label, "Devoir Elixer");
  assert.equal(destinationFromHref("/products/devoir-elixer").kind, "product");
});
