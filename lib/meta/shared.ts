import { z } from "zod";
import { MAX_CART_ITEM_QUANTITY, MAX_CART_LINES } from "../commerce/cart-limits";
import type { MetaAdvancedMatching } from "./matching";

export const META_API_VERSION = "v26.0";
export const META_CONSENT_COOKIE = "n7_marketing_consent";
export const metaEventNames = ["PageView", "ViewContent", "ViewCategory", "Search", "AddToCart", "InitiateCheckout", "AddPaymentInfo"] as const;
export type MetaEventName = typeof metaEventNames[number];
export interface MetaCustomData {
  content_type?: "product";
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: { id: string; quantity: number; item_price: number }[];
  currency?: string;
  value?: number;
  num_items?: number;
}
export interface MetaBrowserEvent { pixelId: string; eventId: string; name: MetaEventName | "Purchase"; data: MetaCustomData; externalId: string; matching?: MetaAdvancedMatching }
export interface MetaPublicConfig { enabled: boolean; pixelId: string; consent: "granted" | "denied" | "unknown"; externalId?: string; matching?: MetaAdvancedMatching }

// This identifier is the contract for the future catalogue export, including bundles.
export function metaContentId(variantId: string): string { return `n7_variant_${variantId}`; }
export function purchaseEventId(orderId: string): string { return `n7_purchase_${orderId}`; }
export function metaCommerceData(lines: { variantId: string; quantity: number; totalPence: number }[], totalPence: number, currency = "GBP"): MetaCustomData {
  return {
    content_type: "product", content_ids: lines.map(line => metaContentId(line.variantId)),
    contents: lines.map(line => ({ id: metaContentId(line.variantId), quantity: line.quantity, item_price: Math.round(line.totalPence / line.quantity) / 100 })),
    currency, value: totalPence / 100, num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}

const optionalId = z.string().trim().regex(/^\d{5,30}$|^$/, "Use the numeric ID shown in Meta.");
export const metaSettingsSchema = z.object({
  pixelId: optionalId,
  pixelEnabled: z.boolean(),
  capiEnabled: z.boolean(),
  adAccountId: z.string().trim().transform(value => value.replace(/^act_/, "")).pipe(optionalId),
  reportingEnabled: z.boolean(),
  testEventCode: z.string().trim().max(100).regex(/^[A-Za-z0-9_-]*$/),
  capiToken: z.string().trim().max(4096).regex(/^[A-Za-z0-9_.|-]*$/, "Enter a valid access token."),
  reportingToken: z.string().trim().max(4096).regex(/^[A-Za-z0-9_.|-]*$/, "Enter a valid access token."),
  clearCapiToken: z.boolean(), clearReportingToken: z.boolean(),
  revision: z.string().length(64),
});
export const metaEventSchema = z.object({
  name: z.enum(metaEventNames), eventId: z.uuid(),
  path: z.string().max(500).regex(/^\/(?!\/)/),
  items: z.array(z.object({ slug: z.string().max(190).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY) })).max(MAX_CART_LINES).default([]),
  couponCode: z.string().max(80).optional(), reservationKey: z.uuid().optional(),
});

export function safeEventPath(path: string): string | null {
  const clean = path.split(/[?#]/)[0];
  if (!/^\/(?!\/)[A-Za-z0-9/_-]*$/.test(clean) || /^\/(admin|api|media|newsletter)(\/|$)/.test(clean)) return null;
  return clean;
}
