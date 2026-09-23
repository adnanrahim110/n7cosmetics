import assert from "node:assert/strict";
import test from "node:test";
import { inspectStock, stockAvailability, type StockProduct } from "../lib/commerce/stock";

const bottle: StockProduct = { slug: "amber", name: "Amber", variantId: "1", productType: "STANDARD", stockOnHand: 5, trackInventory: true, components: [] };
const bundle: StockProduct = { slug: "amber-set", name: "Amber set", variantId: "2", productType: "BUNDLE", stockOnHand: 10, trackInventory: true,
  components: [{ variantId: "1", name: "Amber", quantity: 2, stockOnHand: 5, trackInventory: true, available: true }] };

test("zero and negative stock are sold out; positive stock limits quantities", () => {
  for (const stockOnHand of [0, -2]) assert.deepEqual(stockAvailability({ ...bottle, stockOnHand }), { availableQuantity: 0, maxQuantity: 0, soldOut: true });
  assert.deepEqual(stockAvailability(bottle), { availableQuantity: 5, maxQuantity: 5, soldOut: false });
  assert.equal(stockAvailability({ ...bottle, stockOnHand: 200 }).maxQuantity, 99);
});

test("untracked inventory ignores zero stock while retaining the cart quantity cap", () => {
  assert.deepEqual(stockAvailability({ ...bottle, trackInventory: false, stockOnHand: 0 }), { availableQuantity: null, maxQuantity: 99, soldOut: false });
});

test("bundles use the lower capacity of their own stock and each required component", () => {
  assert.equal(stockAvailability(bundle).availableQuantity, 2);
  assert.equal(stockAvailability({ ...bundle, stockOnHand: 1 }).availableQuantity, 1);
  assert.equal(stockAvailability({ ...bundle, trackInventory: false, stockOnHand: 0 }).availableQuantity, 2);
  assert.equal(stockAvailability({ ...bundle, components: [{ ...bundle.components[0], stockOnHand: 1 }] }).soldOut, true);
});

test("missing products, empty bundles and inactive components cannot be purchased", () => {
  assert.equal(stockAvailability(undefined).soldOut, true);
  assert.equal(stockAvailability({ ...bundle, components: [] }).soldOut, true);
  assert.equal(stockAvailability({ ...bundle, components: [{ ...bundle.components[0], available: false }] }).soldOut, true);
});

test("repeated bundle components consume combined quantities", () => {
  const repeated = { ...bundle, components: [bundle.components[0], bundle.components[0]] };
  assert.equal(stockAvailability(repeated).availableQuantity, 1);
});

test("a bundle and its individual bottle share one stock limit regardless of cart order", () => {
  const products = [bottle, bundle];
  const valid = [{ slug: bottle.slug, quantity: 1 }, { slug: bundle.slug, quantity: 2 }];
  assert.equal(inspectStock(products, valid).issues.length, 0);
  const invalid = [{ slug: bottle.slug, quantity: 2 }, { slug: bundle.slug, quantity: 2 }];
  for (const items of [invalid, [...invalid].reverse()]) {
    const stock = inspectStock(products, items);
    assert.equal(stock.issues.length, 2);
    assert.equal(stock.limits[bottle.slug], 1);
    assert.equal(stock.limits[bundle.slug], 1);
    assert.equal(stock.products[bottle.slug].soldOut, false);
  }
});

test("separate bundles competing for one component cannot oversell it", () => {
  const second = { ...bundle, slug: "second-set", variantId: "3" };
  const stock = inspectStock([bundle, second], [{ slug: bundle.slug, quantity: 2 }, { slug: second.slug, quantity: 1 }]);
  assert.equal(stock.issues.length, 2);
  assert.equal(stock.limits[second.slug], 0);
});

test("stock changes revalidate saved carts and restored stock clears their issues", () => {
  const items = [{ slug: bottle.slug, quantity: 3 }];
  assert.equal(inspectStock([bottle], items).issues.length, 0);
  assert.equal(inspectStock([{ ...bottle, stockOnHand: 2 }], items).issues[0].code, "OUT_OF_STOCK");
  assert.equal(inspectStock([], items).issues[0].code, "CART_CHANGED");
  assert.equal(inspectStock([bottle], items).issues.length, 0);
});

test("duplicate cart lines cannot hide aggregate stock consumption", () => {
  const stock = inspectStock([bottle], [{ slug: bottle.slug, quantity: 3 }, { slug: bottle.slug, quantity: 3 }]);
  assert.equal(stock.issues.length, 1);
});

test("catalog limits account for other cart lines even before a product is added", () => {
  const stock = inspectStock([bottle, bundle], [{ slug: bundle.slug, quantity: 2 }]);
  assert.equal(stock.limits[bottle.slug], 1);
  assert.equal(stock.products[bottle.slug].availableQuantity, 5);
});
