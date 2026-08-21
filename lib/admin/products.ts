import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "@/lib/db/query";

export interface ProductListRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  product_type: "STANDARD" | "BUNDLE";
  sku: string | null;
  price_pence: number | null;
  stock_on_hand: number | null;
  image_url: string | null;
  updated_at: Date;
}

export interface CatalogOption extends RowDataPacket {
  id: string;
  name: string;
  image_url: string | null;
}

interface ProductCountRow extends RowDataPacket {
  total_count: number | string;
}

export interface ProductPageResult {
  products: ProductListRow[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface ProductFormRecord extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  product_type: "STANDARD" | "BUNDLE";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  short_description: string | null;
  description: string | null;
  brand: string | null;
  inspired_by: string | null;
  audience: "MEN" | "WOMEN" | "UNISEX" | "UNSPECIFIED";
  fragrance_notes_json: string[] | null;
  featured: number;
  track_inventory: number;
  seo_title: string | null;
  seo_description: string | null;
  variant_id: string | null;
  variant_title: string | null;
  sku: string | null;
  price_pence: number | null;
  compare_at_price_pence: number | null;
  stock_on_hand: number | null;
  low_stock_threshold: number | null;
  weight_grams: number | null;
  image_url: string | null;
  image_alt: string | null;
  video_url: string | null;
  category_ids: string | null;
  collection_ids: string | null;
}

export async function listProducts(search: string, requestedPage: number, pageSize = 20): Promise<ProductPageResult> {
  const term = search ? `%${search}%` : "%";
  const count = await selectOne<ProductCountRow>(
    `SELECT COUNT(DISTINCT p.id) AS total_count
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     WHERE p.name LIKE ? OR p.slug LIKE ? OR v.sku LIKE ?`,
    [term, term, term],
  );
  const totalItems = Number(count?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;
  const products = await selectRows<ProductListRow>(
    `SELECT
       CAST(p.id AS CHAR) AS id,
       p.name,
       p.slug,
       p.status,
       p.product_type,
       v.sku,
       v.price_pence,
       v.stock_on_hand,
       i.url AS image_url,
       p.updated_at
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     LEFT JOIN product_images i ON i.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     WHERE p.name LIKE ? OR p.slug LIKE ? OR v.sku LIKE ?
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [term, term, term, pageSize, offset],
  );
  return { products, totalItems, page, pageSize };
}

export async function getCatalogOptions(): Promise<{ categories: CatalogOption[]; collections: CatalogOption[] }> {
  const [categories, collections] = await Promise.all([
    selectRows<CatalogOption>("SELECT CAST(id AS CHAR) AS id, name, image_url FROM categories WHERE status != 'HIDDEN' ORDER BY name"),
    selectRows<CatalogOption>("SELECT CAST(id AS CHAR) AS id, name, image_url FROM collections WHERE status != 'ARCHIVED' ORDER BY name"),
  ]);
  return { categories, collections };
}

export async function getProductForEdit(id: string): Promise<ProductFormRecord | null> {
  return selectOne<ProductFormRecord>(
    `SELECT
       CAST(p.id AS CHAR) AS id,
       p.name, p.slug, p.product_type, p.status, p.short_description, p.description,
       p.brand, p.inspired_by, p.audience, p.fragrance_notes_json, p.featured,
       p.track_inventory, p.seo_title, p.seo_description,
       CAST(v.id AS CHAR) AS variant_id, v.title AS variant_title, v.sku,
       v.price_pence, v.compare_at_price_pence, v.stock_on_hand,
       v.low_stock_threshold, v.weight_grams,
       i.url AS image_url, i.alt_text AS image_alt,
       (SELECT pv.url FROM product_videos pv WHERE pv.product_id = p.id ORDER BY pv.sort_order, pv.id LIMIT 1) AS video_url,
       (SELECT GROUP_CONCAT(pc.category_id) FROM product_categories pc WHERE pc.product_id = p.id) AS category_ids,
       (SELECT GROUP_CONCAT(pc.collection_id) FROM product_collections pc WHERE pc.product_id = p.id) AS collection_ids
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     LEFT JOIN product_images i ON i.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     WHERE p.id = ?
     LIMIT 1`,
    [id],
  );
}
