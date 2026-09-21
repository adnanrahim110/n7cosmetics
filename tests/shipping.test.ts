import test from "node:test";
import assert from "node:assert/strict";
import { matchingShippingZone, postcodeMatches, shippingOptions, type ShippingConfiguration, type ShippingMethod, type ShippingRule, type ShippingZone } from "../lib/commerce/shipping";
import { parseShippingMethod, parseShippingRule, parseShippingZone } from "../lib/admin/shipping";
import { resolveAdminToastFeedback } from "../lib/admin/toast-feedback";

const zone: ShippingZone = { id: "1", name: "UK", countries: ["GB"], postcodes: [], isActive: true, sortOrder: 0 };
const standard: ShippingMethod = { id: "1", name: "Standard", methodType: "DELIVERY", pricingMode: "FLAT_RATE", pricePence: 299, allowFreeShippingCoupon: true, estimatedDaysMin: 3, estimatedDaysMax: 5, isActive: true, sortOrder: 0, rates: [{ zoneId: "1", pricePence: 299 }] };
const express: ShippingMethod = { ...standard, id: "2", name: "Express", pricePence: 699, allowFreeShippingCoupon: false, sortOrder: 1 };
const free: ShippingRule = { id: "1", name: "Free Standard over £99", minimumSubtotalPence: 9900, thresholdBasis: "BEFORE_DISCOUNT", methodIds: ["1"], zoneId: "1", priority: 0, isActive: true };
const config: ShippingConfiguration = { zones: [zone], methods: [standard, express], rules: [free] };
const options = (subtotal: number, discounted = subtotal, rules = config.rules) => shippingOptions({ ...config, rules }, "GB", "SW1A 1AA", subtotal, discounted);

test("shipping tabs report saves and actionable validation errors without consuming the active tab", () => {
  for (const tab of ["methods", "zones", "rules"]) {
    const saved = resolveAdminToastFeedback("/admin/shipping", new URLSearchParams({ tab, saved: "1" }));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].type, "success");
    assert.deepEqual(saved[0].consume, ["saved"]);
    const errors = resolveAdminToastFeedback("/admin/shipping", new URLSearchParams({ tab, error: tab }));
    assert.equal(errors.length, 1);
    assert.equal(errors[0].type, "error");
    assert.deepEqual(errors[0].consume, ["error"]);
    assert(!errors[0].description?.includes("free-delivery threshold"));
  }
});

