import assert from "node:assert/strict";
import test from "node:test";
import type { CatalogExportProduct } from "../lib/commerce/catalog-export";
import { defaultMerchantMetadata, merchantMetadataSchema, validGtin, type MerchantMetadata } from "../lib/google-merchant/metadata";
import { buildMerchantEntry, merchantPublicUrl, merchantSiteOrigin, merchantText } from "../lib/google-merchant/product";
import { merchantFeedXml } from "../lib/google-merchant/xml";
import { merchantFeedResponse } from "../lib/google-merchant/feed";
import { merchantFilters } from "../lib/google-merchant/filters";

const origin = "https://n7cosmetics.co.uk";
const product: CatalogExportProduct = {
  productId: "42", variantId: "9007199254740993", name: "Rose & Oud", productCode: "101", slug: "rose-oud",
  isRecreation: false,
  productType: "STANDARD", description: "<p>A rose fragrance.</p>", shortDescription: "Fresh &amp; floral.",
  brand: "N7 Cosmetics", sku: "N7-P-00000042", pricePence: 3701, imageUrl: "/media/rose",
  images: ["/media/rose", "/media/back?size=full&format=webp"], size: "100 ml", availableQuantity: 17,
  soldOut: false, components: [], componentsVisible: true,
};
const metadata: MerchantMetadata = { ...defaultMerchantMetadata, gtin: "4006381333931" };
const entry = (changes: Partial<CatalogExportProduct> = {}, settings: Partial<MerchantMetadata> = {}) => {
  const source = { ...product, ...changes };
  return buildMerchantEntry(source, origin, new Map([[source.variantId, { ...metadata, ...settings }]]), new Map([[source.variantId, source]]));
};

test("Catalogue search handles repeated parameters and invalid pagination without passing arrays to rendering", () => {
  assert.deepEqual(merchantFilters({ q: ["rose", "oud"], filter: ["issues", "ready"], page: ["2", "3"] }), { query: "rose", filter: "issues", page: 2 });
  assert.deepEqual(merchantFilters({ q: [], filter: "unknown", page: "-1" }), { query: "", filter: "all", page: 1 });
  for (const page of ["NaN", "Infinity", "2x", "2.5", "1e5"]) assert.equal(merchantFilters({ page }).page, 1);
  assert.equal(merchantFilters({ page: "9".repeat(1000) }).page, 100000);
  assert.equal(merchantFilters({ q: "x".repeat(500) }).query.length, 190);
});

test("GTIN validation preserves leading zeros and verifies standard lengths and checksums", () => {
  for (const value of ["4006381333931", "012345678905", "96385074", "10012345000017"]) assert.equal(validGtin(value), true, value);
  for (const value of ["4006381333932", "0000000000000", "N7-P-00000042", "123", "40063813339311"]) assert.equal(validGtin(value), false, value);
});

test("Restricted GS1 and coupon ranges are rejected even with valid check digits", () => {
  const withCheckDigit = (prefix: string) => {
    const base = prefix.padEnd(12, "0");
    let sum = 0;
    for (let index = 0; index < base.length; index++) sum += Number(base[index]) * (index % 2 === 0 ? 1 : 3);
    return `${base}${(10 - sum % 10) % 10}`;
  };
  for (const prefix of ["2", "02", "04", "05", "98", "99", "980", "981", "984", "985", "989"]) assert.equal(validGtin(withCheckDigit(prefix)), false, prefix);
});

test("Missing identifiers need explicit confirmation; internal SKUs are never substituted", () => {
  assert.equal(entry({}, { gtin: "" }).item, undefined);
  assert.match(entry({}, { gtin: "" }).issues.join(" "), /confirm/);
  const confirmed = entry({}, { gtin: "", identifierPolicy: "NONE" }).item;
  assert.equal(confirmed?.identifier_exists, "no");
  assert.equal(confirmed?.gtin, undefined);
  assert.equal(confirmed?.mpn, undefined);
  assert.equal(merchantMetadataSchema.safeParse({ ...metadata, identifierPolicy: "NONE" }).success, false);
});

test("Manufacturer MPN is supported without inventing a barcode or hiding the GTIN requirement", () => {
  const result = entry({}, { gtin: "", mpn: "MANUFACTURER-42" });
  assert.equal(result.item?.mpn, "MANUFACTURER-42");
  assert.equal(result.item?.identifier_exists, "yes");
  assert.match(result.warnings.join(" "), /GTIN/);
});

