import assert from "node:assert/strict";
import test from "node:test";
import { getRedirectUrl, unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import nextConfig from "../next.config";

const origin = "https://n7cosmetics.co.uk";

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

test("current collections and unrelated routes are not caught by legacy redirects", async () => {
  for (const path of [
    "/", "/yusuf-bhai-originals", "/yusuf-bhai-originals/teeb",
    "/products/tar", "/checkout", "/api/payments/stripe/webhook",
    "/product-category/yusuf-bhai-originals/unknown",
    "/product-category/yusuf-bhai-originals/page/invalid",
  ]) {
    assert.equal(await followConfiguredRedirects(path), `${origin}${path}`);
  }
});
