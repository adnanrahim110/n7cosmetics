import assert from "node:assert/strict";
import test from "node:test";
import { Script } from "node:vm";
import { TIKTOK_PIXEL_ID, tiktokPageUrl, tiktokPixelDocument } from "../lib/tiktok/pixel";
import { stopTikTok, stopTikTokPage, trackTikTokPage } from "../lib/tiktok/client";

test("TikTok page URLs keep campaign identifiers and exclude receipt, payment and search details", () => {
  assert.equal(tiktokPageUrl("https://n7.test/checkout/confirmation?key=receipt&payment_intent_client_secret=secret&ttclid=E.C.P.click&utm_source=tiktok#private", "https://n7.test"),
    "/checkout/confirmation?ttclid=E.C.P.click&utm_source=tiktok");
  assert.equal(tiktokPageUrl("/products/fragrance?q=private&email=private", "https://n7.test"), "/products/fragrance");
  for (const value of ["", "https://other.test/", "/admin", "/admin/orders", "/api/payments", "/media/private", "/newsletter/unsubscribe?token=private", "javascript:alert(1)"])
    assert.equal(tiktokPageUrl(value, "https://n7.test"), null);
});

test("The supplied TikTok pixel initializes once with held consent, a grant and one page view", () => {
  const scripts: { src: string; async: boolean; referrerPolicy: string }[] = [];
  const pages: string[] = [];
  const context = {
    window: {} as { ttq?: unknown[][] },
    document: {
      createElement() { return {}; },
      head: { appendChild(script: typeof scripts[number]) { scripts.push(script); } },
    },
    history: { replaceState(_state: unknown, _title: string, page: string) { pages.push(page); } },
  };
  const html = tiktokPixelDocument("/products/fragrance?ttclid=E.C.P.click");
  const source = html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(source);
  new Script(source).runInNewContext(context);
  assert.deepEqual(pages, ["/products/fragrance?ttclid=E.C.P.click"]);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_PIXEL_ID}&lib=ttq`);
  assert.equal(scripts[0].async, true);
  assert.equal(scripts[0].referrerPolicy, "no-referrer");
  assert.deepEqual(Array.from(context.window.ttq ?? [], call => call[0]), ["holdConsent", "grantConsent", "page"]);
  assert.equal(tiktokPixelDocument('</script><script>alert(1)</script>').includes('</script><script>alert(1)'), false);
});

test("TikTok navigation replaces its document, keeps attribution cookies and withdrawal removes both", () => {
  const frames: { src: string; hidden: boolean; referrerPolicy: string; removed: boolean; remove(): void }[] = [];
  const writes: string[] = [];
  const location = { href: "https://n7.test/?ttclid=click", origin: "https://n7.test", hostname: "n7.test" };
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalLocation = Object.getOwnPropertyDescriptor(globalThis, "location");
  Object.defineProperty(globalThis, "location", { configurable: true, value: location });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    get cookie() { return "_ttp=attribution; ttcsid_pixel=session; basket=keep"; },
    set cookie(value: string) { writes.push(value); },
    createElement() { return { removed: false, remove() { this.removed = true; } }; },
    body: { appendChild(frame: typeof frames[number]) { frames.push(frame); } },
  } });
  try {
    trackTikTokPage(); trackTikTokPage();
    assert.equal(frames.length, 1);
    assert.equal(frames[0].hidden, true);
    assert.equal(frames[0].referrerPolicy, "no-referrer");
    assert.equal(new URL(frames[0].src, location.origin).searchParams.get("page"), "/?ttclid=click");
    stopTikTokPage();
    assert.equal(frames[0].removed, true);
    assert.equal(writes.length, 0, "Navigation retains attribution cookies");
    location.href = "https://n7.test/checkout/confirmation?key=receipt&payment_intent_client_secret=private";
    trackTikTokPage();
    assert.equal(frames.length, 2);
    assert.equal(frames[1].src.includes("receipt"), false);
    assert.equal(frames[1].src.includes("private"), false);
    stopTikTok();
    assert.equal(frames[1].removed, true);
    assert.ok(writes.some(value => value.startsWith("_ttp=; Max-Age=0")));
    assert.ok(writes.some(value => value.startsWith("ttcsid_pixel=; Max-Age=0")));
    assert.equal(writes.some(value => value.startsWith("basket=")), false);
    location.href = "https://n7.test/admin";
    trackTikTokPage();
    assert.equal(frames.length, 2);
  } finally {
    stopTikTokPage();
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
    if (originalLocation) Object.defineProperty(globalThis, "location", originalLocation);
    else Reflect.deleteProperty(globalThis, "location");
  }
});
