import { createHash } from "node:crypto";
import { z } from "zod";
import { metaContentId } from "./shared";

export const catalogItemSchema = z.object({
  id: z.string().regex(/^n7_variant_[1-9]\d*$/),
  title: z.string().min(1).max(150), description: z.string().min(1).max(9999),
  brand: z.string().min(1).max(100), link: z.url(), image_link: z.url(),
  price: z.string().regex(/^\d+\.\d{2} GBP$/),
  availability: z.enum(["in stock", "out of stock"]), condition: z.literal("new"),
  quantity_to_sell_on_facebook: z.number().int().nonnegative().optional(),
  item_group_id: z.string(), size: z.string().max(200).optional(),
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type CatalogRequest = { method: "UPDATE"; data: CatalogItem } | { method: "DELETE"; data: { id: string } };
export interface CatalogProduct {
  productId: string; variantId: string; name: string; productCode: string | null;
  slug: string; productType: "STANDARD" | "BUNDLE"; description: string | null;
  shortDescription: string | null; brand: string | null; pricePence: number;
  imageUrl: string | null; size: string | null; availableQuantity: number | null; soldOut: boolean;
}
function text(value: string): string {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}
export function catalogPublicUrl(value: string, siteUrl: string): string | null {
  try {
    const url = new URL(value, siteUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || url.hostname.endsWith(".localhost") || url.hostname.endsWith(".local") || !url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":")) return null;
    return url.href;
  } catch { return null; }
}
export function buildCatalogItem(product: CatalogProduct, siteUrl: string): { item?: CatalogItem; error?: string } {
  const link = catalogPublicUrl(`/${product.productType === "BUNDLE" ? "bundles" : "products"}/${product.slug}`, siteUrl);
  const image = product.imageUrl ? catalogPublicUrl(product.imageUrl, siteUrl) : null;
  if (!link) return { error: "The website URL must be a public HTTPS domain. Check APP_URL." };
  if (!image) return { error: "Add a product image with a public HTTPS URL." };
  if (!Number.isSafeInteger(product.pricePence) || product.pricePence <= 0) return { error: "Set a valid product price above £0." };
  const name = text(product.name), brand = text(product.brand || "N7 Cosmetics").slice(0, 100);
  const title = `${product.productCode?.trim() ? `${product.productCode.trim()} — ` : ""}${name}`.slice(0, 150);
  const description = text(product.description || product.shortDescription || "") || `${name} by ${brand}.`;
  const result = catalogItemSchema.safeParse({
    id: metaContentId(product.variantId), title, description: description.slice(0, 9999), brand,
    link, image_link: image, price: `${(product.pricePence / 100).toFixed(2)} GBP`,
    availability: product.soldOut ? "out of stock" : "in stock", condition: "new",
    ...(product.availableQuantity !== null ? { quantity_to_sell_on_facebook: Math.max(0, product.availableQuantity) } : {}),
    item_group_id: `n7_product_${product.productId}`, ...(product.size?.trim() ? { size: product.size.trim().slice(0, 200) } : {}),
  });
  return result.success ? { item: result.data } : { error: "Check the product name, price and catalogue details." };
}
export function catalogPayloadHash(request: CatalogRequest): string { return createHash("sha256").update(JSON.stringify(request)).digest("hex"); }
export function catalogDeleteRequest(id: string): CatalogRequest { return { method: "DELETE", data: { id } }; }

export const catalogBatchHandlesSchema = z.array(z.string().min(1).max(500)).min(1).max(50);
const batchStatusSchema = z.object({ handle: z.string(), status: z.string(), errors_total_count: z.coerce.number().optional(), errors: z.array(z.unknown()).optional(), ids_of_invalid_requests: z.array(z.unknown()).optional() });
export function catalogBatchStatus(value: unknown, handle: string): "pending" | "finished" | "failed" {
  const result = z.object({ data: z.array(batchStatusSchema) }).safeParse(value);
  const row = result.success ? result.data.data.find(entry => entry.handle === handle) : undefined;
  if (!row) return "pending";
  if ((row.errors_total_count ?? 0) > 0 || row.errors?.length || row.ids_of_invalid_requests?.length || ["error", "failed"].includes(row.status.toLowerCase())) return "failed";
  return row.status.toLowerCase() === "finished" ? "finished" : "pending";
}
