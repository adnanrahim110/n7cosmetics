import assert from "node:assert/strict";
import test from "node:test";
import { getRedirectUrl, unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import nextConfig from "../next.config";

const origin = "https://n7cosmetics.co.uk";

test("WordPress product links permanently redirect to their product and retain ad click parameters", async () => {
  const response = await unstable_getResponseFromNextConfig({ url: `${origin}/product/pour-homme?fbclid=real-ad-click&utm_source=facebook`, nextConfig });
  assert.equal(response.status, 308);
  assert.equal(getRedirectUrl(response), `${origin}/products/pour-homme?fbclid=real-ad-click&utm_source=facebook`);
  for (const suffix of ["", "/"]) {
    assert.equal(await followConfiguredRedirects(`/product/pour-homme${suffix}`), `${origin}/products/pour-homme`);
    assert.equal(await followConfiguredRedirects(`/product/nostalgia${suffix}`), `${origin}/products/nostalgia`);
  }
});

test("Renamed WordPress products reach the verified current slug without an intermediate product redirect", async () => {
  const mappings = [
    ["rendevous", "rendezvous"], ["legendary", "legendry"],
    ["costa-azzura", "costa-azzurra"], ["jadore", "j-adore"],
    ["blue-de-chanel", "bleu-de-chanel"], ["bvlgari-le-gemme", "bvlgari-le-gemme-tygar"],
    ["myrhh-and-tonka", "myrrh-tonka"], ["moonlight-pathcholi", "moonlight-patchouli"],
    ["allure-home-sport", "allure-homme-sport"], ["terre-de-hermes", "terre-d-hermes"],
    ["devoir-elixer", "devoir-elixir"],
  ];
  for (const [oldSlug, slug] of mappings) {
    for (const prefix of ["product", "products"]) {
      const response = await unstable_getResponseFromNextConfig({ url: `${origin}/${prefix}/${oldSlug}`, nextConfig });
      assert.equal(response.status, 308);
      assert.equal(getRedirectUrl(response), `${origin}/products/${slug}`);
      assert.equal(await followConfiguredRedirects(`/${prefix}/${oldSlug}/?utm_source=google`), `${origin}/products/${slug}?utm_source=google`);
    }
  }
});

test("Legacy bundles reach their bundle pages rather than unavailable standard-product pages", async () => {
  for (const slug of [
    "allure-home-sport-sauvage-legendary", "city-walk-xs-night-extreme-indian-funk",
    "dark-moon-indian-funk-domestic-noir", "goddess-burberry-good-girl-forbidden-love",
    "jadore-ysl-libre-french-oud", "noir-extreme-forbidden-love-french-oud",
  ]) {
    for (const prefix of ["product", "products"]) {
      const response = await unstable_getResponseFromNextConfig({ url: `${origin}/${prefix}/${slug}`, nextConfig });
      assert.equal(response.status, 308);
      assert.equal(getRedirectUrl(response), `${origin}/bundles/${slug}`);
      assert.equal(await followConfiguredRedirects(`/${prefix}/${slug}/`), `${origin}/bundles/${slug}`);
    }
  }
});

async function followConfiguredRedirects(path: string): Promise<string> {
  let url = `${origin}${path}`;
  for (let hop = 0; hop < 4; hop++) {
    const response = await unstable_getResponseFromNextConfig({ url, nextConfig });
    const destination = getRedirectUrl(response);
    if (!destination) return url;
    assert.equal(response.status, 308, "Legacy redirects must be permanent");
    url = destination;
  }
  assert.fail(`Redirect loop or excessive chain for ${path}`);
}

test("legacy originals URLs reach the current collection, preserving query parameters", async () => {
  for (const path of [
    "/product-category/yusuf-bhai-originals",
    "/product-category/yusuf-bhai-originals/",
    "/product-category/yusuf-bhai-originals/page/2/",
  ]) {
    assert.equal(await followConfiguredRedirects(path), `${origin}/yusuf-bhai-originals`);
    assert.equal(
      await followConfiguredRedirects(`${path}?product-page=1&utm_source=google`),
      `${origin}/yusuf-bhai-originals?product-page=1&utm_source=google`,
    );
  }
});

test("legacy originals subcategories retain their matching destinations", async () => {
  for (const category of ["deja-vu", "noble", "teeb"]) {
    for (const suffix of ["", "/", "/page/2/"]) {
      assert.equal(
        await followConfiguredRedirects(`/product-category/yusuf-bhai-originals/${category}${suffix}`),
        `${origin}/yusuf-bhai-originals/${category}`,
      );
    }
  }
});

test("Other migrated collection archives and equivalent WordPress pages retain their destinations", async () => {
  for (const [source, destination] of [
    ["recreation", "recreations"], ["recreations", "recreations"],
    ["recreations/yusuf-bhai-inspired-by", "recreations"],
    ["premium-collection", "premium-collection"], ["bundles", "bundles"],
  ]) {
    for (const suffix of ["", "/", "/page/2/"]) {
      assert.equal(await followConfiguredRedirects(`/product-category/${source}${suffix}?utm_source=google`), `${origin}/${destination}?utm_source=google`);
    }
  }
  for (const [source, destination] of [
    ["/home", "/"], ["/contact-us", "/contact"], ["/privacy-policy", "/privacy"], ["/shipping-and-returns", "/shipping-returns"],
    ["/buy-5-get-1-free", "/sale/buy-5-get-1-free"],
  ]) {
    assert.equal(await followConfiguredRedirects(`${source}/`), `${origin}${destination}`);
  }
});

test("current collections and unrelated routes are not caught by legacy redirects", async () => {
  for (const path of [
    "/", "/yusuf-bhai-originals", "/yusuf-bhai-originals/teeb",
    "/products/tar", "/checkout", "/api/payments/stripe/webhook",
    "/product-category/yusuf-bhai-originals/unknown",
    "/product-category/yusuf-bhai-originals/page/invalid",
    "/product/pour-homme/extra", "/product-category/unknown", "/blogs/current-article",
    "/product-category/sale", "/product-category/yusuf-bhai-originals/pour-homme",
    "/product-category/yusuf-bhai-originals/pour-femme", "/product-category/yusuf-bhai-originals/tar",
  ]) {
    assert.equal(await followConfiguredRedirects(path), `${origin}${path}`);
  }
});
