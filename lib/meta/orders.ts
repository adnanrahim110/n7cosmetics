import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { encryptSecret, decryptSecret } from "../security/encryption";
import { getMetaSettings, capiReady, pixelReady, type MetaSettings } from "./settings";
import { consentId, consentGranted } from "./consent";
import { metaExternalId, metaMatchData, preserveMetaRegion, requestUserData, readCookie, type MetaCustomerProfile } from "./identity";
import { metaAdvancedMatching } from "./matching";
import { readMetaMatchingProfile } from "./visitor";
import { makeMetaEvent, queueMetaEvent } from "./events";
import { purchaseEventId, type MetaCustomData, type MetaBrowserEvent } from "./shared";
import type { MetaCaptureReason } from "./delivery-status";

export interface MetaCheckoutContext { consentId: string; settings: MetaSettings; userData: Record<string, string>; }
interface StoredContext { userData: Record<string, string | string[]>; data: MetaCustomData }
export async function readMetaCheckoutContext(request: Request): Promise<MetaCheckoutContext | undefined> {
  return (await readMetaCheckoutCapture(request)).context;
}
export async function readMetaCheckoutCapture(request: Request): Promise<{ context?: MetaCheckoutContext; reason: MetaCaptureReason }> {
  try {
    if (readCookie(request, "n7_marketing_optout") === "1") return { reason: "CONSENT_DENIED" };
    const id = consentId(request);
    if (!await consentGranted(id)) return { reason: "NO_CONSENT" };
    const settings = await getMetaSettings();
    if (!settings.pixelEnabled && !settings.capiEnabled) return { reason: "TRACKING_DISABLED" };
    if (!pixelReady(settings) && !capiReady(settings)) return { reason: "NOT_CONFIGURED" };
    return { reason: capiReady(settings) ? "ELIGIBLE" : "SERVER_DISABLED", context: { consentId: id, settings, userData: requestUserData(request) } };
  } catch { return { reason: "CAPTURE_FAILED" }; }
}
export async function saveMetaOrderContext(orderId: string, context: MetaCheckoutContext, data: MetaCustomData, email: string, phone: string, connection: PoolConnection, profile?: MetaCustomerProfile): Promise<MetaCaptureReason> {
  let reason: MetaCaptureReason = "CONSENT_WITHDRAWN";
  await connection.query("SAVEPOINT meta_checkout_context");
  try {
    const consent = await selectOne<RowDataPacket & { matching_data_encrypted: string | null }>("SELECT matching_data_encrypted FROM meta_consents WHERE id = ? AND granted = 1 AND expires_at > CURRENT_TIMESTAMP(3) FOR UPDATE", [context.consentId], connection);
    if (consent) {
      const matching = preserveMetaRegion(metaMatchData(email, phone, profile), readMetaMatchingProfile(consent.matching_data_encrypted));
      const stored: StoredContext = { userData: { ...(capiReady(context.settings) ? context.userData : {}), ...matching, external_id: [metaExternalId(context.consentId)] }, data };
      await executeMutation("UPDATE meta_consents SET matching_data_encrypted = ? WHERE id = ?", [encryptSecret(JSON.stringify(matching)), context.consentId], connection);
      await executeMutation("INSERT IGNORE INTO meta_order_contexts (order_id, consent_id, pixel_id, server_enabled, test_event_code, payload_encrypted) VALUES (?, ?, ?, ?, ?, ?)", [orderId, context.consentId, context.settings.pixelId, capiReady(context.settings), context.settings.testEventCode, encryptSecret(JSON.stringify(stored))], connection);
      reason = capiReady(context.settings) ? "ELIGIBLE" : "SERVER_DISABLED";
    }
  } catch {
    // Optional attribution must not undo a valid order. If the database already
    // aborted the transaction, rollback-to-savepoint fails and checkout also aborts.
    await connection.query("ROLLBACK TO SAVEPOINT meta_checkout_context");
    console.warn("Meta checkout attribution unavailable; continuing without tracking context.");
    reason = "CAPTURE_FAILED";
  }
  await connection.query("RELEASE SAVEPOINT meta_checkout_context");
  return reason;
}
interface ContextRow extends RowDataPacket { consent_id: string; pixel_id: string; server_enabled: number; test_event_code: string; payload_encrypted: string; stripe_mode: string; paid_at: Date; payment_status: string }
async function purchaseContext(orderId: string, connection?: PoolConnection) {
  const row = await selectOne<ContextRow>(`SELECT m.*, c.stripe_mode, o.paid_at, o.payment_status FROM meta_order_contexts m JOIN orders o ON o.id = m.order_id JOIN stripe_checkouts c ON c.order_id = o.id WHERE m.order_id = ? AND o.source = 'LIVE' AND m.created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY)`, [orderId], connection);
  if (!row || row.payment_status !== "PAID" || !await consentGranted(row.consent_id, connection)) return null;
  const settings = await getMetaSettings(connection);
  if (row.pixel_id !== settings.pixelId || row.test_event_code !== settings.testEventCode || (row.stripe_mode !== "live" && !row.test_event_code)) return null;
  return { row, settings, stored: JSON.parse(decryptSecret(row.payload_encrypted)) as StoredContext };
}
export async function queueMetaPurchase(orderId: string, connection: PoolConnection): Promise<void> {
  const value = await purchaseContext(orderId, connection);
  if (!value || !value.row.server_enabled || !capiReady(value.settings)) return;
  const event = makeMetaEvent("Purchase", purchaseEventId(orderId), "/checkout/confirmation", value.stored.userData, value.stored.data);
  event.event_time = Math.floor(new Date(value.row.paid_at).getTime() / 1000);
  await queueMetaEvent(event, value.settings, value.row.consent_id, connection);
}
export async function browserMetaPurchase(orderId: string, request: Request): Promise<MetaBrowserEvent | undefined> {
  if (readCookie(request, "n7_marketing_optout") === "1") return;
  const value = await purchaseContext(orderId);
  // A receipt link is not marketing consent; it must belong to the consenting browser.
  if (!value || value.row.consent_id !== consentId(request) || !pixelReady(value.settings) || value.row.stripe_mode !== "live") return;
  if (Date.now() - new Date(value.row.paid_at).getTime() > 47 * 60 * 60 * 1000) return;
  return { pixelId: value.settings.pixelId, eventId: purchaseEventId(orderId), name: "Purchase", data: value.stored.data, externalId: metaExternalId(value.row.consent_id), matching: metaAdvancedMatching(value.stored.userData) };
}
