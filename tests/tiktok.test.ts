import assert from "node:assert/strict";
import test from "node:test";
import { Script } from "node:vm";
import { TIKTOK_PIXEL_ID, tiktokCampaignKeys, tiktokPageUrl, safeTikTokPixelLocation } from "../lib/tiktok/pixel";
import { tiktokPixelFrameDocument, type TikTokPixelFrameOptions } from "../lib/tiktok/pixel-frame-runtime";
import { tiktokContact, tiktokExternalId } from "../lib/tiktok/identity";
import { tiktokEventSchema, tiktokEventNames, tiktokMatching, tiktokProperties, tiktokPurchaseId, type TikTokBrowserEvent } from "../lib/tiktok/shared";
import { TikTokPixelTransport } from "../lib/tiktok/pixel-transport";
import { tiktokRequest, TikTokApiError } from "../lib/tiktok/api";
import { hashMetaValue } from "../lib/meta/identity";
import { captureTikTokLandingClick, configureTikTok, stopTikTok, trackTikTok } from "../lib/tiktok/client";

test("TikTok URLs preserve campaign attribution and remove receipt, payment, search and private routes", () => {
  assert.equal(tiktokPageUrl("https://n7.test/checkout/confirmation?key=receipt&payment_intent_client_secret=secret&ttclid=click&utm_source=tiktok#private", "https://n7.test"), "/checkout/confirmation?ttclid=click&utm_source=tiktok");
  assert.equal(tiktokPageUrl("/products/fragrance?q=private&email=private", "https://n7.test"), "/products/fragrance");
  for (const value of ["", "https://other.test/", "/admin", "/api/payments", "/media/private", "/newsletter/unsubscribe?token=private", "javascript:alert(1)"]) assert.equal(tiktokPageUrl(value, "https://n7.test"), null);
  assert.equal(safeTikTokPixelLocation("https://n7.test/?ttclid=click&fbclid=click", ""), true);
  assert.equal(safeTikTokPixelLocation("https://n7.test/?key=private", ""), false);
  assert.equal(safeTikTokPixelLocation("https://n7.test/", "https://n7.test/?payment_intent_client_secret=private"), false);
});

test("TikTok matching uses lowercased email and E.164 phone hashes, excludes raw data and preserves large catalogue IDs", () => {
  assert.deepEqual(tiktokContact(" Buyer@Example.test ", "07123 456789"), { email: hashMetaValue("buyer@example.test"), phone: hashMetaValue("+447123456789") });
  assert.deepEqual(tiktokContact("", "invalid"), {});
  assert.deepEqual(tiktokMatching({ email: "raw@example.test", phone: "07123" }), {});
  const data = tiktokProperties({ content_type: "product", content_ids: ["n7_variant_9007199254740993"], contents: [{ id: "n7_variant_9007199254740993", quantity: 2, item_price: 17.25 }], currency: "GBP", value: 38.49, num_items: 2 }, "42");
  assert.deepEqual(data.contents, [{ content_id: "n7_variant_9007199254740993", quantity: 2, price: 17.25 }]);
  assert.equal(data.order_id, "42"); assert.equal(data.value, 38.49);
  const event = { name: "AddToCart", eventId: crypto.randomUUID(), path: "/products/fragrance", items: [{ slug: "fragrance", quantity: 1 }] };
  assert.equal(tiktokEventSchema.safeParse(event).success, true);
  assert.equal(tiktokEventSchema.safeParse({ ...event, name: "Purchase" }).success, false);
  assert.equal(tiktokEventSchema.safeParse({ ...event, value: 0.01 }).success, false);
  assert.equal(tiktokPurchaseId("42"), "n7_tiktok_purchase_42");
});

const options: TikTokPixelFrameOptions = { channel: crypto.randomUUID(), pixelId: TIKTOK_PIXEL_ID, externalId: tiktokExternalId("fixture"), campaignKeys: tiktokCampaignKeys, eventNames: [...tiktokEventNames, "Purchase"] };
const event: TikTokBrowserEvent = { pixelId: options.pixelId, externalId: options.externalId, eventId: "fixture-event", name: "Purchase", data: { value: 24.99, currency: "GBP" }, matching: { external_id: options.externalId } };

