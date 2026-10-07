import assert from "node:assert/strict";
import test from "node:test";
import { metaCommerceData, metaContentId, metaEventSchema, metaSettingsSchema, purchaseEventId, safeEventPath } from "../lib/meta/shared";
import { capiReady, defaultMetaSettings, pixelReady, reportingReady } from "../lib/meta/settings";
import { hashMetaValue, metaExternalId, metaMatchData, normalizeMetaPhone, preserveMetaRegion, requestUserData } from "../lib/meta/identity";
import { metaAdvancedMatching } from "../lib/meta/matching";
import { clientIpAddress } from "../lib/http/client-ip";
import { metaMatchingCoverage } from "../lib/meta/matching-coverage";
import { readMetaJson } from "../lib/meta/http";
import { metaClickCookie, metaLandingClick, safeMetaPixelLocation } from "../lib/meta/browser-policy";
import { deliverMetaClientEvent } from "../lib/meta/client-delivery";
import { metaDeliveryStatus, type MetaDeliveryInput } from "../lib/meta/delivery-status";
import { captureMetaLandingClick, configureMeta, sendMetaBrowserEvent, stopMeta, suspendMeta, updateMetaMatching } from "../lib/meta/client";
import { checkoutMetaMatching, metaMatchingInputSchema } from "../lib/meta/matching-input";
import { runMetaWorker, type MetaWorkerTasks } from "../lib/meta/worker";

test("A slow conversion queue does not delay catalogue processing", async () => {
  let release: (count: number) => void = () => undefined;
  const waiting = new Promise<number>(resolve => { release = resolve; });
  let catalogueProcessed = false;
  const heartbeats: boolean[] = [];
  const tasks: MetaWorkerTasks = {
    events: () => waiting,
    catalogue: async () => { catalogueProcessed = true; return 0; },
    health: async success => { heartbeats.push(success); },
    report: () => assert.fail("Successful tasks should not report failure"),
  };
  const running = runMetaWorker(new AbortController().signal, { once: true }, tasks);
  assert.equal(catalogueProcessed, true);
  release(0); await running;
  assert.deepEqual(heartbeats, [true]);
});

test("Conversion failure records a failed heartbeat without stopping catalogue work", async () => {
  const heartbeats: boolean[] = [], failures: string[] = [];
  let catalogueProcessed = false;
  await runMetaWorker(new AbortController().signal, { once: true }, {
    events: async () => { throw new Error("Unavailable"); },
    catalogue: async () => { catalogueProcessed = true; return 0; },
    health: async success => { heartbeats.push(success); },
    report: source => { failures.push(source); },
  });
  assert.equal(catalogueProcessed, true);
  assert.deepEqual(heartbeats, [false]); assert.deepEqual(failures, ["events"]);
});

test("An aborted worker cannot start another delivery or catalogue operation", async () => {
  const controller = new AbortController(); controller.abort();
  const unavailable = async () => { assert.fail("Stopped workers must not process jobs"); return 0; };
  await runMetaWorker(controller.signal, { once: true }, { events: unavailable, catalogue: unavailable, health: async () => assert.fail("No heartbeat after stopping"), report: () => assert.fail("No errors after stopping") });
});

test("Meta features activate independently", () => {
  const pixel = { ...defaultMetaSettings, pixelId: "123456789" };
  assert.equal(pixelReady(pixel), true); assert.equal(capiReady(pixel), false); assert.equal(reportingReady(pixel), false);
  const server = { ...pixel, pixelEnabled: false, capiTokenEncrypted: "encrypted" };
  assert.equal(pixelReady(server), false); assert.equal(capiReady(server), true);
  const reporting = { ...defaultMetaSettings, adAccountId: "987654321", reportingTokenEncrypted: "encrypted" };
  assert.equal(pixelReady(reporting), false); assert.equal(capiReady(reporting), false); assert.equal(reportingReady(reporting), true);
});

