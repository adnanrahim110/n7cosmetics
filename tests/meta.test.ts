import assert from "node:assert/strict";
import test from "node:test";
import { metaCommerceData, metaContentId, metaEventSchema, metaSettingsSchema, purchaseEventId, safeEventPath } from "../lib/meta/shared";
import { capiReady, defaultMetaSettings, pixelReady, reportingReady } from "../lib/meta/settings";
import { metaMatchData, normalizeMetaPhone, requestUserData } from "../lib/meta/identity";
import { readMetaJson } from "../lib/meta/http";

test("Meta features activate independently", () => {
  const pixel = { ...defaultMetaSettings, pixelId: "123456789" };
  assert.equal(pixelReady(pixel), true); assert.equal(capiReady(pixel), false); assert.equal(reportingReady(pixel), false);
  const server = { ...pixel, pixelEnabled: false, capiTokenEncrypted: "encrypted" };
  assert.equal(pixelReady(server), false); assert.equal(capiReady(server), true);
  const reporting = { ...defaultMetaSettings, adAccountId: "987654321", reportingTokenEncrypted: "encrypted" };
  assert.equal(pixelReady(reporting), false); assert.equal(capiReady(reporting), false); assert.equal(reportingReady(reporting), true);
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
