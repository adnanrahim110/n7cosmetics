import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectOne, executeMutation } from "../db/query";
import { consentGranted, consentId } from "../meta/consent";
import { readCookie } from "../meta/identity";
import { encryptSecret, decryptSecret } from "../security/encryption";
import { getTikTokSettings, tiktokPixelReady, tiktokServerReady, type TikTokSettings } from "./settings";
import { tiktokContact, tiktokExternalId, tiktokRequestUser } from "./identity";
import { makeTikTokEvent, queueTikTokEvent } from "./events";
import { tiktokMatching, tiktokPurchaseId, type TikTokBrowserEvent, type TikTokProperties } from "./shared";

export interface TikTokCheckoutCapture { reason: string; context?: { consentId: string; settings: TikTokSettings; user: Record<string, string> } }
export async function readTikTokCheckoutCapture(request: Request): Promise<TikTokCheckoutCapture> {
  try {
    if (readCookie(request, "n7_marketing_optout") === "1") return { reason: "CONSENT_DENIED" };
    const id = consentId(request);
    if (!await consentGranted(id)) return { reason: "NO_CONSENT" };
    const settings = await getTikTokSettings();
    if (!tiktokPixelReady(settings) && !tiktokServerReady(settings)) return { reason: "NOT_CONFIGURED" };
    return { reason: tiktokServerReady(settings) ? "ELIGIBLE" : "SERVER_DISABLED", context: { consentId: id, settings, user: tiktokRequestUser(request) } };
  } catch { return { reason: "CAPTURE_FAILED" }; }
}
export async function saveTikTokOrderContext(orderId: string, capture: TikTokCheckoutCapture, properties: TikTokProperties, email: string, phone: string, connection: PoolConnection): Promise<void> {
  let reason = capture.reason;
  await connection.query("SAVEPOINT tiktok_checkout_context");
  try {
    const context = capture.context;
    if (context) {
      if (await consentGranted(context.consentId, connection)) {
        const matching = tiktokContact(email, phone);
        const user = { ...context.user, ...matching, external_id: tiktokExternalId(context.consentId) };
        await executeMutation("UPDATE meta_consents SET tiktok_matching_encrypted = ? WHERE id = ?", [encryptSecret(JSON.stringify(matching)), context.consentId], connection);
        await executeMutation("INSERT IGNORE INTO tiktok_order_contexts (order_id, consent_id, pixel_id, server_enabled, test_event_code, payload_encrypted) VALUES (?, ?, ?, ?, ?, ?)", [orderId, context.consentId, context.settings.pixelId, tiktokServerReady(context.settings), context.settings.testEventCode, encryptSecret(JSON.stringify({ user, properties: { ...properties, order_id: orderId } }))], connection);
      } else reason = "CONSENT_WITHDRAWN";
    }
  } catch {
    await connection.query("ROLLBACK TO SAVEPOINT tiktok_checkout_context");
    reason = "CAPTURE_FAILED";
    console.error("TikTok attribution unavailable; checkout continues without tracking.");
  }
  await connection.query("RELEASE SAVEPOINT tiktok_checkout_context");
  await connection.query("SAVEPOINT tiktok_order_diagnostic");
  try { await executeMutation("INSERT IGNORE INTO tiktok_order_diagnostics (order_id, capture_reason) VALUES (?, ?)", [orderId, reason], connection); }
  catch { await connection.query("ROLLBACK TO SAVEPOINT tiktok_order_diagnostic"); console.error("TikTok capture diagnostics unavailable; checkout continues."); }
  await connection.query("RELEASE SAVEPOINT tiktok_order_diagnostic");
}
interface ContextRow extends RowDataPacket { consent_id: string; pixel_id: string; server_enabled: number; test_event_code: string; payload_encrypted: string; stripe_mode: string; paid_at: Date }
async function purchaseContext(orderId: string, connection?: PoolConnection) {
  const row = await selectOne<ContextRow>(`SELECT t.*, c.stripe_mode, o.paid_at FROM tiktok_order_contexts t JOIN orders o ON o.id = t.order_id JOIN stripe_checkouts c ON c.order_id = o.id WHERE t.order_id = ? AND o.source = 'LIVE' AND o.payment_status = 'PAID' AND t.created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY) AND o.paid_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 47 HOUR)`, [orderId], connection);
  if (!row || !await consentGranted(row.consent_id, connection)) return null;
  const settings = await getTikTokSettings(connection);
  if (settings.pixelId !== row.pixel_id || settings.testEventCode !== row.test_event_code || (row.stripe_mode !== "live" && !row.test_event_code)) return null;
  // The snapshot is generated internally, encrypted and never accepted from clients.
  const stored: { user: Record<string, string>; properties: TikTokProperties } = JSON.parse(decryptSecret(row.payload_encrypted));
  return { row, settings, stored };
}
export async function queueTikTokPurchase(orderId: string, connection: PoolConnection) {
  const value = await purchaseContext(orderId, connection);
  if (!value || !value.row.server_enabled || !tiktokServerReady(value.settings)) return;
  const event = makeTikTokEvent("Purchase", tiktokPurchaseId(orderId), "/checkout/confirmation", value.stored.user, value.stored.properties);
  event.event_time = Math.floor(new Date(value.row.paid_at).getTime() / 1000);
  await queueTikTokEvent(event, value.settings, value.row.consent_id, connection);
}
export async function browserTikTokPurchase(orderId: string, request: Request): Promise<TikTokBrowserEvent | undefined> {
  if (readCookie(request, "n7_marketing_optout") === "1") return;
  const value = await purchaseContext(orderId);
  if (!value || value.row.consent_id !== consentId(request) || !tiktokPixelReady(value.settings) || value.row.stripe_mode !== "live" || value.settings.testEventCode) return;
  return { pixelId: value.settings.pixelId, externalId: tiktokExternalId(value.row.consent_id), name: "Purchase", eventId: tiktokPurchaseId(orderId), data: value.stored.properties, matching: tiktokMatching(value.stored.user) };
}