test("Checkout matching hashes normalized available fields without inventing absent names", () => {
  const result = metaMatchData("  Person@Example.test ", "07123 456789", { fullName: "  Élodie O’Connor  ", city: "St. Albans", region: "Hertfordshire", postalCode: "AL1 1AA", countryCode: "GB" });
  assert.deepEqual(result, { em: [hashMetaValue("person@example.test")], ph: [hashMetaValue("447123456789")], fn: [hashMetaValue("élodie")], ln: [hashMetaValue("oconnor")], ct: [hashMetaValue("stalbans")], st: [hashMetaValue("hertfordshire")], zp: [hashMetaValue("al11aa")], country: [hashMetaValue("gb")] });
  assert.deepEqual(metaMatchData("", "invalid", { fullName: "Prince", city: "!!!", countryCode: "United Kingdom" }), { fn: [hashMetaValue("prince")] });
  assert.equal(metaExternalId("visitor-a"), metaExternalId("visitor-a"));
  assert.notEqual(metaExternalId("visitor-a"), metaExternalId("visitor-b"));
  assert.match(metaExternalId("visitor-a"), /^[a-f0-9]{64}$/);
});

test("Client IP trusts Cloudflare headers only behind its verified edge", () => {
  const headers = (values: Record<string, string>) => new Headers(values);
  assert.equal(clientIpAddress(headers({ "x-forwarded-for": "203.0.113.10, 172.64.1.2", "cf-connecting-ip": "203.0.113.10", "cf-connecting-ipv6": "2001:db8::5" })), "2001:db8::5");
  assert.equal(clientIpAddress(headers({ "x-forwarded-for": "forged, 2606:4700::1234", "cf-connecting-ip": "2001:db8::6" })), "2001:db8::6");
  assert.equal(clientIpAddress(headers({ "x-forwarded-for": "203.0.113.10", "cf-connecting-ipv6": "2001:db8::fake", "cf-connecting-ip": "198.51.100.5" })), "203.0.113.10");
  assert.equal(clientIpAddress(headers({ "x-forwarded-for": "203.0.113.10, 172.64.1.2", "cf-connecting-ipv6": "invalid", "cf-connecting-ip": "198.51.100.5" })), "198.51.100.5");
  assert.equal(clientIpAddress(headers({ "x-forwarded-for": "2001:db8::7" })), "2001:db8::7");
  assert.equal(clientIpAddress(headers({ "x-real-ip": "127.0.0.1" })), "127.0.0.1");
  assert.equal(clientIpAddress(headers({ "x-forwarded-for": "invalid" })), undefined);
});

test("County matching reuses only verified hashes and the same buyer's unchanged locality", () => {
  const address = { fullName: "Meta Test", city: "London", region: "Greater London", postalCode: "SW1A 1AA", countryCode: "GB" };
  const previous = metaMatchData("person@example.test", "02079460000", address);
  const omitted = metaMatchData("person@example.test", "02079460000", { ...address, region: "" });
  assert.equal(preserveMetaRegion(omitted, previous).st[0], hashMetaValue("greaterlondon"));
  assert.equal(omitted.st, undefined, "Preserving a county must not mutate the submitted matching data");
  for (const changed of [{ fullName: "Other Person" }, { city: "Bristol" }, { postalCode: "BS1 1AA" }, { countryCode: "FR" }]) {
    assert.equal(preserveMetaRegion(metaMatchData("person@example.test", "02079460000", { ...address, region: "", ...changed }), previous).st, undefined);
  }
  assert.equal(preserveMetaRegion(metaMatchData("other@example.test", "02079460000", { ...address, region: "" }), previous).st, undefined);
  assert.equal(preserveMetaRegion(metaMatchData("", "02079460000", { ...address, region: "" }), previous).st, undefined);
  const updated = metaMatchData("person@example.test", "02079460000", { ...address, region: "Kent" });
  assert.equal(preserveMetaRegion(updated, previous).st[0], hashMetaValue("kent"), "A provided county always replaces an old value");
  assert.deepEqual(metaAdvancedMatching({ st: previous.st, em: previous.em, zp: previous.zp, country: previous.country, ct: "London", ph: ["unhashed"], fn: [previous.fn[0], previous.fn[0]], line1: "1 Test Street", external_id: [metaExternalId("visitor")], client_ip_address: "203.0.113.1" }), { em: previous.em[0], st: previous.st[0], zp: previous.zp[0], country: previous.country[0] });
  for (const value of [null, [], "invalid", { st: "Greater London" }]) assert.deepEqual(metaAdvancedMatching(value), {});
});

