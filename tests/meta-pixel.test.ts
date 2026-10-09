import assert from "node:assert/strict";
import test from "node:test";
import { Script } from "node:vm";
import { MetaPixelTransport, type MetaPixelPortFactory } from "../lib/meta/pixel-transport";
import { metaPixelFrameDocument, metaPixelFrameRuntime, type MetaPixelFrameOptions } from "../lib/meta/pixel-frame-runtime";
import { metaCampaignParameters } from "../lib/meta/browser-policy";
import { metaMatchingKeys } from "../lib/meta/matching";
import { hashMetaValue, metaExternalId } from "../lib/meta/identity";
import { metaEventNames, type MetaBrowserEvent } from "../lib/meta/shared";

const options: MetaPixelFrameOptions = { channel: "2ef61694-e154-488b-84d0-9a5a5ba52e80", pixelId: "1603887767158736", externalId: metaExternalId("frame-test"), matchingKeys: metaMatchingKeys, campaignKeys: metaCampaignParameters, eventNames: [...metaEventNames, "Purchase"] };
const base: MetaBrowserEvent = { pixelId: options.pixelId, externalId: options.externalId, name: "PageView", eventId: "synthetic-event", data: {} };
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));

test("Pixel transport cancels loading frames on withdrawal and retries without marking events sent", async () => {
  const ports: { receive(message: unknown): void; channel: string; removed: boolean }[] = [];
  const factory: MetaPixelPortFactory = (channel, receive) => {
    const port = { channel, receive, removed: false }; ports.push(port);
    return { post() {}, remove() { port.removed = true; } };
  };
  const transport = new MetaPixelTransport(factory);
  transport.configure(base.pixelId, base.externalId, false);
  assert.equal(await transport.send(base, "https://n7.test/"), false); assert.equal(ports.length, 0);
  transport.configure(base.pixelId, base.externalId, true);
  const pending = transport.send(base, "https://n7.test/");
  transport.configure(base.pixelId, base.externalId, false);
  assert.equal(await pending, false); assert.equal(ports[0].removed, true);
  ports[0].receive({ type: "n7:meta-pixel-ready", channel: ports[0].channel });
  transport.configure(base.pixelId, base.externalId, true);
  const retry = transport.send(base, "https://n7.test/");
  const replacement = ports[1]; assert.ok(replacement);
  replacement.receive({ type: "n7:meta-pixel-error", channel: replacement.channel });
  assert.equal(await retry, false); assert.equal(replacement.removed, true);
  assert.equal(await transport.send(base, "https://n7.test/?payment_intent_client_secret=private"), false);
  const justReady = transport.send(base, "https://n7.test/");
  const old = ports.at(-1)!;
  old.receive({ type: "n7:meta-pixel-ready", channel: old.channel });
  transport.configure(base.pixelId, base.externalId, false);
  transport.configure(base.pixelId, base.externalId, true);
  assert.equal(await justReady, false, "An already-ready retired document cannot resume after rapid withdrawal/regrant");
  transport.configure(base.pixelId, base.externalId, false);
});

test("Blocked frame creation leaves CAPI available and creates no unresolved transport", async () => {
  const transport = new MetaPixelTransport(() => { throw new Error("Frame blocked"); });
  transport.configure(base.pixelId, base.externalId, true);
  assert.equal(await transport.send(base, "https://n7.test/"), false);
  assert.equal(await transport.send(base, "https://n7.test/"), false);
  transport.configure(base.pixelId, base.externalId, false);
});

test("Frame messaging failures cannot interrupt consent withdrawal or mark an event queued", async () => {
  let receive: (message: unknown) => void = () => undefined;
  let channel = "";
  const transport = new MetaPixelTransport((id, listener) => {
    channel = id; receive = listener;
    return { post() { throw new Error("Detached document"); }, remove() { throw new Error("Already removed"); } };
  });
  transport.configure(base.pixelId, base.externalId, true);
  const loading = transport.send(base, "https://n7.test/");
  receive({ type: "n7:meta-pixel-loaded", channel });
  assert.equal(await loading, false);
  transport.configure(base.pixelId, base.externalId, true);
  const ready = transport.send(base, "https://n7.test/");
  receive({ type: "n7:meta-pixel-ready", channel });
  assert.equal(await ready, false);
  assert.doesNotThrow(() => transport.configure(base.pixelId, base.externalId, false));
});

