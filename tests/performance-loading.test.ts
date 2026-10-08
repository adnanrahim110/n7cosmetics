import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { scheduleAfterLoad } from "../lib/browser/schedule-after-load";
import { storefrontAssets, optimisedVideoSource, videoPoster, brandFilmVideoSource } from "../lib/media/storefront-assets";
import { readPublicStripeConfig, disabledStripeConfig } from "../lib/payments/public-config";
import { createSharedPaymentLoader } from "../lib/payments/shared-loader";

test("payment settings serialize only an enabled flag and a valid publishable key", () => {
  const publishableKey = "pk_live_" + "a".repeat(24);
  assert.deepEqual(readPublicStripeConfig({ enabled: true, publishableKey, secretKey: "private", webhookSecret: "private", revision: "private" }), { enabled: true, publishableKey });
  for (const value of [null, {}, { enabled: false, publishableKey }, { enabled: "true", publishableKey }, { enabled: true, publishableKey: "sk_live_private" }]) assert.deepEqual(readPublicStripeConfig(value), disabledStripeConfig);
});

test("PDP, cart and checkout share pending and completed Stripe initialization", async () => {
  let calls = 0;
  let release: (value: { key: string }) => void = () => undefined;
  const waiting = new Promise<{ key: string }>(resolve => { release = resolve; });
  const load = createSharedPaymentLoader(async () => { calls++; return waiting; });
  const pdp = load("key"), cart = load("key"), checkout = load("key");
  assert.equal(pdp, cart); assert.equal(cart, checkout);
  await Promise.resolve();
  assert.equal(calls, 1);
  release({ key: "key" });
  assert.deepEqual(await pdp, { key: "key" });
  assert.equal(load("key"), pdp, "A later route reuses the ready instance");
  assert.equal(calls, 1);
});

test("payment initialization failures are contained and a later mount can recover", async () => {
  let calls = 0;
  const load = createSharedPaymentLoader(async key => {
    calls++;
    if (calls === 1) throw new Error("Temporary script outage");
    return { key };
  });
  assert.equal(await load("key"), null);
  assert.deepEqual(await load("key"), { key: "key" });
  assert.equal(calls, 2);
});

test("a new payment key initializes independently of the previous account", async () => {
  const calls: string[] = [];
  const load = createSharedPaymentLoader(async key => { calls.push(key); return { key }; });
  const first = load("old"), next = load("new");
  assert.notEqual(first, next);
  assert.deepEqual(await next, { key: "new" });
  assert.deepEqual(await first, { key: "old" });
  assert.deepEqual(calls, ["old", "new"]);
});

function environment({ complete = false, idle = true } = {}) {
  const listeners = new Map<string, () => void>();
  const callbacks = new Map<number, () => void>();
  const cancelled: number[] = [];
  let nextId = 0;
  const enqueue = (callback: () => void) => { callbacks.set(++nextId, callback); return nextId; };
  const cancel = (id: number) => { callbacks.delete(id); cancelled.push(id); };
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    addEventListener: (name: string, callback: () => void) => listeners.set(name, callback),
    removeEventListener: (name: string) => listeners.delete(name),
    setTimeout: enqueue,
    clearTimeout: cancel,
    ...(idle ? { requestIdleCallback: enqueue, cancelIdleCallback: cancel } : {}),
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { readyState: complete ? "complete" : "loading" } });
  return {
    listeners, callbacks, cancelled,
    restore() {
      if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
      else Reflect.deleteProperty(globalThis, "window");
      if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
      else Reflect.deleteProperty(globalThis, "document");
    },
  };
}

test("optional startup work waits for load and an idle slot", () => {
  const fixture = environment();
  try {
    let calls = 0;
    scheduleAfterLoad(() => calls++);
    assert.equal(fixture.callbacks.size, 0);
    fixture.listeners.get("load")?.();
    assert.equal(calls, 0);
    fixture.callbacks.get(1)?.();
    assert.equal(calls, 1);
  } finally { fixture.restore(); }
});

test("unmount before load prevents later media activation", () => {
  const fixture = environment();
  try {
    let calls = 0;
    const cancel = scheduleAfterLoad(() => calls++);
    const pendingLoad = fixture.listeners.get("load");
    cancel();
    pendingLoad?.();
    assert.equal(fixture.listeners.size, 0);
    assert.equal(fixture.callbacks.size, 0);
    assert.equal(calls, 0);
  } finally { fixture.restore(); }
});

test("queued callbacks cannot activate a disposed component", () => {
  const fixture = environment({ complete: true });
  try {
    let calls = 0;
    const cancel = scheduleAfterLoad(() => calls++);
    const queued = fixture.callbacks.get(1);
    cancel();
    queued?.();
    assert.deepEqual(fixture.cancelled, [1]);
    assert.equal(calls, 0);
  } finally { fixture.restore(); }
});

test("browsers without idle callbacks retain cancellable media startup", () => {
  const fixture = environment({ complete: true, idle: false });
  try {
    let calls = 0;
    const cancel = scheduleAfterLoad(() => calls++);
    fixture.callbacks.get(1)?.();
    assert.equal(calls, 1);
    cancel();
    assert.deepEqual(fixture.cancelled, [1]);
  } finally { fixture.restore(); }
});

test("immutable asset URLs resolve to files with matching content hashes", () => {
  for (const asset of Object.values(storefrontAssets)) {
    const buffer = readFileSync(`public${asset}`);
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    assert.ok(asset.includes(`.${hash}.`), `${asset} must be renamed when its content changes`);
  }
});

test("custom admin-selected videos never receive another film's source or poster", () => {
  for (const source of ["/media/12345678-1234-1234-1234-123456789012", "https://example.com/custom.mp4", "/videos/another.mp4"]) {
    assert.equal(optimisedVideoSource(source), source);
    assert.equal(videoPoster(source), undefined);
    assert.equal(brandFilmVideoSource(source, "mobile-portrait"), source);
    assert.equal(brandFilmVideoSource(source, "mobile-landscape"), source);
  }
});

test("the homepage film uses matching mobile variants without altering desktop or other films", () => {
  for (const source of ["/videos/v2.mp4", storefrontAssets.brandFilm]) {
    assert.equal(brandFilmVideoSource(source, "desktop"), storefrontAssets.brandFilm);
    assert.equal(brandFilmVideoSource(source, "mobile-portrait"), storefrontAssets.brandFilmMobile);
    assert.equal(brandFilmVideoSource(source, "mobile-landscape"), storefrontAssets.brandFilmMobileLandscape);
  }
  assert.equal(brandFilmVideoSource("/videos/v1.mp4", "mobile-portrait"), storefrontAssets.detailFilm);
  assert.equal(videoPoster(storefrontAssets.brandFilmMobile), storefrontAssets.brandFilmPoster);
  assert.equal(videoPoster(storefrontAssets.brandFilmMobileLandscape), storefrontAssets.brandFilmPoster);
});