test("Matching coverage retains presence flags without personal values", () => {
  const result = metaMatchingCoverage({ em: [hashMetaValue("private@example.test")], external_id: [metaExternalId("visitor")], client_ip_address: "2001:db8::8", fbp: "fb.1.1700000000000.123", ph: [] });
  assert.equal(result.em, true); assert.equal(result.ph, false);
  assert.equal(result.external_id, true); assert.equal(result.ipv6, true); assert.equal(result.fbc, false);
  assert.ok(Object.values(result).every(value => typeof value === "boolean"));
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("Checkout matching permits validated contact fields and omits unfinished optional values", () => {
  assert.equal(checkoutMetaMatching({ email: "unfinished@" }), null);
  const partial = checkoutMetaMatching({ email: " Person@Example.test ", phone: "abc", fullName: "", city: "L", region: "", postalCode: "SW", countryCode: "GB" });
  assert.deepEqual(JSON.parse(JSON.stringify(partial)), { email: "person@example.test", countryCode: "GB" });
  const valid = { email: "Person@Example.test", phone: "07123 456789", fullName: "Meta Test", city: "London", region: "Greater London", postalCode: "sw1a 1aa", countryCode: "GB" as const };
  assert.equal(metaMatchingInputSchema.parse(valid).postalCode, "SW1A 1AA");
  for (const extra of [{ line1: "1 Private Street" }, { notes: "Private notes" }, { externalId: "another-visitor" }, { pixelId: "another-pixel" }]) {
    assert.equal(metaMatchingInputSchema.safeParse({ ...valid, ...extra }).success, false);
  }
  assert.equal(metaMatchingInputSchema.safeParse({ ...valid, region: "a".repeat(121) }).success, false);
});

test("Checkout updates manual Pixel matching before an order, without duplicate events or raw storage", async () => {
  const globals = ["location", "document", "window", "localStorage", "fetch"];
  const originals = globals.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const calls: unknown[][] = [], bodies: string[] = [];
  const pixelId = "888123456", externalId = metaExternalId("checkout-matching");
  const input = { email: "Person@Example.test", phone: "07123 456789", fullName: "Meta Test", city: "London", region: "Greater London", postalCode: "SW1A 1AA", countryCode: "GB" as const };
  const matching = metaAdvancedMatching(metaMatchData(input.email, input.phone, input));
  let response = { pixelId, externalId, matching };
  let release: () => void = () => undefined;
  let waiting: Promise<void> | undefined;
  let started: () => void = () => undefined;
  const values = [
    { href: "https://n7.test/checkout", hostname: "n7.test", protocol: "https:" },
    { referrer: "", cookie: "" },
    { fbq: (...args: unknown[]) => calls.push(args), dispatchEvent() {} },
    { length: 0, key: () => null, getItem: () => null, setItem() { assert.fail("Matching must not write browser storage"); } },
    async (url: string, init: RequestInit) => {
      assert.equal(url, "/api/meta/matching");
      assert.equal(init.credentials, "same-origin");
      bodies.push(String(init.body)); started();
      await waiting;
      return Response.json(response);
    },
  ];
  globals.forEach((key, index) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: values[index] }));
  try {
    configureMeta({ enabled: true, pixelId, consent: "unknown" });
    assert.equal(await updateMetaMatching(input), false);
    assert.equal(bodies.length, 0, "No request before consent");
    configureMeta({ enabled: true, pixelId, consent: "granted", externalId });
    assert.equal(await updateMetaMatching({ email: "invalid" }), false);
    assert.equal(bodies.length, 0);
    assert.equal(await updateMetaMatching(input), true);
    assert.deepEqual(calls.at(-1), ["init", pixelId, { ...matching, external_id: externalId }]);
    assert.equal(calls.some(args => args[0] === "trackSingle"), false, "Matching is not a synthetic commerce event");
    assert.equal(JSON.stringify(calls).includes("Person@Example.test"), false);
    assert.equal(await updateMetaMatching(input), true);
    assert.equal(bodies.length, 1, "Repeated unchanged details are deduplicated");

    waiting = new Promise<void>(resolve => { release = resolve; });
    const requestStarted = new Promise<void>(resolve => { started = resolve; });
    const pending = updateMetaMatching({ ...input, email: "next@example.test" });
    await requestStarted;
    stopMeta();
    const afterWithdrawal = calls.length;
    release();
    assert.equal(await pending, false);
    assert.equal(calls.length, afterWithdrawal, "A late response cannot regrant consent or initialize Pixel");
    assert.equal(await updateMetaMatching(input), false);
    assert.equal(bodies.length, 2);

    waiting = undefined;
    configureMeta({ enabled: true, pixelId, consent: "granted", externalId });
    response = { pixelId, externalId: metaExternalId("other-consent"), matching };
    assert.equal(await updateMetaMatching(input), false, "A changed server consent identity is not attached to the old Pixel session");
    response = { pixelId, externalId, matching };
    assert.equal(await updateMetaMatching(input), true, "A failed response must allow a later retry");
  } finally {
    release(); stopMeta();
    globals.forEach((key, index) => { const descriptor = originals[index]; if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); });
  }
});

