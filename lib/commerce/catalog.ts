import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";

export interface ProductNoteGroups {
  top: string[];
  heart: string[];
  base: string[];
}

export interface StorefrontProductImage {
  url: string;
  alt: string;
}

export interface StorefrontProductVideo {
  url: string;
  title: string;
}

export interface StorefrontProduct {
  id: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  inspiredBy: string | null;
  audience: string;
  notes: string[];
  noteGroups: ProductNoteGroups;
  seoTitle: string | null;
  seoDescription: string | null;
  pricePence: number;
  compareAtPricePence: number | null;
  stockOnHand: number;
  trackInventory: boolean;
  weightGrams: number | null;
  image: string;
  imageAlt: string;
  video: string | null;
  images: StorefrontProductImage[];
  videos: StorefrontProductVideo[];
  collectionSlug: string | null;
}

export interface StorefrontRelatedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  audience: string;
  variantTitle: string;
  pricePence: number;
  compareAtPricePence: number | null;
  rating: number;
  image: string;
  imageAlt: string;
}

interface StorefrontProductRow extends RowDataPacket {
  id: string;
  variant_id: string;
  variant_title: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  brand: string | null;
  inspired_by: string | null;
  audience: string;
  fragrance_notes_json: unknown;
  seo_title: string | null;
  seo_description: string | null;
  price_pence: number;
  compare_at_price_pence: number | null;
  stock_on_hand: number;
  weight_grams: number | null;
  track_inventory: number;
  collection_slug: string | null;
}

interface ProductImageRow extends RowDataPacket { url: string; alt_text: string | null }
interface ProductVideoRow extends RowDataPacket { url: string; title: string | null }

interface RelatedProductRow extends RowDataPacket {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  audience: string;
  variant_title: string;
  price_pence: number;
  compare_at_price_pence: number | null;
  image_url: string;
  image_alt: string | null;
  average_rating: number | string;
}

function noteGroupsFromJson(value: unknown): ProductNoteGroups {
  if (typeof value === "string") {
    try { return noteGroupsFromJson(JSON.parse(value)); } catch { return { top: [], heart: [], base: [] }; }
  }
  if (Array.isArray(value)) {
    return { top: value.filter((item): item is string => typeof item === "string"), heart: [], base: [] };
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const read = (key: keyof ProductNoteGroups) => Array.isArray(record[key]) ? record[key].filter((note): note is string => typeof note === "string") : [];
    return { top: read("top"), heart: read("heart"), base: read("base") };
  }
  return { top: [], heart: [], base: [] };
}

export async function getStorefrontProduct(slug: string): Promise<StorefrontProduct | null> {
  if (hasDatabaseConfig()) {
    const row = await selectOne<StorefrontProductRow>(
      `SELECT CAST(p.id AS CHAR) AS id, CAST(v.id AS CHAR) AS variant_id, p.slug, p.name,
         p.short_description, p.description, p.brand, p.inspired_by, p.audience,
         p.fragrance_notes_json, p.seo_title, p.seo_description, p.track_inventory,
         (SELECT col.slug
          FROM product_collections pc
          INNER JOIN collections col ON col.id = pc.collection_id AND col.status = 'ACTIVE'
          WHERE pc.product_id = p.id
          ORDER BY FIELD(col.slug, 'n7', 'bundles', 'premium-collection', 'recreations', 'yusuf-bhai-originals', 'sale'), pc.sort_order
          LIMIT 1) AS collection_slug,
         v.title AS variant_title, v.sku, v.price_pence, v.compare_at_price_pence,
         v.stock_on_hand, v.weight_grams
       FROM products p
       INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
       WHERE p.slug = ? AND p.status = 'ACTIVE'
       LIMIT 1`,
      [slug],
    );
    if (!row) return null;
    const [imageRows, videoRows] = await Promise.all([
      selectRows<ProductImageRow>("SELECT url, alt_text FROM product_images WHERE product_id = ? ORDER BY sort_order, id", [row.id]),
      selectRows<ProductVideoRow>("SELECT url, title FROM product_videos WHERE product_id = ? ORDER BY sort_order, id", [row.id]),
    ]);
    const images = imageRows.map((image, index) => ({ url: image.url, alt: image.alt_text ?? `${row.name} product image ${index + 1}` }));
    const videos = videoRows.map((video, index) => ({ url: video.url, title: video.title ?? `${row.name} product video ${index + 1}` }));
    if (!images.length) return null;
    const noteGroups = noteGroupsFromJson(row.fragrance_notes_json);
    const primaryImage = images[0];
    return {
      id: row.id,
      variantId: row.variant_id,
      variantTitle: row.variant_title,
      sku: row.sku,
      slug: row.slug,
      name: row.name,
      shortDescription: row.short_description,
      description: row.description,
      brand: row.brand,
      inspiredBy: row.inspired_by,
      audience: row.audience,
      notes: [...noteGroups.top, ...noteGroups.heart, ...noteGroups.base],
      noteGroups,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      pricePence: row.price_pence,
      compareAtPricePence: row.compare_at_price_pence,
      stockOnHand: row.stock_on_hand,
      trackInventory: Boolean(row.track_inventory),
      weightGrams: row.weight_grams,
      image: primaryImage.url,
      imageAlt: primaryImage.alt,
      video: videos[0]?.url ?? null,
      images,
      videos,
      collectionSlug: row.collection_slug,
    };
  }

  return null;
}

export async function getRelatedStorefrontProducts(
  productId: string,
  audience: string,
): Promise<StorefrontRelatedProduct[]> {
  if (!hasDatabaseConfig()) return [];

  const rows = await selectRows<RelatedProductRow>(
    `SELECT CAST(p.id AS CHAR) AS id, p.slug, p.name, p.brand, p.audience,
       v.title AS variant_title, v.price_pence, v.compare_at_price_pence,
       image.url AS image_url, image.alt_text AS image_alt,
       COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating,
       (
         (SELECT COUNT(*)
          FROM product_collections current_pc
          INNER JOIN product_collections related_pc ON related_pc.collection_id = current_pc.collection_id
          WHERE current_pc.product_id = ? AND related_pc.product_id = p.id) * 3
         +
         (SELECT COUNT(*)
          FROM product_categories current_pc
          INNER JOIN product_categories related_pc ON related_pc.category_id = current_pc.category_id
          WHERE current_pc.product_id = ? AND related_pc.product_id = p.id)
       ) AS relevance_score
     FROM products p
     INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
     INNER JOIN product_images image ON image.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     WHERE p.id != ? AND p.status = 'ACTIVE'
     ORDER BY relevance_score DESC, (p.audience = ?) DESC, p.featured DESC, p.updated_at DESC
     LIMIT 8`,
    [productId, productId, productId, audience],
  );

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    audience: row.audience,
    variantTitle: row.variant_title,
    pricePence: Number(row.price_pence),
    compareAtPricePence: row.compare_at_price_pence === null ? null : Number(row.compare_at_price_pence),
    rating: Number(row.average_rating) || 0,
    image: row.image_url,
    imageAlt: row.image_alt ?? `${row.name} product image`,
  }));
}