test("a threshold adjusts the same method automatically at the exact boundary", () => {
  assert.deepEqual(options(9899).map(method => method.pricePence), [299, 699]);
  assert.deepEqual(options(9900).map(method => [method.id, method.pricePence]), [["1", 0], ["2", 699]]);
  assert.equal(options(9900)[0].basePricePence, 299);
  assert.equal(options(9900)[0].adjustment?.source, "RULE");
  assert.equal(options(9900)[0].estimatedDaysMax, 5);
  assert.equal(options(9899)[0].adjustment, null);
});
test("threshold basis determines eligibility after merchandise discounts", () => {
  assert.equal(options(10000, 8000)[0].pricePence, 0);
  assert.equal(options(10000, 8000, [{ ...free, thresholdBasis: "AFTER_DISCOUNT" }])[0].pricePence, 299);
  assert.equal(options(10000, 9900, [{ ...free, thresholdBasis: "AFTER_DISCOUNT" }])[0].pricePence, 0);
});
test("inactive or differently scoped rules never change the charge", () => {
  for (const rule of [{ ...free, isActive: false }, { ...free, zoneId: "2" }, { ...free, methodIds: ["99"] }]) {
    assert.equal(options(20000, 20000, [rule])[0].pricePence, 299);
  }
});
test("priority and stable ID order select one adjustment without stacking", () => {
  const rules = [free, { ...free, id: "3", name: "High", priority: 10 }, { ...free, id: "2", name: "Earlier high", priority: 10 }];
  const result = options(20000, 20000, rules)[0];
  assert.equal(result.adjustment?.id, "2");
  assert.equal(result.adjustment?.amountPence, 299);
  assert.equal(result.pricePence, 0);
});
test("coupons affect only methods that explicitly accept them", () => {
  const pickup = { ...standard, id: "3", methodType: "LOCAL_PICKUP" as const, allowFreeShippingCoupon: false };
  const result = shippingOptions({ ...config, methods: [standard, express, pickup] }, "GB", "", 5000, 5000, { id: "5", name: "SHIPFREE" });
  assert.deepEqual(result.map(item => item.pricePence), [0, 299, 699]);
  assert.equal(result[0].adjustment?.source, "COUPON");
  assert.equal(result.find(item => item.id === "3")?.adjustment, null);
});
test("pickup can be explicitly targeted by an automatic rule", () => {
  const pickup = { ...standard, methodType: "LOCAL_PICKUP" as const, allowFreeShippingCoupon: false };
  assert.equal(shippingOptions({ ...config, methods: [pickup] }, "GB", "", 10000, 10000)[0].pricePence, 0);
});
test("automatic free shipping and coupons cannot double-count savings", () => {
  const result = shippingOptions(config, "GB", "", 20000, 20000, { id: "5", name: "SHIPFREE" });
  assert.equal(result[0].adjustment?.source, "RULE");
  assert.equal(result[0].adjustment?.amountPence, 299);
});
test("postcode matching normalizes spaces and case without unsafe patterns", () => {
  assert(postcodeMatches("sw1a 1aa", "SW1A1AA"));
  assert(postcodeMatches("BT1 1AA", "bt*"));
  assert(!postcodeMatches("ABT1 1AA", "BT*"));
  assert(!postcodeMatches("BT10 1AA", "BT1"));
  assert(!postcodeMatches("", "BT*"));
});
test("postcode zones precede country zones, then use explicit order and ID", () => {
  const regional = { ...zone, id: "2", name: "Northern Ireland", postcodes: ["BT*"], sortOrder: 10 };
  assert.equal(matchingShippingZone([zone, regional], "GB", "BT1 1AA")?.id, "2");
  assert.equal(matchingShippingZone([zone, regional], "GB", "SW1A 1AA")?.id, "1");
  assert.equal(matchingShippingZone([zone, regional], "GB")?.id, "1");
  assert.equal(matchingShippingZone([zone, { ...regional, isActive: false }], "GB", "BT1 1AA")?.id, "1");
  assert.equal(matchingShippingZone([zone, regional], "US", "BT1 1AA"), null);
  assert.equal(matchingShippingZone([regional, { ...regional, id: "3", sortOrder: -1 }], "GB", "BT1 1AA")?.id, "3");
});
test("zone prices and flat prices are separate; unavailable services never leak into a zone", () => {
  const regional = { ...zone, id: "2", postcodes: ["BT*"] };
  const method = { ...standard, rates: [...standard.rates, { zoneId: "2", pricePence: 899 }] };
  const data = { ...config, zones: [zone, regional], methods: [method, express] };
  assert.deepEqual(shippingOptions(data, "GB", "BT1 1AA", 5000, 5000).map(item => item.pricePence), [299]);
  assert.equal(shippingOptions({ ...data, methods: [{ ...method, pricingMode: "ZONE_RATES" }] }, "GB", "BT1 1AA", 5000, 5000)[0].pricePence, 899);
  assert.equal(shippingOptions({ ...data, methods: [{ ...method, isActive: false }] }, "GB", "BT1 1AA", 5000, 5000).length, 0);
  assert.equal(shippingOptions(data, "US", "", 5000, 5000).length, 0);
});
test("zero base prices have no fictional shipping discount", () => {
  assert.equal(shippingOptions({ ...config, methods: [{ ...standard, pricePence: 0 }] }, "GB", "", 10000, 10000)[0].adjustment, null);
});
function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  return data;
}
test("admin validation rejects malformed rates, empty targets, old method types and reversed estimates", () => {
  const method = { name: "Standard", methodType: "DELIVERY", pricingMode: "FLAT_RATE", price: "2.99", sortOrder: "0" };
  assert(parseShippingMethod(form(method)).success);
  assert(!parseShippingMethod(form({ ...method, price: "-1" })).success);
  assert(!parseShippingMethod(form({ ...method, price: "2.999" })).success);
  assert(!parseShippingMethod(form({ ...method, methodType: "FREE_SHIPPING" })).success);
  assert(!parseShippingMethod(form({ ...method, estimatedDaysMin: "5", estimatedDaysMax: "2" })).success);
  const rule = { name: "Free Standard", minimumSubtotal: "99", thresholdBasis: "BEFORE_DISCOUNT", zoneId: "all", priority: "0", methodIds: ["1"] };
  const parsed = parseShippingRule(form(rule));
  assert(parsed.success && parsed.data.zoneId === null && parsed.data.minimumSubtotalPence === 9900);
  assert(!parseShippingRule(form({ ...rule, methodIds: [] })).success);
  assert(!parseShippingRule(form({ ...rule, minimumSubtotal: "NaN" })).success);
  assert(parseShippingZone(form({ name: "UK", countries: "gb, GB", postcodes: "bt*, sw1a 1aa", sortOrder: "0" })).success);
  assert(!parseShippingZone(form({ name: "UK", countries: "GB", postcodes: "*", sortOrder: "0" })).success);
});