test("Slower matching updates cannot overwrite newer buyer details", async () => {
  const globals = ["location", "document", "window", "localStorage", "fetch"];
  const originals = globals.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const calls: unknown[][] = [], submitted: string[] = [];
  const pixelId = "888999123", externalId = metaExternalId("matching-sequence");
  let release: () => void = () => undefined;
  let started: () => void = () => undefined;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  const requestStarted = new Promise<void>(resolve => { started = resolve; });
  const values = [
    { href: "https://n7.test/checkout", hostname: "n7.test", protocol: "https:" }, { referrer: "", cookie: "" },
    { fbq: (...args: unknown[]) => calls.push(args), dispatchEvent() {} },
    { length: 0, key: () => null, getItem: () => null },
    async (_url: string, init: RequestInit) => {
      const input = metaMatchingInputSchema.parse(JSON.parse(String(init.body)));
      submitted.push(input.email); started();
      if (submitted.length === 1) await waiting;
      return Response.json({ pixelId, externalId, matching: metaAdvancedMatching(metaMatchData(input.email, "")) });
    },
  ];
  globals.forEach((key, index) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: values[index] }));
  try {
    configureMeta({ enabled: true, pixelId, consent: "granted", externalId });
    const first = updateMetaMatching({ email: "first@example.test" });
    await requestStarted;
    const second = updateMetaMatching({ email: "second@example.test" });
    const duplicate = updateMetaMatching({ email: "second@example.test" });
    assert.deepEqual(submitted, ["first@example.test"], "The second write waits for the first to commit");
    release();
    assert.deepEqual(await Promise.all([first, second, duplicate]), [false, true, true]);
    assert.deepEqual(submitted, ["first@example.test", "second@example.test"]);
    assert.deepEqual(calls.at(-1), ["init", pixelId, { em: hashMetaValue("second@example.test"), external_id: externalId }]);
    assert.equal(calls.some(args => args[0] === "init" && JSON.stringify(args).includes(hashMetaValue("first@example.test"))), false);
  } finally {
    release(); stopMeta();
    globals.forEach((key, index) => { const descriptor = originals[index]; if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); });
  }
});

