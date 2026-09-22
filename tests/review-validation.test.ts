import assert from "node:assert/strict";
import test from "node:test";
import { reviewInputSchema } from "../lib/commerce/reviews-validation";
import { adminReviewInputSchema } from "../lib/admin/reviews-validation";

const validReview = {
  productId: "42",
  productSlug: "amber-oud",
  name: "N7 Customer",
  email: "Customer@Example.com",
  rating: "5",
  title: "A warm, lasting signature",
  body: "The amber settles beautifully and lasted throughout the evening.",
  recommendsProduct: true,
  consent: "on",
};

test("review input accepts a complete customer review and normalizes email", () => {
  const parsed = reviewInputSchema.safeParse(validReview);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.email, "customer@example.com");
});

test("review input requires a star rating and meaningful review text", () => {
  assert.equal(reviewInputSchema.safeParse({ ...validReview, rating: "0" }).success, false);
  assert.equal(reviewInputSchema.safeParse({ ...validReview, body: "Too short" }).success, false);
});

test("review input rejects invalid product references and missing consent", () => {
  assert.equal(reviewInputSchema.safeParse({ ...validReview, productId: "../42" }).success, false);
  assert.equal(reviewInputSchema.safeParse({ ...validReview, consent: "" }).success, false);
});

const validAdminReview = {
  productId: validReview.productId,
  name: validReview.name,
  email: validReview.email,
  rating: validReview.rating,
  title: validReview.title,
  body: validReview.body,
  recommendsProduct: true,
  reviewDate: "2020-02-29",
};

test("admin reviews accept backdates without customer consent or a product slug", () => {
  const parsed = adminReviewInputSchema.safeParse(validAdminReview);
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.equal(parsed.data.reviewDate, "2020-02-29");
    assert.equal(parsed.data.email, "customer@example.com");
    assert.equal(parsed.data.rating, 5);
  }
  assert.equal(adminReviewInputSchema.safeParse({ ...validAdminReview, reviewDate: "1000-01-01" }).success, true);
});

test("admin reviews reject missing, impossible, and unsupported dates", () => {
  for (const reviewDate of [undefined, "", "2023-02-29", "2024-02-30", "2024-04-31", "2024-13-01", "22/09/2024", "2024-1-1", "2024-01-01T00:00:00Z", "0999-12-31", "10000-01-01"]) {
    const parsed = adminReviewInputSchema.safeParse({ ...validAdminReview, reviewDate });
    assert.equal(parsed.success, false, `Rejected ${reviewDate}`);
    if (!parsed.success) assert.ok(parsed.error.flatten().fieldErrors.reviewDate?.length);
  }
});

test("admin reviews still require valid product, reviewer, rating, and review details", () => {
  for (const invalid of [{ productId: "" }, { productId: "../42" }, { name: "" }, { email: "invalid" }, { rating: "" }, { rating: "0" }, { rating: "6" }, { rating: "2.5" }, { title: "" }, { body: "Too short" }]) {
    assert.equal(adminReviewInputSchema.safeParse({ ...validAdminReview, ...invalid }).success, false);
  }
});
