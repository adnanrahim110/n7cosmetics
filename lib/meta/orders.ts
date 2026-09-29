import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { encryptSecret, decryptSecret } from "../security/encryption";
import { getMetaSettings, capiReady, pixelReady, type MetaSettings } from "./settings";
import { consentId, consentGranted } from "./consent";
import { metaMatchData, requestUserData, readCookie } from "./identity";
import { makeMetaEvent, queueMetaEvent } from "./events";
import { purchaseEventId, type MetaCustomData, type MetaBrowserEvent } from "./shared";

export interface MetaCheckoutContext { consentId: string; settings: MetaSettings; userData: Record<string, string>; }
interface StoredContext { userData: Record<string, string | string[]>; data: MetaCustomData }
export async function readMetaCheckoutContext(request: Request): Promise<MetaCheckoutContext | undefined> {
  if (readCookie(request, "n7_marketing_optout") === "1") return;
  const id = consentId(request);
  if (!await consentGranted(id)) return;
  const settings = await getMetaSettings();
  if (!pixelReady(settings) && !capiReady(settings)) return;
  return { consentId: id, settings, userData: requestUserData(request) };
}
export async function saveMetaOrderContext(orderId: string, context: MetaCheckoutContext, data: MetaCustomData, email: string, phone: string, connection: PoolConnection): Promise<void> {
  await connection.query("SAVEPOINT meta_checkout_context");
  try {
    if (await consentGranted(context.consentId, connection)) {
      const stored: StoredContext = { userData: capiReady(context.settings) ? { ...context.userData, ...metaMatchData(email, phone) } : {}, data };
      await executeMutation("INSERT IGNORE INTO meta_order_contexts (order_id, consent_id, pixel_id, server_enabled, test_event_code, payload_encrypted) VALUES (?, ?, ?, ?, ?, ?)", [orderId, context.consentId, context.settings.pixelId, capiReady(context.settings), context.settings.testEventCode, encryptSecret(JSON.stringify(stored))], connection);
    }
  } catch {
    // Optional attribution must not undo a valid order. If the database already
    // aborted the transaction, rollback-to-savepoint fails and checkout also aborts.
    await connection.query("ROLLBACK TO SAVEPOINT meta_checkout_context");
    console.warn("Meta checkout attribution unavailable; continuing without tracking context.");
  }
  await connection.query("RELEASE SAVEPOINT meta_checkout_context");
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
  return { pixelId: value.settings.pixelId, eventId: purchaseEventId(orderId), name: "Purchase", data: value.stored.data };
}