test("Valid campaign parameters allow Pixel while receipt and payment secrets remain blocked", () => {
  assert.equal(safeMetaPixelLocation("https://n7.test/?fbclid=actual-click&utm_id=7&campaign_id=11&adset_id=12&ad_id=13&placement=feed&site_source_name=ig", "https://facebook.com/"), true);
  for (const query of ["key=receipt-token", "payment_intent_client_secret=secret", "token=secret", "email=private@example.test"]) {
    assert.equal(safeMetaPixelLocation(`https://n7.test/checkout/confirmation?${query}`, ""), false);
    assert.equal(safeMetaPixelLocation("https://n7.test/", `https://n7.test/?${query}`), false);
  }
  assert.equal(safeMetaPixelLocation("invalid-url", ""), false);
});

test("Click matching uses a real landing fbclid and preserves its arrival time", () => {
  const click = metaLandingClick("https://n7.test/?fbclid=real-click_123", 1700000000000);
  assert.deepEqual(click, { id: "real-click_123", arrivedAt: 1700000000000 });
  assert.equal(metaClickCookie(click!), "fb.1.1700000000000.real-click_123");
  for (const url of ["https://n7.test/", "https://n7.test/?fbclid=", "https://n7.test/?fbclid=contains%20spaces", "https://n7.test/?fbclid=" + "a".repeat(501)]) assert.equal(metaLandingClick(url), undefined);
});

test("Delayed consent retains the landing click across navigation without pre-consent storage", t => {
  const globals = ["location", "document", "window", "localStorage"];
  const originals = globals.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const cookies = new Map<string, string>();
  const writes: string[] = [], scripts: unknown[] = [];
  const location = { href: "https://n7.test/?fbclid=real-ad-click", hostname: "n7.test", protocol: "https:" };
  const document = { referrer: "", get cookie() { return [...cookies].map(([key, value]) => `${key}=${value}`).join("; "); },
    set cookie(value: string) { const [pair] = value.split(";"); const [key, ...parts] = pair.split("="); if (value.includes("Max-Age=0")) cookies.delete(key); else { writes.push(value); cookies.set(key, parts.join("=")); } },
    createElement: () => ({}), head: { appendChild: (script: unknown) => scripts.push(script) } };
  const values = [location, document, { dispatchEvent() {}, setTimeout }, { length: 0, key: () => null, getItem: () => null }];
  globals.forEach((key, index) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: values[index] }));
  t.mock.method(Date, "now", () => 1700000000000);
  try {
    captureMetaLandingClick();
    configureMeta({ enabled: true, pixelId: "123456789", consent: "unknown" });
    assert.equal(writes.length, 0);
    assert.equal(scripts.length, 0);
    suspendMeta();
    location.href = "https://n7.test/products/a-fragrance";
    configureMeta({ enabled: true, pixelId: "123456789", consent: "granted", externalId: metaExternalId("visitor-a") });
    assert.equal(cookies.get("_fbc"), "fb.1.1700000000000.real-ad-click");
    assert.equal(scripts.length, 1);
    const fbq = Reflect.get(values[2], "fbq") as { queue: unknown[][] };
    assert.deepEqual(fbq.queue.find(args => args[0] === "init"), ["init", "123456789", { external_id: metaExternalId("visitor-a") }]);
    stopMeta();
    assert.equal(cookies.has("_fbc"), false);
    configureMeta({ enabled: true, pixelId: "123456789", consent: "granted" });
    assert.equal(cookies.has("_fbc"), false);
  } finally {
    stopMeta();
    globals.forEach((key, index) => { const descriptor = originals[index]; if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); });
  }
});

