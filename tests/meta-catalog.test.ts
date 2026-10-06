import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogItem, catalogBatchStatus, catalogDeleteRequest, catalogPayloadHash, catalogPublicUrl, type CatalogProduct } from "../lib/meta/catalog-product";
import { catalogReady, metaCatalogSettingsSchema } from "../lib/meta/catalog-settings";
import { metaContentId } from "../lib/meta/shared";

const product: CatalogProduct = {
  productId: "42", variantId: "9007199254740993", name: "Aventus", productCode: "101",
  slug: "aventus", productType: "STANDARD", description: "<p>Fresh &amp; woody.</p><script>secret()</script>",
  shortDescription: null, brand: null, pricePence: 3701, imageUrl: "/media/product-image",
  size: "100 ml", availableQuantity: 17, soldOut: false,
};
const website = "https://n7cosmetics.co.uk";

test("Catalogue batch IDs match events without losing large variant IDs", () => {
  const { item } = buildCatalogItem(product, website);
  assert.ok(item);
  assert.equal(item.id, metaContentId(product.variantId));
  assert.equal(item.title, "101 — Aventus");
  assert.equal(item.description, "Fresh & woody.");
  assert.equal(item.price, "37.01 GBP");
  assert.equal(item.brand, "N7 Cosmetics");
  assert.equal(item.item_group_id, "n7_product_42");
  assert.equal(item.image_link, `${website}/media/product-image`);
  assert.equal("retailer_id" in item, false);
  assert.deepEqual(catalogDeleteRequest(item.id), { method: "DELETE", data: { id: item.id } });
});

test("Tracked stock is exact; untracked stock has no invented quantity", () => {
  assert.equal(buildCatalogItem(product, website).item?.quantity_to_sell_on_facebook, 17);
  const untracked = buildCatalogItem({ ...product, availableQuantity: null }, website).item;
  assert.ok(untracked);
  assert.equal("quantity_to_sell_on_facebook" in untracked, false);
  const soldOut = buildCatalogItem({ ...product, availableQuantity: 0, soldOut: true }, website).item;
  assert.equal(soldOut?.availability, "out of stock");
  assert.equal(soldOut?.quantity_to_sell_on_facebook, 0);
});

test("Bundles use their actual storefront URL and base price", () => {
  const item = buildCatalogItem({ ...product, productType: "BUNDLE", productCode: null }, website).item;
  assert.equal(item?.link, `${website}/bundles/aventus`);
  assert.equal(item?.title, "Aventus");
  assert.equal(item?.price, "37.01 GBP");
  assert.equal(item && "sale_price" in item, false);
});

test("Missing or invalid required data is excluded rather than invented", () => {
  for (const change of [{ imageUrl: null }, { pricePence: 0 }, { pricePence: 1.2 }, { pricePence: NaN }, { name: "" }, { variantId: "0" }]) {
    const result = buildCatalogItem({ ...product, productCode: null, ...change }, website);
    assert.equal(result.item, undefined); assert.ok(result.error);
  }
  assert.ok(buildCatalogItem(product, "http://localhost:3003").error);
});

test("Catalogue URLs require public HTTPS and cannot carry credentials", () => {
  for (const url of ["http://example.com/image", "https://localhost/image", "https://dev.local/image", "https://127.0.0.1/image", "https://[::1]/image", "https://user:token@example.com/image", "data:image/png;base64,test"]) {
    assert.equal(catalogPublicUrl(url, website), null);
  }
  assert.equal(catalogPublicUrl("/imgs/image.webp", website), `${website}/imgs/image.webp`);
  assert.equal(catalogPublicUrl("https://cdn.example.com/image.webp", website), "https://cdn.example.com/image.webp");
});

test("Payload hashes change for stock, prices and delete operations", () => {
  const item = buildCatalogItem(product, website).item;
  assert.ok(item);
  const hash = catalogPayloadHash({ method: "UPDATE", data: item });
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hash, catalogPayloadHash({ method: "UPDATE", data: { ...item } }));
  assert.notEqual(hash, catalogPayloadHash({ method: "UPDATE", data: { ...item, price: "38.00 GBP" } }));
  assert.notEqual(hash, catalogPayloadHash({ method: "UPDATE", data: { ...item, quantity_to_sell_on_facebook: 16 } }));
  assert.notEqual(hash, catalogPayloadHash(catalogDeleteRequest(item.id)));
});

test("Catalogue settings activate only with their own enabled ID and token", () => {
  const settings = { catalogId: "123456789", enabled: true, tokenEncrypted: "encrypted", revision: "a".repeat(64) };
  assert.equal(catalogReady(settings), true);
  for (const change of [{ catalogId: "" }, { tokenEncrypted: "" }, { enabled: false }, { catalogId: "not-a-catalogue" }]) assert.equal(catalogReady({ ...settings, ...change }), false);
  const input = { catalogId: "", enabled: true, accessToken: "", clearToken: false, revision: settings.revision };
  assert.equal(metaCatalogSettingsSchema.safeParse(input).success, true);
  assert.equal(metaCatalogSettingsSchema.safeParse({ ...input, catalogId: "123456789" }).success, true);
  assert.equal(metaCatalogSettingsSchema.safeParse({ ...input, accessToken: "secret\nwith spaces" }).success, false);
});

test("Only the requested completed batch without errors is confirmed", () => {
  const response = (status: string, extras: object = {}) => ({ data: [{ handle: "batch1", status, ...extras }] });
  assert.equal(catalogBatchStatus(response("finished", { errors: [], errors_total_count: 0 }), "batch1"), "finished");
  assert.equal(catalogBatchStatus(response("in progress"), "batch1"), "pending");
  assert.equal(catalogBatchStatus(response("finished"), "different-batch"), "pending");
  assert.equal(catalogBatchStatus({ handles: ["batch1"] }, "batch1"), "pending");
  assert.equal(catalogBatchStatus(response("finished", { errors_total_count: "1" }), "batch1"), "failed");
  assert.equal(catalogBatchStatus(response("finished", { errors: [{ message: "private error" }] }), "batch1"), "failed");
  assert.equal(catalogBatchStatus(response("finished", { ids_of_invalid_requests: ["n7_variant_42"] }), "batch1"), "failed");
  assert.equal(catalogBatchStatus(response("failed"), "batch1"), "failed");
});
