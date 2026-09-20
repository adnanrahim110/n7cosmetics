import test from "node:test";
import assert from "node:assert/strict";
import { shippingPrice, type ShippingRule } from "../lib/commerce/shipping";
const free: ShippingRule = { method_type: "FREE_SHIPPING", price_pence: 0, free_over_pence: 9900, threshold_basis: "BEFORE_DISCOUNT" };

test("free shipping requires its minimum, including exact boundary", () => {
  assert.equal(shippingPrice(free, 9899, 9899, false), null);
  assert.equal(shippingPrice(free, 9900, 9900, false), 0);
});
test("admin threshold basis determines whether discounts affect eligibility", () => {
  assert.equal(shippingPrice(free, 10000, 8000, false), 0);
  assert.equal(shippingPrice({ ...free, threshold_basis: "AFTER_DISCOUNT" }, 10000, 8000, false), null);
});
test("flat-rate charges, optional thresholds and free-shipping coupons agree", () => {
  const flat: ShippingRule = { method_type: "FLAT_RATE", price_pence: 299, free_over_pence: null };
  assert.equal(shippingPrice(flat, 20000, 20000, false), 299);
  assert.equal(shippingPrice(flat, 4000, 4000, true), 0);
  assert.equal(shippingPrice({ ...flat, free_over_pence: 9900 }, 12000, 9500, false), 299);
  assert.equal(shippingPrice({ ...flat, free_over_pence: 9900 }, 12000, 9900, false), 0);
  assert.equal(shippingPrice({ ...flat, method_type: "LOCAL_PICKUP" }, 4000, 4000, true), 299);
});
