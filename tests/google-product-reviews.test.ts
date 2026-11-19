import assert from "node:assert/strict";
import test from "node:test";
import { hasCustomerReviewOrigin, confirmReviewOriginSchema } from "../lib/google-product-reviews/provenance";
import { productReviewFeedXml, validReviewXmlText, type ProductReviewFeedItem } from "../lib/google-product-reviews/xml";
import { productReviewFeedResponse } from "../lib/google-product-reviews/feed";
import type { ProductReviewFeedSnapshot } from "../lib/google-product-reviews/data";

const item: ProductReviewFeedItem = {
  id: "n7_review_123", reviewer: 'Sam & Jo "S"', timestamp: "2026-10-01T12:34:56.000Z", title: "Not for me",
  content: "Too strong <for me>.\nI preferred the other one & would try it again. 😀", rating: 1, verifiedPurchase: false,
  product: { name: "Actual perfume", url: "https://n7cosmetics.co.uk/products/perfume", skus: ["n7_variant_9", "ACTUAL-SKU-9"], brand: "Actual brand", mpn: "253" },
};
const snapshot = (): ProductReviewFeedSnapshot => ({ origin: "https://n7cosmetics.co.uk", configurationError: null, published: 2, held: { CURATED_SEED: 1 }, items: [item], issues: [] });

test("Review XML preserves low ratings, actual dates, original text and escaped Unicode content", () => {
  const xml = productReviewFeedXml([item]);
  assert.match(xml, /<version>2\.4<\/version>/);
  assert.match(xml, /<overall min="1" max="5">1<\/overall>/);
  assert.ok(xml.includes("Too strong &lt;for me&gt;.\nI preferred the other one &amp; would try it again. 😀"));
  assert.ok(xml.includes("Sam &amp; Jo &quot;S&quot;"));
  assert.ok(xml.includes(`<review_timestamp>${item.timestamp}</review_timestamp>`));
  assert.ok(xml.includes('<review_url type="group">https://n7cosmetics.co.uk/products/perfume#reviews</review_url>'));
  assert.match(xml, /<is_verified_purchase>false<\/is_verified_purchase>/);
  assert.equal(xml.includes("is_incentivized_review"), false, "Unknown incentive status is not fabricated");
  assert.ok(xml.includes("<mpn>253</mpn>"));
  assert.equal(xml.includes("<sku>253</sku>"), false, "An official MPN is not silently treated as the inventory SKU");
  assert.ok(xml.includes("<sku>n7_variant_9</sku>"));
  assert.ok(xml.includes("<sku>ACTUAL-SKU-9</sku>"));
});

test("Anonymous authors, incentives and legitimate identifiers are represented without invented data", () => {
  const xml = productReviewFeedXml([{ ...item, reviewer: "", title: "", incentivized: true, product: { ...item.product, gtin: "4006381333931" } }]);
  assert.ok(xml.includes('<name is_anonymous="true">Anonymous</name>'));
  assert.ok(xml.includes("<gtin>4006381333931</gtin>"));
  assert.ok(xml.includes("<is_incentivized_review>true</is_incentivized_review>"));
  assert.equal(xml.includes("<title>"), false);
  assert.throws(() => productReviewFeedXml([item, item]), /Duplicate review/);
  assert.throws(() => productReviewFeedXml([{ ...item, content: "\u0000bad" }]), /XML characters/);
  assert.throws(() => productReviewFeedXml([{ ...item, rating: 0 }]), /Invalid review/);
  assert.equal(validReviewXmlText("\ud800"), false);
  assert.equal(validReviewXmlText("\tA\r\n😀"), true);
});

test("Google review syndication requires recorded customer provenance and explicit admin evidence", () => {
  for (const source of ["UNKNOWN", "CURATED_SEED", "ADMIN_ENTRY", "LIVE", "LEGACY", "pretend-source"]) assert.equal(hasCustomerReviewOrigin(source), false);
  for (const source of ["CUSTOMER_SUBMISSION", "LEGACY_IMPORT", "CONFIRMED_CUSTOMER"]) assert.equal(hasCustomerReviewOrigin(source), true);
  const proof = { reviewId: "123", revision: "a".repeat(64), confirmed: true, evidence: "Original customer ticket REVIEW-123", incentive: "UNKNOWN" };
  assert.equal(confirmReviewOriginSchema.safeParse(proof).success, true);
  for (const change of [{ confirmed: false }, { evidence: "" }, { reviewId: "bad" }, { incentive: "MAYBE" }, { revision: "old" }]) assert.equal(confirmReviewOriginSchema.safeParse({ ...proof, ...change }).success, false);
});

test("A complete review response stays public and fresh, and never becomes an empty or partial replacement", async () => {
  const response = await productReviewFeedResponse(async () => snapshot());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/xml; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok((await response.text()).includes("n7_review_123"));
  for (const changed of [
    { items: [] }, { configurationError: "Invalid origin" }, { issues: [{ reviewId: "2", message: "Bad product" }] },
    { items: [{ ...item, content: "\u0000invalid" }] },
  ]) {
    const failed = await productReviewFeedResponse(async () => ({ ...snapshot(), ...changed }));
    assert.equal(failed.status, 503);
    assert.equal(failed.headers.get("retry-after"), "300");
    assert.equal((await failed.text()).includes("<feed"), false);
  }
  const failed = await productReviewFeedResponse(async () => { throw new Error("private database error"); });
  assert.equal(failed.status, 503);
  assert.equal((await failed.text()).includes("private database error"), false);
});
