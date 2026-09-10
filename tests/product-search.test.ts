import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchQuery, rankProductSearchResults, type SearchableProduct } from "../lib/commerce/product-search";

const catalog: SearchableProduct[] = [
  { id: "1", name: "Aventus", slug: "aventus", brand: "Yusuf Bhai", inspiredBy: "Creed", productCode: "253", sku: "YB-AVENTUS-50", audience: "MEN", categories: "Recreations", collections: "Premium Collection", notes: { top: ["Pineapple"], heart: [], base: ["Oak Moss"] }, shortDescription: "A fresh, woody fragrance." },
  { id: "2", name: "Absolu Aventus", slug: "absolu-aventus", inspiredBy: "Creed", productCode: "2235", featured: true },
  { id: "3", name: "Sauvage", slug: "sauvage", inspiredBy: "Dior", productCode: "2035", audience: "MEN" },
  { id: "4", name: "Attrape Rêves", slug: "attrape-reves", inspiredBy: "Louis Vuittion", audience: "WOMEN" },
  { id: "5", name: "Angels’ Share", slug: "angels-share", inspiredBy: "Kilian", audience: "UNISEX" },
  { id: "6", name: "Libre", slug: "libre", inspiredBy: "Ysl", audience: "WOMEN", notes: JSON.stringify({ top: ["Lavender"], heart: ["Orange Blossom"], base: ["Vanilla"] }) },
  { id: "7", name: "Baccarat Rouge Extrait 540", slug: "baccarat-rouge-extrait-540", inspiredBy: "Maison Francis", productCode: "230" },
  { id: "8", name: "Velvet", slug: "velvet", brand: "N7 Cosmetics", notes: ["Rose", "Oud"], description: "<p>Warm amber for an evening fragrance.</p>" },
  { id: "9", name: "Duo", slug: "duo", productType: "BUNDLE", collections: "Gift Sets" },
];

function ids(query: string, products = catalog, limit = 8): string[] {
  return rankProductSearchResults(products, query, limit).map((product) => product.id);
}

test("exact names rank above partial names, descriptive mentions and featured products", () => {
  assert.deepEqual(ids("aventus", [...catalog, { id: "10", name: "Gift Box", slug: "gift-box", description: "Inspired by Aventus", featured: true }]), ["1", "2", "10"]);
});

test("matches partial words, reordered words and terms across product fields", () => {
  assert.equal(ids("ventus")[0], "1");
  assert.equal(ids("rouge bacc")[0], "7");
  assert.equal(ids("creed aven")[0], "1");
  assert.equal(ids("Yusuf Bhai Creed Aventus")[0], "1");
});

test("normalizes accents, apostrophes, case and whitespace", () => {
  assert.deepEqual(ids("  ATTRAPE   REVES  "), ["4"]);
  assert.deepEqual(ids("Angel's Share"), ["5"]);
  assert.deepEqual(ids("Angels’ Share"), ["5"]);
  assert.equal(normalizeSearchQuery("  creed   aventus  "), "creed aventus");
  assert.equal(normalizeSearchQuery("x".repeat(100)).length, 80);
});

test("handles missing, extra, substituted and transposed letters", () => {
  for (const query of ["sauvge", "sauvaage", "sauvagee", "sauvgae", "sauvaje"]) {
    assert.equal(ids(query)[0], "3", query);
  }
  assert.equal(ids("crred avents")[0], "1");
  assert.equal(ids("baccarrat")[0], "7");
});

test("direct matches always rank above typo matches", () => {
  assert.deepEqual(ids("sauvge", [...catalog, { id: "10", name: "Sauvge", slug: "sauvge" }]), ["10", "3"]);
});

test("supports full house names, abbreviations and catalog spelling variants", () => {
  for (const query of ["Louis Vuitton", "LV", "louis vuittion"]) assert.deepEqual(ids(query), ["4"]);
  for (const query of ["Yves Saint Laurent", "YSL"]) assert.deepEqual(ids(query), ["6"]);
  for (const query of ["MFK", "Maison Francis Kurkdjian"]) assert.deepEqual(ids(query), ["7"]);
});

test("accepts natural wording while retaining every specific search term", () => {
  assert.equal(ids("show me a perfume inspired by Creed for men")[0], "1");
  assert.equal(ids("looking for something fresh and woody")[0], "1");
  assert.deepEqual(ids("Creed Aventus dragonfruit"), []);
  assert.deepEqual(ids("Yusuf Bhai Creed Aventus Pineapple Premium dragonfruit"), []);
});

test("searches structured notes, categories, collections, audience and descriptions", () => {
  assert.deepEqual(ids("pineapple"), ["1"]);
  assert.deepEqual(ids("lavender vanilla"), ["6"]);
  assert.deepEqual(ids("rose oud"), ["8"]);
  assert.deepEqual(ids("warm amber"), ["8"]);
  assert.deepEqual(ids("premium"), ["1"]);
  assert.deepEqual(ids("recreation"), ["1"]);
  assert.deepEqual(ids("gift sets"), ["9"]);
  assert.deepEqual(ids("bundles"), ["9"]);
  assert.deepEqual(new Set(ids("men")), new Set(["1", "3"]));
  assert.deepEqual(new Set(ids("women's perfume")), new Set(["4", "6"]));
});

test("matches exact product codes and SKU formatting without fuzzy numeric matches", () => {
  assert.deepEqual(ids("253"), ["1"]);
  assert.deepEqual(ids("2235"), ["2"]);
  assert.deepEqual(ids("254"), []);
  assert.deepEqual(ids("540"), ["7"]);
  assert.deepEqual(ids("541"), []);
  for (const query of ["YB-AVENTUS-50", "YB AVENTUS 50", "ybaventus50"]) assert.deepEqual(ids(query), ["1"]);
});

test("rejects empty, punctuation-only, filler-only and unrelated queries", () => {
  for (const query of ["", " ", "a", "%_", "!!!", "show me something", "zzzzzz", "unicorn pizza"]) {
    assert.deepEqual(ids(query), [], query);
  }
  assert.deepEqual(ids("aventus", catalog, 0), []);
});

test("ranks before limiting and leaves the source catalog untouched", () => {
  const products = [...catalog].reverse();
  const originalIds = products.map((product) => product.id);
  assert.deepEqual(ids("aventus", products, 1), ["1"]);
  assert.deepEqual(products.map((product) => product.id), originalIds);
  assert.equal(ids("perfume", products, 3).length, 3);
});
