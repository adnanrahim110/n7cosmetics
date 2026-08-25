import assert from "node:assert/strict";
import test from "node:test";
import { reviewInputSchema } from "../lib/commerce/reviews-validation";

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
