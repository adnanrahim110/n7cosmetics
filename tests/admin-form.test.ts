import assert from "node:assert/strict";
import test from "node:test";
import { poundsToPence, penceToPounds, slugify } from "../lib/admin/form";
import { productFormPath, productListPath, productListReturnTo, productListReturnToWithToast } from "../lib/admin/product-navigation";
import { resolveAdminToastFeedback } from "../lib/admin/toast-feedback";
import { automatedProductSku } from "../lib/admin/product-identifiers";
import { parseProductListFilters, productListFilterQuery } from "../lib/admin/product-list-filters";
import { applyHeroProductPresentations, normalizeHeroProductPresentations } from "../lib/homepage/hero";
import type { HomepageProduct } from "../lib/homepage/types";
import { normalizeSocialMediaLinks } from "../lib/social-media";
import {
  emptyStorefrontPageConfiguration,
  normalizeStorefrontPageDetail,
  normalizeStorefrontPageHero,
} from "../lib/storefront-pages/config";

test("money conversion uses integer pence", () => {
  assert.equal(poundsToPence("29.99"), 2999);
  assert.equal(poundsToPence("10"), 1000);
  assert.equal(poundsToPence("1.999"), null);
  assert.equal(penceToPounds(2999), "29.99");
});

test("slugs are normalized and bounded", () => {
  assert.equal(slugify("  N7's Amber & Oud  "), "n7-s-amber-oud");
  assert.ok(slugify("x".repeat(300)).length <= 190);
});

test("product forms preserve the complete originating list query", () => {
  const returnTo = productListPath({ q: "amber & oud", status: ["ACTIVE", "DRAFT"], page: "4" });
  assert.equal(returnTo, "/admin/products?q=amber+%26+oud&status=ACTIVE&status=DRAFT&page=4");
  assert.equal(
    productFormPath("/admin/products/42", returnTo),
    "/admin/products/42?returnTo=%2Fadmin%2Fproducts%3Fq%3Damber%2B%2526%2Boud%26status%3DACTIVE%26status%3DDRAFT%26page%3D4",
  );
  assert.equal(productListReturnTo(returnTo), returnTo);
});

test("product return locations cannot leave the product list", () => {
  assert.equal(productListReturnTo("https://example.com/admin/products?page=4"), "/admin/products");
  assert.equal(productListReturnTo("//example.com/admin/products?page=4"), "/admin/products");
  assert.equal(productListReturnTo("/admin/orders?page=4"), "/admin/products");
  assert.equal(productListReturnTo("/admin/products?page=4#outside"), "/admin/products");
});

test("product save feedback preserves list filters and pagination", () => {
  assert.equal(productListReturnToWithToast("/admin/products?q=oud&page=3", "product-updated"), "/admin/products?q=oud&page=3&toast=product-updated");
});

test("product table filters normalize URL values for safe server queries", () => {
  const filters = parseProductListFilters({
    q: "  amber  ",
    status: "ACTIVE",
    type: "BUNDLE",
    audience: "UNISEX",
    category: "42",
    collection: "invalid",
    featured: "yes",
  });

  assert.deepEqual(productListFilterQuery(filters), {
    q: "amber",
    status: "ACTIVE",
    type: "BUNDLE",
    audience: "UNISEX",
    category: "42",
    collection: undefined,
    featured: "yes",
  });
});

test("admin feedback turns technical query states into user-friendly toast copy", () => {
  assert.deepEqual(resolveAdminToastFeedback("/admin/categories", new URLSearchParams("error=duplicate&edit=4")), [{
    id: "/admin/categories:error:duplicate",
    type: "error",
    title: "That category already exists",
    description: "Use a different name or web address, then try again.",
    consume: ["error"],
  }]);
  assert.equal(resolveAdminToastFeedback("/admin/settings", new URLSearchParams("smtp-test=skipped"))[0]?.type, "warning");
  assert.equal(resolveAdminToastFeedback("/admin/login", new URLSearchParams("error=invalid"))[0]?.title, "We couldn’t sign you in");
});