test("Pixel refreshes the server-matched External ID before each event and respects consent", () => {
  const globals = ["location", "document", "window", "localStorage"];
  const originals = globals.map(key => Object.getOwnPropertyDescriptor(globalThis, key));
  const calls: unknown[][] = [];
  const values = [
    { href: "https://n7.test/products/meta-test", hostname: "n7.test", protocol: "https:" },
    { referrer: "", cookie: "" },
    { fbq: (...args: unknown[]) => calls.push(args), dispatchEvent() {} },
    { length: 0, key: () => null, getItem: () => null, setItem() {} },
  ];
  globals.forEach((key, index) => Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: values[index] }));
  const pixelId = "777123456";
  const firstId = metaExternalId("first-consent"), secondId = metaExternalId("renewed-consent");
  const event = { pixelId, eventId: "view-event", name: "ViewContent" as const, data: { content_ids: ["n7_variant_55"] }, externalId: firstId };
  try {
    configureMeta({ enabled: true, pixelId, consent: "granted" });
    assert.equal(calls.some(args => args[0] === "init"), false, "Missing config identity must not initialize an unmatched Pixel");
    sendMetaBrowserEvent(event);
    assert.deepEqual(calls.slice(-2), [["init", pixelId, { external_id: firstId }], ["trackSingle", pixelId, "ViewContent", event.data, { eventID: event.eventId }]]);
    configureMeta({ enabled: true, pixelId, consent: "granted", externalId: firstId });
    sendMetaBrowserEvent({ ...event, eventId: "next-view" });
    assert.deepEqual(calls.slice(-2), [["init", pixelId, { external_id: firstId }], ["trackSingle", pixelId, "ViewContent", event.data, { eventID: "next-view" }]]);
    const county = hashMetaValue("greaterlondon");
    configureMeta({ enabled: true, pixelId, consent: "granted", externalId: firstId, matching: { st: county } });
    assert.deepEqual(calls.at(-1), ["init", pixelId, { st: county, external_id: firstId }], "New matching fields refresh Pixel even when the External ID is unchanged");
    sendMetaBrowserEvent({ ...event, eventId: "county-view", matching: { st: county } });
    assert.deepEqual(calls.slice(-2), [["init", pixelId, { st: county, external_id: firstId }], ["trackSingle", pixelId, "ViewContent", event.data, { eventID: "county-view" }]]);
    assert.equal("st" in event.data, false, "County belongs to matching data, not commerce parameters");
    sendMetaBrowserEvent({ ...event, eventId: "unknown-county", matching: { st: "unhashed-county" } });
    assert.deepEqual(calls.at(-2), ["init", pixelId, { external_id: firstId }], "An unknown/raw county cannot leak into Pixel or inherit the previous event's county");
    configureMeta({ enabled: true, pixelId, consent: "granted", externalId: secondId });
    assert.deepEqual(calls.at(-1), ["init", pixelId, { external_id: secondId }]);
    sendMetaBrowserEvent({ ...event, eventId: "renewed-view", externalId: secondId });
    assert.deepEqual(calls.slice(-2), [["init", pixelId, { external_id: secondId }], ["trackSingle", pixelId, "ViewContent", event.data, { eventID: "renewed-view" }]]);
    const beforeInvalid = calls.length;
    sendMetaBrowserEvent({ ...event, externalId: "" });
    sendMetaBrowserEvent({ ...event, externalId: "unhashed-visitor" });
    assert.equal(calls.length, beforeInvalid, "Invalid matching identifiers cannot produce browser events");
    const purchase = { ...event, eventId: "purchase-matching-test", name: "Purchase" as const, externalId: secondId };
    sendMetaBrowserEvent(purchase);
    const beforeDuplicate = calls.length;
    sendMetaBrowserEvent(purchase);
    assert.equal(calls.length, beforeDuplicate, "Matching refresh must not duplicate a Purchase");
    stopMeta();
    const afterWithdrawal = calls.length;
    sendMetaBrowserEvent(event);
    assert.equal(calls.length, afterWithdrawal, "Withdrawal blocks matching refresh and tracking");
  } finally {
    stopMeta();
    globals.forEach((key, index) => { const descriptor = originals[index]; if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); });
  }
});