test("Confirmed N7 recreation codes are dynamic manufacturer MPNs only within that collection", () => {
  const recreation = { ...product, isRecreation: true };
  const build = (source: CatalogExportProduct) => buildMerchantEntry(source, origin, new Map(), new Map([[source.variantId, source]]));
  assert.equal(build(recreation).item?.mpn, "101");
  assert.equal(build({ ...recreation, productCode: "UPDATED-102" }).item?.mpn, "UPDATED-102");
  assert.equal(build(recreation).item?.gtin, undefined);
  assert.equal(build({ ...recreation, isRecreation: false }).item, undefined);
  assert.equal(build({ ...recreation, productCode: null }).item, undefined);
  assert.equal(entry({ isRecreation: true }, { gtin: "", identifierPolicy: "NONE" }).item, undefined);
});

test("Prices, stock and IDs describe the actual single-unit offer without precision loss", () => {
  const item = entry().item;
  assert.equal(item?.id, "n7_variant_9007199254740993");
  assert.equal(item?.price, "37.01 GBP");
  assert.equal(item?.availability, "in_stock");
  assert.equal(entry({ soldOut: true, availableQuantity: 0 }).item?.availability, "out_of_stock");
  assert.equal(entry({ availableQuantity: null }).item?.availability, "in_stock");
  assert.equal(item?.title, "101 — Rose & Oud");
  assert.equal(item?.description, "Fresh & floral.");
  assert.equal("sale_price" in (item ?? {}), false);
  assert.equal("item_group_id" in (item ?? {}), false);
});

test("Missing primary content, invalid price and misleading landing URLs block export", () => {
  for (const change of [{ imageUrl: null }, { description: "", shortDescription: "" }, { brand: "" }, { pricePence: 0 }, { pricePence: 1.5 }, { slug: ".." }]) {
    assert.equal(entry(change).item, undefined, JSON.stringify(change));
  }
  assert.equal(entry({}, { included: false }).excluded, true);
  assert.equal(entry({}, { included: false }).issues.length, 0);
});

