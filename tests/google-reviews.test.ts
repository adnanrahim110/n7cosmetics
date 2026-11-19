import assert from "node:assert/strict";
import test from "node:test";
import { defaultDispatchSchedule } from "../lib/commerce/dispatch";
import { defaultGoogleReviewsSettings, googleReviewsPublicOrigin, googleReviewsSettingsSchema, googleReviewsStorefrontPath, readGoogleReviewsSettings } from "../lib/google-reviews/config";
import { googleReviewDeliveryDate } from "../lib/google-reviews/delivery-date";
import { googleReviewSurveySchema, type GoogleReviewSurvey } from "../lib/google-reviews/survey";
import { hideGoogleStoreWidget, renderGoogleReviewSurvey, showGoogleStoreWidget } from "../lib/google-reviews/browser";

test("Google review settings validate account IDs, switches, country and accessible widget spacing", () => {
  const valid = { ...defaultGoogleReviewsSettings, merchantId: "5876486574", surveyEnabled: true, widgetEnabled: true };
  assert.deepEqual(readGoogleReviewsSettings(JSON.stringify(valid)), valid);
  assert.equal(googleReviewsSettingsSchema.parse({ ...valid, widgetRegion: "gb" }).widgetRegion, "GB");
  for (const change of [{ merchantId: "" }, { merchantId: "<script>" }, { fallbackDeliveryDays: 0 }, { fallbackDeliveryDays: 31 },
    { widgetPosition: "INLINE" }, { widgetRegion: "UK country" }, { widgetBottomMargin: 17 }, { widgetMobileBottomMargin: 500 }]) {
    assert.equal(googleReviewsSettingsSchema.safeParse({ ...valid, ...change }).success, false);
  }
  for (const invalid of [null, "broken JSON", {}, { ...valid, merchantId: "bad" }]) {
    assert.deepEqual(readGoogleReviewsSettings(invalid), defaultGoogleReviewsSettings, "Invalid stored configuration disables sharing");
  }
});

test("Review dates follow the selected order snapshot, UK cutoff and closed working days", () => {
  const date = (paidAt: string, max = 3) => googleReviewDeliveryDate(new Date(paidAt), { estimatedDaysMax: max }, defaultDispatchSchedule, 5);
  assert.equal(date("2026-11-16T16:59:59Z"), "2026-11-19");
  assert.equal(date("2026-11-16T17:00:00Z"), "2026-11-20");
  assert.equal(date("2026-11-20T18:00:00Z", 2), "2026-11-25");
  assert.equal(date("2026-11-21T12:00:00Z", 2), "2026-11-25");
  assert.equal(date("2026-07-06T15:59:00Z", 1), "2026-07-07", "BST uses the same local cutoff");
  assert.equal(date("2026-07-06T16:00:00Z", 1), "2026-07-08");
  assert.equal(date("2026-10-23T16:00:00Z", 1), "2026-10-27", "DST weekend does not shift local dates");
  assert.equal(date("2026-11-16T10:00:00Z", 0), "2026-11-16");
  const paid = new Date("2026-11-20T18:00:00Z");
  assert.equal(googleReviewDeliveryDate(paid, JSON.stringify({ estimatedDaysMax: 2 }), { ...defaultDispatchSchedule, closedDates: ["2026-11-23", "2026-11-25"] }, 5), "2026-11-27");
  assert.equal(googleReviewDeliveryDate(paid, { estimatedDaysMax: null }, defaultDispatchSchedule, 5), "2026-11-30");
  assert.equal(googleReviewDeliveryDate(paid, "broken snapshot", defaultDispatchSchedule, 5), "2026-11-30");
  assert.equal(googleReviewDeliveryDate(new Date("invalid"), {}, defaultDispatchSchedule, 5), null);
  assert.equal(googleReviewDeliveryDate(paid, {}, { ...defaultDispatchSchedule, workingDays: [] }, 5), null);
});

test("Google widgets exclude checkout, receipt, cart and private routes, and use only public HTTPS origins", () => {
  for (const path of ["/checkout", "/checkout/confirmation", "/cart", "/admin/google", "/api/google/customer-reviews", "/newsletter/unsubscribe"]) assert.equal(googleReviewsStorefrontPath(path), false);
  for (const path of ["/", "/products/pour-homme", "/bundles/gift", "/yusuf-bhai-originals", "/blogs/example"]) assert.equal(googleReviewsStorefrontPath(path), true);
  assert.equal(googleReviewsPublicOrigin("https://n7cosmetics.co.uk/"), "https://n7cosmetics.co.uk");
  for (const origin of ["http://n7cosmetics.co.uk", "https://localhost", "https://127.0.0.1", "https://10.0.0.1", "https://user:password@n7.test", "invalid"]) assert.equal(googleReviewsPublicOrigin(origin), null);
});

