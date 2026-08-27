import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "@/lib/db/query";

export interface BundleListRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  price_pence: number | null;
  stock_on_hand: number | null;
  image_url: string | null;
  component_count: number | string;
  updated_at: Date;
}

export interface BundleProductOption extends RowDataPacket {
  variant_id: string;
  product_id: string;
  name: string;
  variant_title: string;
  price_pence: number;
  image_url: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
}

export interface BundleImageRecord extends RowDataPacket {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface BundleVideoRecord extends RowDataPacket {
  id: string;
  url: string;
  title: string | null;
  sort_order: number;
}

export interface BundleFormRecord extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  short_description: string | null;
  description: string | null;
  featured: number;
  seo_title: string | null;
  seo_description: string | null;
  variant_id: string | null;
  variant_title: string | null;
  price_pence: number | null;
  compare_at_price_pence: number | null;
  cost_pence: number | null;
  stock_on_hand: number | null;
  weight_grams: number | null;
  component_variant_ids: string | null;
  images: BundleImageRecord[];
  videos: BundleVideoRecord[];
}

export async function listBundles(): Promise<BundleListRow[]> {
  return selectRows<BundleListRow>(
    `SELECT
       CAST(p.id AS CHAR) AS id,
       p.name,
       p.slug,
       p.status,
       v.price_pence,
       v.stock_on_hand,
       i.url AS image_url,
       (SELECT COUNT(*) FROM bundle_items bi WHERE bi.bundle_product_id = p.id) AS component_count,
       p.updated_at
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     LEFT JOIN product_images i ON i.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     WHERE p.product_type = 'BUNDLE'
     ORDER BY p.updated_at DESC`,
  );
}

export async function getBundleProductOptions(): Promise<BundleProductOption[]> {
  return selectRows<BundleProductOption>(
    `SELECT
       CAST(v.id AS CHAR) AS variant_id,
       CAST(p.id AS CHAR) AS product_id,
       p.name,
       v.title AS variant_title,
       v.price_pence,
       p.status,
       i.url AS image_url
     FROM products p
     INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
     LEFT JOIN product_images i ON i.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     WHERE p.product_type = 'STANDARD' AND p.status != 'ARCHIVED'
     ORDER BY p.name`,
  );
}

export async function getBundleForEdit(id: string): Promise<BundleFormRecord | null> {
  const bundle = await selectOne<BundleFormRecord>(
    `SELECT
       CAST(p.id AS CHAR) AS id,
       p.name,
       p.slug,
       p.status,
       p.short_description,
       p.description,
       p.featured,
       p.seo_title,
       p.seo_description,
       CAST(v.id AS CHAR) AS variant_id,
       v.title AS variant_title,
       v.price_pence,
       v.compare_at_price_pence,
       v.cost_pence,
       v.stock_on_hand,
       v.weight_grams,
       (
         SELECT GROUP_CONCAT(bi.component_variant_id ORDER BY bi.sort_order, bi.component_variant_id)
         FROM bundle_items bi
         WHERE bi.bundle_product_id = p.id
       ) AS component_variant_ids
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     WHERE p.id = ? AND p.product_type = 'BUNDLE'
     LIMIT 1`,
    [id],
  );
  if (!bundle) return null;

  const [images, videos] = await Promise.all([
    selectRows<BundleImageRecord>(
      "SELECT CAST(id AS CHAR) AS id, url, alt_text, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, id",
      [id],
    ),
    selectRows<BundleVideoRecord>(
      "SELECT CAST(id AS CHAR) AS id, url, title, sort_order FROM product_videos WHERE product_id = ? ORDER BY sort_order, id",
      [id],
    ),
  ]);
  bundle.images = images;
  bundle.videos = videos;
  return bundle;
}
