import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import type { z } from "zod";
import { executeMutation, selectRows } from "../db/query";
import { encryptSecret } from "../security/encryption";
import { getApplicationConfig } from "../env";
import { calculateCartPricing } from "../commerce/quote";
import { metaCommerceData, metaEventSchema, safeEventPath, type MetaCustomData } from "./shared";
import { capiReady, type MetaSettings } from "./settings";
import { metaMatchingCoverage } from "./matching-coverage";
import { metaExternalId } from "./identity";

export interface MetaServerEvent {
  event_name: string; event_id: string; event_time: number; action_source: "website";
  event_source_url: string; user_data: Record<string, string | string[]>; custom_data: MetaCustomData;
}
export function makeMetaEvent(name: string, id: string, path: string, userData: MetaServerEvent["user_data"], data: MetaCustomData): MetaServerEvent {
  return { event_name: name, event_id: id, event_time: Math.floor(Date.now() / 1000), action_source: "website", event_source_url: `${getApplicationConfig().appUrl}${safeEventPath(path) ?? "/"}`, user_data: userData, custom_data: data };
}
export async function queueMetaEvent(event: MetaServerEvent, settings: MetaSettings, consent: string | null, connection?: PoolConnection): Promise<void> {
  if (!capiReady(settings)) return;
  if (Date.now() - event.event_time * 1000 >= 47 * 60 * 60 * 1000) return;
  // Keep every consenting server event on the same identity as config and Pixel,
  // even if a caller omitted matching data. The worker still checks consent.
  const payload = consent ? { ...event, user_data: { ...event.user_data, external_id: [metaExternalId(consent)] } } : event;
  await executeMutation(`INSERT IGNORE INTO meta_event_jobs (pixel_id, event_id, event_name, consent_id, test_event_code, payload_encrypted, event_time, matching_fields_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [settings.pixelId, event.event_id, event.event_name, consent, settings.testEventCode, encryptSecret(JSON.stringify(payload)), new Date(event.event_time * 1000), JSON.stringify(metaMatchingCoverage(payload.user_data))], connection);
}
export async function resolveEventData(input: z.infer<typeof metaEventSchema>): Promise<MetaCustomData> {
  if (["PageView", "Search"].includes(input.name)) return {}; // Never forward free-text searches or URL query strings.
  if (!input.items.length || new Set(input.items.map(item => item.slug)).size !== input.items.length) throw new Error("Products are required.");
  if (["InitiateCheckout", "AddPaymentInfo"].includes(input.name)) {
    const quote = await calculateCartPricing({ items: input.items, couponCode: input.couponCode || undefined, reservationKey: input.reservationKey });
    return metaCommerceData(quote.lines, quote.totalPence, quote.currency);
  }
  const rows = await selectRows<RowDataPacket & { slug: string; variant_id: string; price_pence: number }>(`SELECT p.slug, CAST(v.id AS CHAR) AS variant_id, v.price_pence FROM products p JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE' WHERE p.status = 'ACTIVE' AND p.slug IN (${input.items.map(() => "?").join(",")})`, input.items.map(item => item.slug));
  if (rows.length !== input.items.length) throw new Error("Products unavailable.");
  const lines = input.items.map(item => { const row = rows.find(row => row.slug === item.slug)!; return { variantId: row.variant_id, quantity: item.quantity, totalPence: row.price_pence * item.quantity }; });
  return metaCommerceData(lines, lines.reduce((sum, line) => sum + line.totalPence, 0));
}
