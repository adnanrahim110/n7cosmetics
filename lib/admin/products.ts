import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "@/lib/db/query";
import type { ProductListFilters } from "@/lib/admin/product-list-filters";

export interface ProductListRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  product_type: "STANDARD" | "BUNDLE";
  brand: string | null;
  inspired_by: string | null;
  audience: "MEN" | "WOMEN" | "UNISEX" | "UNSPECIFIED";
  featured: number;
  price_pence: number | null;
  stock_on_hand: number | null;
  image_url: string | null;
  category_names: string | null;
  collection_names: string | null;
  updated_at: Date;
}

export interface CatalogOption extends RowDataPacket {
  id: string;
  name: string;
  image_url: string | null;
}

export interface ProductFilterOption extends RowDataPacket {
  id: string;
  name: string;
  status: string;
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
  fragrance_notes_json: string[] | string | null;
  featured: number;
  track_inventory: number;
  seo_title: string | null;
  seo_description: string | null;
  variant_id: string | null;
  variant_title: string | null;
  sku: string | null;
  price_pence: number | null;
  compare_at_price_pence: number | null;
  cost_pence: number | null;
  stock_on_hand: number | null;
  low_stock_threshold: number | null;
  weight_grams: number | null;
  category_ids: string | null;
  collection_ids: string | null;
  images: ProductImageRecord[];
  videos: ProductVideoRecord[];
}

export interface ProductImageRecord extends RowDataPacket {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface ProductVideoRecord extends RowDataPacket {
  id: string;
  url: string;
  title: string | null;
  sort_order: number;
}

function productListWhere(filters: ProductListFilters): { sql: string; values: Array<string | number> } {
  const clauses: string[] = [];
  const values: Array<string | number> = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    clauses.push(`(
      p.name LIKE ?
      OR p.slug LIKE ?
      OR p.brand LIKE ?
      OR p.inspired_by LIKE ?
      OR EXISTS (
        SELECT 1 FROM product_variants search_variant
        WHERE search_variant.product_id = p.id AND search_variant.is_default = 1 AND search_variant.sku LIKE ?
      )
      OR EXISTS (
        SELECT 1
        FROM product_categories search_pc
        INNER JOIN categories search_category ON search_category.id = search_pc.category_id
        WHERE search_pc.product_id = p.id AND search_category.name LIKE ?
      )
      OR EXISTS (
        SELECT 1
        FROM product_collections search_pc
        INNER JOIN collections search_collection ON search_collection.id = search_pc.collection_id
        WHERE search_pc.product_id = p.id AND search_collection.name LIKE ?
      )
    )`);
    values.push(term, term, term, term, term, term, term);
  }
  if (filters.status) {
    clauses.push("p.status = ?");
    values.push(filters.status);
  }
  if (filters.productType) {
    clauses.push("p.product_type = ?");
    values.push(filters.productType);
  }
  if (filters.audience) {
    clauses.push("p.audience = ?");
    values.push(filters.audience);
  }
  if (filters.categoryId) {
    clauses.push("EXISTS (SELECT 1 FROM product_categories filter_category WHERE filter_category.product_id = p.id AND filter_category.category_id = ?)");
    values.push(filters.categoryId);
  }
  if (filters.collectionId) {
    clauses.push("EXISTS (SELECT 1 FROM product_collections filter_collection WHERE filter_collection.product_id = p.id AND filter_collection.collection_id = ?)");
    values.push(filters.collectionId);
  }
  if (filters.featured) {
    clauses.push("p.featured = ?");
    values.push(filters.featured === "yes" ? 1 : 0);
  }

  return { sql: clauses.length ? `WHERE ${clauses.join("\n       AND ")}` : "", values };
}

export async function listProducts(filters: ProductListFilters, requestedPage: number, pageSize = 20): Promise<ProductPageResult> {
  const where = productListWhere(filters);
  const count = await selectOne<ProductCountRow>(
    `SELECT COUNT(DISTINCT p.id) AS total_count
     FROM products p
     ${where.sql}`,
    where.values,
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
       p.brand,
       p.inspired_by,
       p.audience,
       p.featured,
       v.price_pence,
       v.stock_on_hand,
       i.url AS image_url,
       (
         SELECT GROUP_CONCAT(c.name ORDER BY c.name SEPARATOR '|||')
         FROM product_categories pc
         INNER JOIN categories c ON c.id = pc.category_id
         WHERE pc.product_id = p.id
       ) AS category_names,
       (
         SELECT GROUP_CONCAT(c.name ORDER BY pc.sort_order, c.name SEPARATOR '|||')
         FROM product_collections pc
         INNER JOIN collections c ON c.id = pc.collection_id
         WHERE pc.product_id = p.id
       ) AS collection_names,
       p.updated_at
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     LEFT JOIN product_images i ON i.id = (
       SELECT pi.id FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1
     )
     ${where.sql}
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...where.values, pageSize, offset],
  );
  return { products, totalItems, page, pageSize };
}

export async function getProductListFilterOptions(): Promise<{ categories: ProductFilterOption[]; collections: ProductFilterOption[] }> {
  const [categories, collections] = await Promise.all([
    selectRows<ProductFilterOption>("SELECT CAST(id AS CHAR) AS id, name, status FROM categories ORDER BY name"),
    selectRows<ProductFilterOption>("SELECT CAST(id AS CHAR) AS id, name, status FROM collections ORDER BY name"),
  ]);
  return { categories, collections };
}

export async function getCatalogOptions(): Promise<{ categories: CatalogOption[]; collections: CatalogOption[] }> {
  const [categories, collections] = await Promise.all([
    selectRows<CatalogOption>("SELECT CAST(id AS CHAR) AS id, name, image_url FROM categories WHERE status != 'HIDDEN' ORDER BY name"),
    selectRows<CatalogOption>("SELECT CAST(id AS CHAR) AS id, name, image_url FROM collections WHERE status != 'ARCHIVED' ORDER BY name"),
  ]);
  return { categories, collections };
}

export async function getProductForEdit(id: string): Promise<ProductFormRecord | null> {
  const product = await selectOne<ProductFormRecord>(
    `SELECT
       CAST(p.id AS CHAR) AS id,
       p.name, p.slug, p.product_type, p.status, p.short_description, p.description,
       p.brand, p.inspired_by, p.audience, p.fragrance_notes_json, p.featured,
       p.track_inventory, p.seo_title, p.seo_description,
       CAST(v.id AS CHAR) AS variant_id, v.title AS variant_title, v.sku,
       v.price_pence, v.compare_at_price_pence, v.cost_pence, v.stock_on_hand,
       v.low_stock_threshold, v.weight_grams,
       (SELECT GROUP_CONCAT(pc.category_id) FROM product_categories pc WHERE pc.product_id = p.id) AS category_ids,
       (SELECT GROUP_CONCAT(pc.collection_id) FROM product_collections pc WHERE pc.product_id = p.id) AS collection_ids
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     WHERE p.id = ?
     LIMIT 1`,
    [id],
  );
  if (!product) return null;
  const [images, videos] = await Promise.all([
    selectRows<ProductImageRecord>(
      "SELECT CAST(id AS CHAR) AS id, url, alt_text, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order, id",
      [id],
    ),
    selectRows<ProductVideoRecord>(
      "SELECT CAST(id AS CHAR) AS id, url, title, sort_order FROM product_videos WHERE product_id = ? ORDER BY sort_order, id",
      [id],
    ),
  ]);
  product.images = images;
  product.videos = videos;
  return product;
}