function frame() {
  const listeners = new Map<string, ((event: unknown) => void)[]>();
  const messages: unknown[] = [], scripts: Record<string, unknown>[] = [], pages: string[] = [];
  const parent = { postMessage(value: unknown) { messages.push(value); } };
  const window: { parent: typeof parent; ttq?: unknown[][] & Record<string, unknown>; addEventListener(type: string, fn: (event: unknown) => void): void; dispatchEvent(event: Event): void } = {
    parent,
    addEventListener(type, fn) { listeners.set(type, [...(listeners.get(type) ?? []), fn]); },
    dispatchEvent(event) { for (const fn of listeners.get(event.type) ?? []) fn(event); },
  };
  const context = { window, document: { createElement() { return {}; }, head: { appendChild(script: Record<string, unknown>) { scripts.push(script); } } }, history: { replaceState(_state: unknown, _title: string, path: string) { pages.push(path); } }, location: { origin: "https://n7.test" }, URL, Event, Set };
  const source = tiktokPixelFrameDocument(options).match(/<script>([\s\S]*)<\/script>/)?.[1];
  assert.ok(source); new Script(source).runInNewContext(context);
  const send = (value: object, origin = "https://n7.test", source: unknown = parent) => { for (const fn of listeners.get("message") ?? []) fn({ origin, source, data: { channel: options.channel, ...value } }); };
  return { window, send, scripts, messages, pages };
}

test("The isolated SDK loads only after trusted initialization, identifies hashed fields, and deduplicates explicit Pageview/Purchase calls", () => {
  const f = frame();
  assert.equal(f.scripts.length, 0);
  const init = { type: "n7:tiktok-pixel-init", pixelId: options.pixelId, externalId: options.externalId, matching: event.matching, url: "https://n7.test/checkout/confirmation?utm_source=tiktok" };
  f.send(init, "https://attacker.test"); assert.equal(f.scripts.length, 0);
  f.send(init, "https://n7.test", {}); assert.equal(f.scripts.length, 0);
  f.send(init);
  assert.equal(f.scripts.length, 1);
  assert.equal(f.scripts[0].src, `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_PIXEL_ID}&lib=ttq`);
  assert.deepEqual(f.pages, ["/checkout/confirmation?utm_source=tiktok"]);
  const queue = f.window.ttq; assert.ok(queue);
  assert.deepEqual(Array.from(queue, call => call[0]), ["holdConsent", "grantConsent", "identify", "ready"]);
  const ready = queue.find(call => call[0] === "ready")?.[1]; assert.equal(typeof ready, "function"); if (typeof ready === "function") ready();
  f.send({ type: "n7:tiktok-pixel-event", event }); f.send({ type: "n7:tiktok-pixel-event", event });
  const tracks = queue.filter(call => call[0] === "track");
  assert.equal(tracks.length, 1); assert.equal(tracks[0][1], "Purchase");
  assert.equal(JSON.stringify(tracks[0][3]), JSON.stringify({ event_id: event.eventId, pixel_code: options.pixelId }));
  f.send({ type: "n7:tiktok-pixel-revoke" });
  const count = queue.length;
  f.send({ type: "n7:tiktok-pixel-event", event: { ...event, eventId: "late" } });
  assert.equal(queue.length, count);
});

test("The measurement document rejects sensitive URLs before SDK loading", () => {
  const f = frame();
  f.send({ type: "n7:tiktok-pixel-init", pixelId: options.pixelId, externalId: options.externalId, matching: event.matching, url: "https://n7.test/checkout/confirmation?key=private" });
  assert.equal(f.scripts.length, 0);
  assert.equal(tiktokPixelFrameDocument({ ...options, channel: "</script><script>bad</script>" }).includes("</script><script>bad"), false);
});

test("Transport authenticates messages, coalesces duplicate sends and cancels queued calls on withdrawal", async () => {
  const ports: { channel: string; receive(value: unknown): void; removed: boolean; posts: unknown[] }[] = [];
  const transport = new TikTokPixelTransport((channel, receive) => {
    const port = { channel, receive, removed: false, posts: [] as unknown[] }; ports.push(port);
    return { post(value) { port.posts.push(value); }, remove() { port.removed = true; } };
  });
  transport.configure(event.pixelId, event.externalId, true);
  const first = transport.send(event, "https://n7.test/");
  const duplicate = transport.send(event, "https://n7.test/");
  assert.equal(ports.length, 1);
  const port = ports[0];
  port.receive({ type: "n7:tiktok-pixel-ready", channel: "wrong" });
  port.receive({ type: "n7:tiktok-pixel-ready", channel: port.channel });
  await Promise.resolve(); await Promise.resolve();
  port.receive({ type: "n7:tiktok-pixel-queued", channel: port.channel, eventId: event.eventId });
  assert.deepEqual(await Promise.all([first, duplicate]), [true, true]);
  transport.configure(event.pixelId, event.externalId, false);
  assert.equal(port.removed, true);
  transport.configure(event.pixelId, event.externalId, true);
  const pending = transport.send({ ...event, eventId: "cancel" }, "https://n7.test/");
  transport.configure(event.pixelId, event.externalId, false);
  assert.equal(await pending, false);
});