test("Client delivery retries transient failures with the original deduplication ID", async () => {
  const bodies: string[] = [], delays: number[] = [];
  const body = JSON.stringify({ eventId: "stable-event-id", name: "AddToCart" });
  const event = { pixelId: "123", eventId: "stable-event-id", name: "AddToCart", data: {}, externalId: metaExternalId("visitor-a") };
  const result = await deliverMetaClientEvent(body, () => true, async (_url, init) => {
    bodies.push(String(init?.body));
    if (bodies.length === 1) throw new TypeError("Network unavailable");
    if (bodies.length === 2) return new Response(null, { status: 503 });
    return Response.json(event);
  }, async delay => { delays.push(delay); });
  assert.deepEqual(result, event);
  assert.deepEqual(bodies, [body, body, body]);
  assert.deepEqual(delays, [500, 1500]);
});

test("Client retries stop on denial, permanent failure and the attempt limit", async () => {
  for (const status of [204, 400, 403, 422]) {
    let calls = 0;
    assert.equal(await deliverMetaClientEvent("{}", () => true, async () => { calls++; return new Response(null, { status }); }, async () => {}), undefined);
    assert.equal(calls, 1);
  }
  let active = true, calls = 0;
  await deliverMetaClientEvent("{}", () => active, async () => { calls++; return new Response(null, { status: 429 }); }, async () => { active = false; });
  assert.equal(calls, 1);
  calls = 0;
  await deliverMetaClientEvent("{}", () => true, async () => { calls++; throw new TypeError("Offline"); }, async () => {});
  assert.equal(calls, 3);
});