test("product SKUs are generated from stable database identifiers", () => {
  assert.equal(automatedProductSku("1"), "N7-P-00000001");
  assert.equal(automatedProductSku("123456789"), "N7-P-123456789");
  assert.throws(() => automatedProductSku("invalid"));
});

test("hero presentation fields override product data only when provided", () => {
  const product: HomepageProduct = {
    id: "12", slug: "passio", name: "Passio", type: "Yusuf Bhai", price: "£40", pricePence: 4000,
    image: "/media/product", description: "Catalog description", tagline: "Catalog tagline", notes: [], size: "100 ml",
  };
  const [resolved] = applyHeroProductPresentations([product], [{
    productId: "12", title: "Hero Passio", tagline: "", description: "Hero description", image: "",
  }]);
  assert.equal(resolved.name, "Hero Passio");
  assert.equal(resolved.description, "Hero description");
  assert.equal(resolved.tagline, "Catalog tagline");
  assert.equal(resolved.image, "/media/product");
});

test("hero presentation data is normalized before it reaches the storefront", () => {
  assert.deepEqual(normalizeHeroProductPresentations([
    { productId: "12", title: "Feature", tagline: null, description: 42, image: "javascript:alert(1)" },
    { productId: "invalid", title: "Ignored" },
  ]), [{ productId: "12", title: "Feature", tagline: "", description: "", image: "" }]);
});

test("storefront page configuration has no hardcoded content fallback", () => {
  const configuration = emptyStorefrontPageConfiguration();
  assert.equal(configuration.hero.title.accent, "");
  assert.equal(configuration.detail.title, "");
  assert.equal(configuration.detail.comingSoon.enabled, false);
  assert.deepEqual(configuration.hero.productIds, []);
});

test("storefront page configuration normalizes product selections and unsafe shapes", () => {
  const hero = normalizeStorefrontPageHero({
    eyebrow: "  Curated wardrobe  ",
    title: { lead: "Three", accent: "Moods" },
    highlights: ["One", "Two", "Three", "Ignored"],
    productIds: ["8", "8", "invalid", "9", "10", "11"],
  });
  const detail = normalizeStorefrontPageDetail({
    title: "A closer look",
    comingSoon: {
      enabled: true,
      eyebrow: "Private preview",
      title: "A new signature",
      description: "The next composition is taking shape.",
      image: "/media/preview-token",
    },
  });

  assert.deepEqual(hero.productIds, ["8", "9", "10"]);
  assert.deepEqual(hero.highlights, ["One", "Two", "Three"]);
  assert.equal(hero.intro, "");
  assert.deepEqual(Object.keys(detail), ["eyebrow", "title", "description", "credit", "comingSoon"]);
  assert.equal(detail.comingSoon.enabled, true);
  assert.equal(detail.comingSoon.title, "A new signature");
  assert.equal(normalizeStorefrontPageDetail({ comingSoon: { image: "javascript:alert(1)" } }).comingSoon.image, "");
  assert.equal(normalizeStorefrontPageDetail({ showComingSoon: true }).comingSoon.enabled, true);
  assert.equal(normalizeStorefrontPageDetail({ showComingSoon: "true" }).comingSoon.enabled, false);
  assert.equal(normalizeStorefrontPageHero({ highlights: ["Only one"] }).highlights.length, 3);
});

test("social media settings normalize supported web profiles safely", () => {
  assert.deepEqual(normalizeSocialMediaLinks(JSON.stringify([
    { platform: "instagram", url: "https://instagram.com/n7" },
    { platform: "x", url: "https://x.com/n7" },
    { platform: "instagram", url: "https://instagram.com/n7" },
    { platform: "unknown", url: "https://example.com" },
    { platform: "facebook", url: "javascript:alert(1)" },
  ])), [
    { platform: "instagram", url: "https://instagram.com/n7" },
    { platform: "x", url: "https://x.com/n7" },
  ]);
});