test("Events API checks TikTok's JSON response code, sends tokens only in headers and sanitizes failures", async () => {
  const original = globalThis.fetch;
  let payload: unknown;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), "https://business-api.tiktok.com/open_api/v1.3/event/track/");
      assert.equal(new Headers(init?.headers).get("Access-Token"), "fixture-token");
      assert.equal(init?.redirect, "error"); payload = JSON.parse(String(init?.body));
      return Response.json({ code: 0, request_id: "fixture_request" });
    };
    assert.deepEqual(await tiktokRequest("fixture-token", { event_source: "web", data: [] }), { requestId: "fixture_request" });
    assert.deepEqual(payload, { event_source: "web", data: [] });
    globalThis.fetch = async () => Response.json({ code: 40001, message: "fixture-token private@example.test" });
    await assert.rejects(tiktokRequest("fixture-token", {}), error => error instanceof TikTokApiError && !error.retryable && !error.message.includes("fixture-token") && !error.message.includes("private@"));
    globalThis.fetch = async () => Response.json({ code: 40100 });
    await assert.rejects(tiktokRequest("fixture-token", {}), error => error instanceof TikTokApiError && error.retryable);
    globalThis.fetch = async () => Response.json({ message: "missing acknowledgment" });
    await assert.rejects(tiktokRequest("fixture-token", {}), TikTokApiError);
    globalThis.fetch = async () => { throw new Error("network"); };
    await assert.rejects(tiktokRequest("fixture-token", {}), error => error instanceof TikTokApiError && error.retryable);
  } finally { globalThis.fetch = original; }
});

test("Client tracking waits for consent, retries the same action, and a local opt-out overrides stale settings", async () => {
  const saved = new Map(["document", "location", "window", "localStorage"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const originalFetch = globalThis.fetch;
  const writes: string[] = [], requests: { eventId: string; name: string }[] = [];
  const cookies = new Map([["_ttp", "sdk-browser"], ["basket", "keep"]]);
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "location", { configurable: true, value: { href: "https://n7.test/?ttclid=actual.click", origin: "https://n7.test", hostname: "n7.test", pathname: "/", protocol: "https:" } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    referrer: "",
    get cookie() { return Array.from(cookies, ([name, value]) => `${name}=${value}`).join("; "); },
    set cookie(value: string) { writes.push(value); const pair = value.split(";")[0], index = pair.indexOf("="); const name = pair.slice(0, index); if (value.includes("Max-Age=0")) cookies.delete(name); else cookies.set(name, pair.slice(index + 1)); },
  } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { dispatchEvent() {} } });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { get length() { return storage.size; }, key(index: number) { return Array.from(storage.keys())[index] ?? null; }, getItem(key: string) { return storage.get(key) ?? null; }, removeItem(key: string) { storage.delete(key); } } });
  globalThis.fetch = async (_url, init) => {
    const input = JSON.parse(String(init?.body)); requests.push(input);
    return requests.length === 1 ? new Response(null, { status: 503 }) : Response.json({ ...event, pixelId: "", name: input.name, eventId: input.eventId });
  };
  try {
    captureTikTokLandingClick();
    configureTikTok({ enabled: false, pixelId: "", consent: "unknown" });
    await trackTikTok("Pageview");
    assert.equal(requests.length, 0); assert.equal(writes.length, 0);
    configureTikTok({ enabled: true, pixelId: "", consent: "granted", externalId: options.externalId });
    assert.equal(cookies.get("ttclid"), "actual.click");
    assert.equal(writes.some(value => value.startsWith("_ttp=")), false, "Only the official SDK creates its browser identifier");
    await trackTikTok("AddToCart", [{ slug: "fragrance", quantity: 1 }]);
    assert.equal(requests.length, 2); assert.equal(requests[0].eventId, requests[1].eventId);
    cookies.set("n7_marketing_optout", "1");
    configureTikTok({ enabled: true, pixelId: "", consent: "granted", externalId: options.externalId });
    await trackTikTok("Pageview");
    assert.equal(requests.length, 2);
    assert.equal(cookies.has("ttclid"), false); assert.equal(cookies.has("_ttp"), false); assert.equal(cookies.get("basket"), "keep");
  } finally {
    stopTikTok(); globalThis.fetch = originalFetch;
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