test("Store widget initializes once, hides during checkout, and returns without duplicate SDK initialization", () => {
  const names = ["window", "location", "document"];
  const originals = names.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  const classes = new Set<string>();
  let renders = 0, present = false;
  const element = { isConnected: true, inert: false, classList: { add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name) }, remove() { present = false; }, querySelector() { return { setAttribute() {} }; } };
  const current = { origin: "https://n7.test", pathname: "/products/example" };
  const settings = { ...defaultGoogleReviewsSettings, merchantId: "5876486574", widgetEnabled: true };
  Object.defineProperty(globalThis, "location", { configurable: true, value: current });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { getElementById: () => present ? element : null } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { merchantwidget: { start(options: unknown) { renders++; present = true; assert.deepEqual(options, { merchant_id: 5876486574, position: "LEFT_BOTTOM", region: "GB", sideMargin: 24, bottomMargin: 24, mobileSideMargin: 16, mobileBottomMargin: 112 }); } } } });
  try {
    showGoogleStoreWidget(settings, current.origin);
    showGoogleStoreWidget(settings, current.origin);
    assert.equal(renders, 1);
    assert.equal(element.inert, false);
    current.pathname = "/checkout";
    showGoogleStoreWidget(settings, current.origin);
    assert.equal(element.inert, true); assert.equal(classes.has("hidden"), true);
    current.pathname = "/";
    showGoogleStoreWidget(settings, current.origin);
    assert.equal(element.inert, false); assert.equal(classes.has("hidden"), false); assert.equal(renders, 1);
    hideGoogleStoreWidget();
    assert.equal(element.inert, true);
  } finally {
    element.isConnected = false;
    names.forEach((name, index) => { const original = originals[index]; if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
  }
});

const survey: GoogleReviewSurvey = { merchant_id: 5876486574, order_id: "N7-test-123", email: "buyer@example.test", delivery_country: "GB", estimated_delivery_date: "2026-11-25", opt_in_style: "CENTER_DIALOG" };
test("Survey payloads accept only required transaction fields and a real date", () => {
  assert.deepEqual(googleReviewSurveySchema.parse(survey), survey);
  for (const change of [{ email: "bad" }, { delivery_country: "ZZ" }, { estimated_delivery_date: "2026-02-30" }, { key: "receipt-secret" }, { products: [{ gtin: "invented" }] }]) assert.equal(googleReviewSurveySchema.safeParse({ ...survey, ...change }).success, false);
});

test("Survey SDK uses dynamic order data, prevents repeated displays and stores no customer details", async () => {
  const names = ["window", "location", "sessionStorage"];
  const originals = names.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  const stored = new Map<string, string>(), rendered: GoogleReviewSurvey[] = [];
  let callback = () => {}, active = true;
  Object.defineProperty(globalThis, "location", { configurable: true, value: { protocol: "https:", pathname: "/checkout/confirmation" } });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => stored.get(key), setItem: (key: string, value: string) => stored.set(key, value) } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { gapi: { load(_name: string, ready: () => void) { callback = ready; }, surveyoptin: { render: (data: GoogleReviewSurvey) => rendered.push(data) } } } });
  try {
    const first = renderGoogleReviewSurvey(survey, () => active); callback(); assert.equal(await first, true);
    assert.deepEqual(rendered, [survey]);
    assert.equal(await renderGoogleReviewSurvey(survey, () => active), true);
    assert.equal(rendered.length, 1);
    assert.equal(JSON.stringify([...stored]).includes(survey.email), false);
    const secondOrder = { ...survey, order_id: "N7-test-456", email: "nextbuyer@example.test" };
    const second = renderGoogleReviewSurvey(secondOrder, () => active); callback(); assert.equal(await second, true);
    assert.deepEqual(rendered[1], secondOrder);
    const cancelled = renderGoogleReviewSurvey({ ...survey, order_id: "N7-cancelled" }, () => active);
    active = false; callback(); assert.equal(await cancelled, false);
    assert.equal(rendered.length, 2);
  } finally {
    names.forEach((name, index) => { const original = originals[index]; if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
  }
});