test("Order diagnostics distinguish accepted, queued, failed, skipped and unknown historical events", () => {
  const eligible: MetaDeliveryInput = { source: "LIVE", paymentStatus: "PAID", stripeMode: "live", hasContext: true, serverEnabled: true, settingsMatch: true, consentValid: true, capiEnabled: true, testMode: false };
  assert.equal(metaDeliveryStatus(eligible).status, "Pending");
  assert.equal(metaDeliveryStatus({ ...eligible, status: "SENT", hasContext: false }).status, "Sent");
  assert.match(metaDeliveryStatus({ ...eligible, status: "SENT", testMode: true }).reason, /test Purchase/);
  assert.equal(metaDeliveryStatus({ ...eligible, status: "FAILED", error: "Credentials expired" }).reason, "Credentials expired");
  assert.equal(metaDeliveryStatus({ ...eligible, captureReason: "NO_CONSENT", hasContext: false }).status, "Skipped");
  assert.equal(metaDeliveryStatus({ ...eligible, captureReason: "CAPTURE_FAILED", hasContext: false }).status, "Failed");
  assert.equal(metaDeliveryStatus({ ...eligible, captureReason: "SERVER_DISABLED", hasContext: false }).status, "Skipped");
  assert.equal(metaDeliveryStatus({ ...eligible, source: "LEGACY", hasContext: false }).status, "Skipped");
  assert.equal(metaDeliveryStatus({ ...eligible, hasContext: false }).status, "Unavailable");
  assert.equal(metaDeliveryStatus({ ...eligible, stripeMode: "test" }).status, "Skipped");
  assert.equal(metaDeliveryStatus({ ...eligible, capiEnabled: false }).status, "Pending");
  assert.equal(metaDeliveryStatus({ ...eligible, paidAt: new Date(0) }, 48 * 3600000).status, "Failed");
});
test("Partial settings are valid, malformed IDs are rejected", () => {
  const fields = { ...defaultMetaSettings, pixelId: "123456789", capiToken: "", reportingToken: "", clearCapiToken: false, clearReportingToken: false, revision: "a".repeat(64) };
  assert.equal(metaSettingsSchema.safeParse(fields).success, true);
  assert.equal(metaSettingsSchema.safeParse({ ...fields, pixelId: "<script>" }).success, false);
  assert.equal(metaSettingsSchema.parse({ ...fields, adAccountId: "act_987654321" }).adAccountId, "987654321");
});
test("Catalogue IDs and purchase totals use stable variants and integer money", () => {
  const data = metaCommerceData([{ variantId: "9007199254740993", quantity: 2, totalPence: 3700 }, { variantId: "55", quantity: 1, totalPence: 0 }], 3999);
  assert.deepEqual(data.content_ids, ["n7_variant_9007199254740993", "n7_variant_55"]);
  assert.equal(data.value, 39.99); assert.equal(data.currency, "GBP"); assert.equal(data.num_items, 3);
  assert.equal(data.contents?.[0].item_price, 18.5); assert.equal(data.contents?.[1].item_price, 0);
  assert.equal(metaContentId("55"), data.contents?.[1].id);
  assert.equal(purchaseEventId("7000"), "n7_purchase_7000");
});
test("Public event endpoint cannot create purchases or accept custom prices", () => {
  const event = { name: "PageView", eventId: "14d8f51d-f6c9-4f3b-af85-941ef6966c48", path: "/" };
  assert.equal(metaEventSchema.safeParse({ ...event, name: "Purchase" }).success, false);
  assert.equal(metaEventSchema.safeParse({ ...event, eventId: "not-an-id" }).success, false);
  const parsed = metaEventSchema.parse({ ...event, value: 12345, customerEmail: "private@example.com" });
  assert.equal("value" in parsed, false); assert.equal("customerEmail" in parsed, false);
});
test("Event URLs strip credentials and disallow internal routes", () => {
  assert.equal(safeEventPath("/checkout/confirmation?key=secret&payment_intent_client_secret=secret#secret"), "/checkout/confirmation");
  for (const path of ["//evil.test", "/admin", "/admin/meta", "/api/commerce/orders", "/newsletter/secret", "/x\\y", "https://evil.test"]) assert.equal(safeEventPath(path), null);
});
test("Customer identifiers are normalised and hashed; network identifiers stay unhashed", () => {
  assert.equal(normalizeMetaPhone("020 7946 0000"), "442079460000");
  assert.equal(normalizeMetaPhone("+44 (20) 7946-0000"), "442079460000");
  assert.equal(normalizeMetaPhone("0044 20 7946 0000"), "442079460000");
  assert.equal(normalizeMetaPhone("+44 (0)20 7946 0000"), "442079460000");
  assert.equal(normalizeMetaPhone("123"), null);
  assert.deepEqual(metaMatchData(" TEST@Example.com ", "02079460000"), metaMatchData("test@example.com", "+442079460000"));
  assert.match(metaMatchData("test@example.com", "123").em[0], /^[a-f0-9]{64}$/);
  const user = requestUserData(new Request("https://n7.test", { headers: { cookie: "_fbp=fb.1.1700000000000.1234; _fbc=fb.1.1700000000000.realclick", "x-forwarded-for": "203.0.113.1, 10.0.0.1", "user-agent": "Test agent" } }));
  assert.equal(user.client_ip_address, "203.0.113.1"); assert.equal(user.fbc, "fb.1.1700000000000.realclick");
  assert.deepEqual(requestUserData(new Request("https://n7.test", { headers: { cookie: "_fbc=made-up", "x-forwarded-for": "spoof" } })), {});
});
test("Event bodies are bounded even without a content-length header", async () => {
  await assert.rejects(readMetaJson(new Request("https://n7.test", { method: "POST", body: JSON.stringify({ text: "x".repeat(300) }) }), 200));
  assert.deepEqual(await readMetaJson(new Request("https://n7.test", { method: "POST", body: '{"granted":false}' }), 200), { granted: false });
});