test("Pixel frame uses canonical hashes, public SDK calls, a clean source URL and consent-safe messaging", () => {
  const globals = ["window", "document", "location", "history"];
  const originals = globals.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  let receive: (message: Record<string, unknown>) => void = () => undefined;
  const replies: unknown[] = [], calls: unknown[][] = [], scripts: { onload?: () => void; src?: string }[] = [], urls: unknown[] = [];
  const parent = { postMessage(message: unknown) { replies.push(message); } };
  const values = [
    { parent, addEventListener(_type: string, handler: typeof receive) { receive = handler; } },
    { createElement() { return {}; }, head: { appendChild(script: typeof scripts[number]) { scripts.push(script); } } },
    { origin: "https://n7.test" }, { replaceState(_state: unknown, _unused: string, url: unknown) { urls.push(url); } },
  ];
  globals.forEach((key, i) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: values[i] }));
  const send = (data: unknown, origin = "https://n7.test", source = parent) => receive({ origin, source, data });
  try {
    metaPixelFrameRuntime(options);
    assert.equal(scripts.length, 0, "Loading a consent document alone does not contact Meta");
    const init = { type: "n7:meta-pixel-init", channel: options.channel, pixelId: options.pixelId, externalId: options.externalId, matching: { em: hashMetaValue("synthetic@example.test"), ph: "unhashed-phone", line1: "private-address" }, url: "https://n7.test/checkout?utm_campaign=public" };
    send(init, "https://foreign.test"); send({ ...init, channel: "wrong-channel" });
    assert.equal(scripts.length, 0);
    send(init);
    assert.deepEqual(urls, ["/checkout?utm_campaign=public"]);
    assert.equal(scripts[0].src, "https://connect.facebook.net/en_US/fbevents.js");
    const sdk = window.fbq; assert.ok(sdk);
    sdk.callMethod = (...args) => calls.push(args);
    for (const args of sdk.queue.splice(0)) sdk.callMethod(...args);
    scripts[0].onload?.();
    assert.deepEqual(calls.find(args => args[0] === "init"), ["init", options.pixelId, { external_id: options.externalId, em: hashMetaValue("synthetic@example.test") }]);
    assert.ok(calls.some(args => args[0] === "set" && args[1] === "autoConfig" && args[2] === false && args[3] === options.pixelId), "Only explicit storefront calls generate events");
    const event = { ...base, name: "ViewCategory", matching: init.matching, data: { content_name: "For him", line1: "private-address" } };
    send({ type: "n7:meta-pixel-event", channel: options.channel, event });
    assert.deepEqual(calls.at(-1), ["trackSingleCustom", options.pixelId, "ViewCategory", { content_name: "For him" }, { eventID: base.eventId }]);
    const count = calls.length;
    send({ type: "n7:meta-pixel-event", channel: options.channel, event });
    assert.equal(calls.length, count, "An acknowledged retry cannot duplicate a browser hit");
    send({ type: "n7:meta-pixel-event", channel: options.channel, event: { ...event, eventId: "wrong-profile", matching: { em: hashMetaValue("another@example.test") } } });
    assert.equal(calls.length, count, "A changed buyer must use a fresh document");
    send({ type: "n7:meta-pixel-revoke", channel: options.channel });
    assert.deepEqual(calls.at(-1), ["consent", "revoke"]);
    const revoked = calls.length;
    send(init); send({ type: "n7:meta-pixel-event", channel: options.channel, event: { ...event, eventId: "late-event" } });
    scripts[0].onload?.();
    assert.equal(calls.length, revoked, "Late messages/script completion cannot restore withdrawn consent");
    assert.equal(JSON.stringify(calls).includes("private-address"), false);
    assert.ok(replies.some(value => object(value) && value.type === "n7:meta-pixel-queued"));
  } finally {
    globals.forEach((key, i) => { const original = originals[i]; if (original) Object.defineProperty(globalThis, key, original); else Reflect.deleteProperty(globalThis, key); });
  }
});

test("Serialized frame runtime is self-contained JavaScript and rejects credentials in its source URL", () => {
  const html = metaPixelFrameDocument({ ...options, channel: "</script><script>bad()" });
  assert.equal(html.includes("</script><script>bad()"), false);
  const source = html.match(/<script>([\s\S]*)<\/script>/)?.[1]; assert.ok(source);
  assert.doesNotThrow(() => new Script(source));
  const messages: unknown[] = [], scripts: unknown[] = [];
  let handler: (message: unknown) => void = () => undefined;
  const parent = { postMessage(value: unknown) { messages.push(value); } };
  const context = { window: { parent, addEventListener(_type: string, listener: typeof handler) { handler = listener; } }, location: { origin: "https://n7.test" }, history: { replaceState() { assert.fail("Private URLs cannot reach SDK initialization"); } }, document: { createElement() { scripts.push({}); } }, URL, setTimeout };
  new Script(metaPixelFrameDocument(options).match(/<script>([\s\S]*)<\/script>/)?.[1] ?? "").runInNewContext(context);
  handler({ origin: "https://n7.test", source: parent, data: { type: "n7:meta-pixel-init", channel: options.channel, pixelId: options.pixelId, externalId: options.externalId, url: "https://n7.test/checkout/confirmation?key=private", matching: {} } });
  assert.equal(scripts.length, 0);
  assert.ok(messages.some(value => object(value) && value.type === "n7:meta-pixel-error"));
});
