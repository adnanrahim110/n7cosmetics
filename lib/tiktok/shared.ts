import { z } from "zod";
import { metaEventSchema, type MetaCustomData } from "../meta/shared";

export const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";
export const tiktokEventNames = ["Pageview", "ViewContent", "Search", "AddToCart", "InitiateCheckout", "AddPaymentInfo"] as const;
export type TikTokEventName = typeof tiktokEventNames[number];
export const tiktokEventSchema = metaEventSchema.extend({ name: z.enum(tiktokEventNames) }).strict();
export const tiktokSettingsSchema = z.object({
  pixelId: z.string().trim().regex(/^[A-Z0-9]{20}$|^$/, "Use the 20-character Pixel ID shown in TikTok."),
  pixelEnabled: z.boolean(), serverEnabled: z.boolean(),
  accessToken: z.string().trim().max(4096).regex(/^[A-Za-z0-9_.|=-]*$/, "Enter a valid access token."),
  clearAccessToken: z.boolean(),
  testEventCode: z.string().trim().max(100).regex(/^[A-Za-z0-9_-]*$/),
  revision: z.string().regex(/^[a-f0-9]{64}$/),
});
export interface TikTokMatching { email?: string; phone?: string; external_id?: string }
export interface TikTokProperties {
  content_type?: "product"; content_ids?: string[];
  contents?: { content_id: string; quantity: number; price: number }[];
  currency?: string; value?: number; quantity?: number; order_id?: string;
}
export interface TikTokBrowserEvent {
  pixelId: string; externalId: string; eventId: string; name: TikTokEventName | "Purchase";
  data: TikTokProperties; matching: TikTokMatching;
}
export interface TikTokPublicConfig {
  enabled: boolean; pixelId: string; consent: "granted" | "denied" | "unknown"; externalId?: string;
}
export function tiktokProperties(data: MetaCustomData, orderId?: string): TikTokProperties {
  return {
    ...(data.content_type ? { content_type: data.content_type } : {}),
    ...(data.content_ids ? { content_ids: data.content_ids } : {}),
    ...(data.contents ? { contents: data.contents.map(line => ({ content_id: line.id, quantity: line.quantity, price: line.item_price })) } : {}),
    ...(data.currency ? { currency: data.currency } : {}),
    ...(data.value !== undefined ? { value: data.value } : {}),
    ...(data.num_items !== undefined ? { quantity: data.num_items } : {}),
    ...(orderId ? { order_id: orderId } : {}),
  };
}
export function tiktokMatching(value: unknown): TikTokMatching {
  const parsed = z.object({ email: z.string().regex(/^[a-f0-9]{64}$/).optional(), phone: z.string().regex(/^[a-f0-9]{64}$/).optional(), external_id: z.string().regex(/^[a-f0-9]{64}$/).optional() }).safeParse(value);
  return parsed.success ? parsed.data : {};
}
export const tiktokPurchaseId = (orderId: string) => `n7_tiktok_purchase_${orderId}`;
