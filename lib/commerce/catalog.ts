import type { RowDataPacket } from "mysql2/promise";
import { collectionPages } from "@/content/collections";
import { slugify } from "@/lib/admin/form";
import { selectOne } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";

export interface StorefrontProduct {
  id: string;
  variantId: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  inspiredBy: string | null;
  audience: string;
  notes: string[];
  pricePence: number;
  compareAtPricePence: number | null;
  stockOnHand: number;
  trackInventory: boolean;
  image: string;
  imageAlt: string;
  video: string | null;
}

interface StorefrontProductRow extends RowDataPacket {
  id: string; variant_id: string; slug: string; name: string; short_description: string | null; description: string | null;
  brand: string | null; inspired_by: string | null; audience: string; fragrance_notes_json: unknown;
  price_pence: number; compare_at_price_pence: number | null; stock_on_hand: number; track_inventory: number;
  image_url: string | null; image_alt: string | null; video_url: string | null;
}

function notesFromJson(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") { try { return notesFromJson(JSON.parse(value)); } catch { return []; } }
  return [];
}

export async function getStorefrontProduct(slug: string): Promise<StorefrontProduct | null> {
  if (hasDatabaseConfig()) {
    const row = await selectOne<StorefrontProductRow>(
      `SELECT CAST(p.id AS CHAR) AS id, CAST(v.id AS CHAR) AS variant_id, p.slug, p.name,
         p.short_description, p.description, p.brand, p.inspired_by, p.audience,
         p.fragrance_notes_json, p.track_inventory, v.price_pence, v.compare_at_price_pence,
         v.stock_on_hand, i.url AS image_url, i.alt_text AS image_alt,
         (SELECT pv.url FROM product_videos pv WHERE pv.product_id = p.id ORDER BY pv.sort_order, pv.id LIMIT 1) AS video_url
       FROM products p
       INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
       LEFT JOIN product_images i ON i.id = (SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1)
       WHERE p.slug = ? AND p.status = 'ACTIVE'
       LIMIT 1`,
      [slug],
    );
    return row ? { id: row.id, variantId: row.variant_id, slug: row.slug, name: row.name, shortDescription: row.short_description, description: row.description, brand: row.brand, inspiredBy: row.inspired_by, audience: row.audience, notes: notesFromJson(row.fragrance_notes_json), pricePence: row.price_pence, compareAtPricePence: row.compare_at_price_pence, stockOnHand: row.stock_on_hand, trackInventory: Boolean(row.track_inventory), image: row.image_url ?? "/imgs/products/1.png", imageAlt: row.image_alt ?? row.name, video: row.video_url } : null;
  }

  const fallback = Object.values(collectionPages).flatMap((collection) => collection.products).find((item) => slugify(item.name) === slug);
  return fallback ? { id: slug, variantId: slug, slug, name: fallback.name, shortDescription: `${fallback.category} fragrance by N7 Cosmetics.`, description: null, brand: "N7 Cosmetics", inspiredBy: null, audience: "UNSPECIFIED", notes: [], pricePence: Math.round(fallback.price * 100), compareAtPricePence: null, stockOnHand: 100, trackInventory: true, image: fallback.image, imageAlt: fallback.name, video: null } : null;
}