test("Only public HTTPS origins and image URLs without credentials are accepted", () => {
  for (const value of ["http://localhost:3003", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://site.local", "https://site.test", "https://user:password@example.com", "https://example.com/path", "https://example.com/?secret=1"]) {
    assert.throws(() => merchantSiteOrigin(value));
  }
  assert.equal(merchantSiteOrigin(`${origin}/`), origin);
  assert.equal(merchantPublicUrl("/media/rose", origin), `${origin}/media/rose`);
  assert.equal(merchantPublicUrl("javascript:alert(1)", origin), null);
  assert.equal(merchantPublicUrl("https://user:password@example.com/image", origin), null);
});

test("XML escaping protects attributes and text; invalid XML characters are removed from source copy", () => {
  const result = entry({ name: 'Rose <strong>Oud</strong> "Fresh"\u0000\ud800', description: "", shortDescription: "<script>private()</script>Soft &#x1f339; &amp; floral." });
  assert.equal(result.item?.description, "Soft 🌹 & floral.");
  assert.equal(merchantText("A\u0000\ud800 B"), "A B");
  assert.ok(result.item);
  const xml = merchantFeedXml([result.item], origin);
  assert.match(xml, /&quot;Fresh&quot;/);
  assert.match(xml, /&amp;format=webp/);
  assert.doesNotMatch(xml, /<strong>|<script>|\u0000|\ud800/);
  assert.match(xml, /xmlns:g="http:\/\/base.google.com\/ns\/1.0"/);
  assert.match(xml, /<g:additional_image_link>/);
});

test("Image galleries are deduplicated, bounded and do not replace an invalid primary image", () => {
  const result = entry({ images: ["/media/rose", "/media/rose", ...Array.from({ length: 15 }, (_, index) => `/media/${index}`), "http://localhost/image"] });
  assert.equal(result.item?.additional_image_link.length, 10);
  assert.ok(result.warnings.length);
  assert.equal(entry({ imageUrl: "http://localhost/image", images: ["http://localhost/image", "/media/good"] }).item, undefined);
});

test("Volume comes from an unambiguous visible size and uses consistent measurement units", () => {
  assert.equal(entry().item?.unit_pricing_measure, "100 ml");
  assert.equal(entry({ size: "0.5 L" }).item?.unit_pricing_measure, "500 ml");
  assert.equal(entry({ size: "Travel gift set" }).item?.unit_pricing_measure, undefined);
  assert.equal(entry().item?.unit_pricing_base_measure, "100 ml");
  assert.equal(entry({ size: `${"9".repeat(100)} ml` }).item?.unit_pricing_measure, undefined);
});

test("Empty markup in a short description falls back to meaningful full product copy", () => {
  assert.equal(entry({ shortDescription: "<p> </p>" }).item?.description, "A rose fragrance.");
});

test("Long Unicode titles are truncated without splitting characters", () => {
  const result = entry({ name: "🌹".repeat(180), productCode: null });
  assert.equal(Array.from(result.item?.title ?? "").length, 150);
  assert.ok(result.warnings.length);
});

const bundle: CatalogExportProduct = {
  ...product, productId: "50", variantId: "51", productType: "BUNDLE", name: "Fragrance gift set", slug: "gift-set",
  components: [{ variantId: product.variantId, name: product.name, quantity: 2, stockOnHand: 17, trackInventory: true, available: true }],
};
function bundleEntry(settings: Partial<MerchantMetadata>, changes: Partial<CatalogExportProduct> = {}) {
  return buildMerchantEntry({ ...bundle, ...changes }, origin,
    new Map([[product.variantId, metadata], [bundle.variantId, { ...defaultMerchantMetadata, ...settings }]]),
    new Map([[product.variantId, product], [bundle.variantId, bundle]]));
}

test("Gift sets and manufacturer packs require review and keep their own identity", () => {
  assert.equal(bundleEntry({}).item, undefined);
  const set = bundleEntry({ bundleKind: "SET", identifierPolicy: "NONE" }).item;
  assert.equal(set?.identifier_exists, "no");
  assert.equal(set?.is_bundle, undefined);
  assert.equal(set?.gtin, undefined);
  assert.equal(set?.unit_pricing_measure, undefined);
  assert.equal(bundleEntry({ bundleKind: "MANUFACTURER", gtin: metadata.gtin }).item?.gtin, metadata.gtin);
});

test("Main-product bundles and multipacks reuse the actual included product's identity", () => {
  const main = bundleEntry({ bundleKind: "MAIN_PRODUCT", mainVariantId: product.variantId }).item;
  assert.equal(main?.is_bundle, "yes");
  assert.equal(main?.gtin, metadata.gtin);
  assert.equal(bundleEntry({ bundleKind: "MAIN_PRODUCT", mainVariantId: "999" }).item, undefined);
  const multipack = bundleEntry({ bundleKind: "MULTIPACK" }).item;
  assert.equal(multipack?.multipack, 2);
  assert.equal(multipack?.gtin, metadata.gtin);
  assert.equal(multipack?.is_bundle, undefined);
  assert.equal(bundleEntry({ bundleKind: "MULTIPACK" }, { components: [] }).item, undefined);
  assert.equal(bundleEntry({ bundleKind: "SET", identifierPolicy: "NONE" }, { componentsVisible: false }).item, undefined);
});

test("A feed cannot contain duplicate IDs", () => {
  const item = entry().item;
  assert.ok(item);
  assert.throws(() => merchantFeedXml([item, item], origin), /Duplicate/);
});

test("Feed responses are fresh XML and omit invalid individual products", async () => {
  const response = await merchantFeedResponse(async () => ({ origin, configurationError: null, entries: [entry(), entry({ imageUrl: null })] }));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/xml/);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.text()).match(/<item>/g)?.length, 1);
});

test("Database failure and invalid origin return retryable errors without private details", async context => {
  context.mock.method(console, "error", () => {});
  for (const read of [async () => { throw new Error("DB_PASSWORD=private"); }, async () => ({ origin: "", configurationError: "invalid", entries: [] })]) {
    const response = await merchantFeedResponse(read);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("retry-after"), "300");
    assert.doesNotMatch(await response.text(), /private|DB_PASSWORD/);
  }
});

test("An entirely invalid catalogue fails closed; deliberate exclusions and genuinely empty stores can publish empty feeds", async context => {
  context.mock.method(console, "error", () => {});
  const invalid = await merchantFeedResponse(async () => ({ origin, configurationError: null, entries: [entry({ imageUrl: null })] }));
  assert.equal(invalid.status, 503);
  const excluded = await merchantFeedResponse(async () => ({ origin, configurationError: null, entries: [entry({}, { included: false })] }));
  assert.equal(excluded.status, 200);
  const empty = await merchantFeedResponse(async () => ({ origin, configurationError: null, entries: [] }));
  assert.equal(empty.status, 200);
});
