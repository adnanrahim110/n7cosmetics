import type { RowDataPacket } from "mysql2/promise";
import type { CollectionProduct } from "@/content/collections";
import { hasDatabaseConfig } from "@/lib/env";
import { selectOne, selectRows } from "@/lib/db/query";
import {
  defaultSalePageConfiguration,
  normalizeStorefrontPageDetail,
  normalizeStorefrontPageHero,
  storefrontSaleDatabaseKey,
  type StorefrontCollectionPageContent,
  type StorefrontPageConfiguration,
} from "@/lib/storefront-pages/config";

interface SaleRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  buy_quantity: number;
  free_quantity: number;
  sort_order: number;
}

interface SaleProductRow extends RowDataPacket {
  sale_id: string;
  id: string;
  slug: string;
  name: string;
  inspired_by: string | null;
  audience: string;
  category: string | null;
  price_pence: number;
  compare_at_price_pence: number | null;
  image_url: string;
  average_rating: number | string;
}

interface PageSectionRow extends RowDataPacket {
  page_key: string;
  section_key: "hero" | "detail";
  content_json: unknown;
}

export interface AvailableSaleNavigationItem {
  id: string;
  name: string;
  slug: string;
  href: string;
}

export interface SaleStorefrontContent extends Omit<StorefrontCollectionPageContent, "slug"> {
  slug: "sale";
  saleId: string;
  saleName: string;
  saleSlug: string;
  buyQuantity: number;
  freeQuantity: number;
}

function parseContentJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function mapProduct(row: SaleProductRow): CollectionProduct {
  return {
    id: row.id,
    slug: row.slug,
    productType: "STANDARD",
    name: row.name,
    category: row.category ?? "Fragrance",
    price: row.price_pence / 100,
    compareAtPrice: row.compare_at_price_pence
      ? row.compare_at_price_pence / 100
      : undefined,
    rating: Number(row.average_rating) || 0,
    inspiredBy: row.inspired_by,
    audience: row.audience,
    image: row.image_url,
  };
}

export async function getAvailableSaleNavigationItems(): Promise<AvailableSaleNavigationItem[]> {
  if (!hasDatabaseConfig()) return [];
  const rows = await selectRows<SaleRow>(
    `SELECT CAST(s.id AS CHAR) AS id, s.name, s.slug, s.buy_quantity, s.free_quantity, s.sort_order
     FROM sales s
     WHERE s.status = 'ACTIVE'
     ORDER BY s.sort_order, s.created_at, s.id`,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    href: `/sale/${row.slug}`,
  }));
}

export async function getSalePageConfiguration(
  saleId: string,
  saleName: string,
  buyQuantity: number,
  freeQuantity: number,
): Promise<StorefrontPageConfiguration> {
  const fallback = defaultSalePageConfiguration(
    saleName,
    buyQuantity,
    freeQuantity,
  );
  if (!hasDatabaseConfig()) return fallback;
  const rows = await selectRows<PageSectionRow>(
    `SELECT page_key, section_key, content_json
     FROM page_sections
     WHERE page_key = ? AND section_key IN ('hero', 'detail') AND is_enabled = 1`,
    [storefrontSaleDatabaseKey(saleId)],
  );
  const sections = new Map(
    rows.map((row) => [row.section_key, parseContentJson(row.content_json)]),
  );
  return {
    hero: sections.has("hero")
      ? normalizeStorefrontPageHero(sections.get("hero"))
      : fallback.hero,
    detail: sections.has("detail")
      ? normalizeStorefrontPageDetail(sections.get("detail"))
      : fallback.detail,
  };
}

export async function getActiveSalePage(
  slug: string,
): Promise<SaleStorefrontContent | null> {
  if (!hasDatabaseConfig()) return null;
  const sale = await selectOne<SaleRow>(
    `SELECT CAST(s.id AS CHAR) AS id, s.name, s.slug, s.buy_quantity, s.free_quantity, s.sort_order
     FROM sales s
     WHERE s.status = 'ACTIVE' AND s.slug = ?
     LIMIT 1`,
    [slug],
  );
  if (!sale) return null;
  const products = await selectRows<SaleProductRow>(
    `SELECT CAST(sp.sale_id AS CHAR) AS sale_id, CAST(p.id AS CHAR) AS id,
       p.slug, p.name, p.inspired_by, p.audience,
       (SELECT c.name FROM product_categories pc INNER JOIN categories c ON c.id = pc.category_id
        WHERE pc.product_id = p.id ORDER BY c.sort_order, c.name LIMIT 1) AS category,
       v.price_pence, v.compare_at_price_pence,
       (SELECT i.url FROM product_images i WHERE i.product_id = p.id ORDER BY i.sort_order, i.id LIMIT 1) AS image_url,
       COALESCE((SELECT AVG(pr.rating) FROM product_reviews pr WHERE pr.product_id = p.id AND pr.status = 'PUBLISHED'), 0) AS average_rating
     FROM sale_products sp
     INNER JOIN products p ON p.id = sp.product_id AND p.status = 'ACTIVE' AND p.product_type = 'STANDARD'
     INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
     WHERE sp.sale_id = ?
       AND EXISTS (SELECT 1 FROM product_images required_image WHERE required_image.product_id = p.id)
     ORDER BY sp.sale_id, sp.sort_order, p.name`,
    [sale.id],
  );
  const saleProducts = products.map(mapProduct);
  const pageConfiguration = await getSalePageConfiguration(
    sale.id,
    sale.name,
    sale.buy_quantity,
    sale.free_quantity,
  );
  const heroProducts = pageConfiguration.hero.productIds.flatMap((id) => {
    const product = saleProducts.find((candidate) => candidate.id === id);
    return product ? [product] : [];
  });
  return {
    slug: "sale",
    saleId: sale.id,
    saleName: sale.name,
    saleSlug: sale.slug,
    buyQuantity: sale.buy_quantity,
    freeQuantity: sale.free_quantity,
    eyebrow: pageConfiguration.hero.eyebrow,
    title: pageConfiguration.hero.title,
    intro: pageConfiguration.hero.intro,
    statement: pageConfiguration.hero.statement,
    credit: pageConfiguration.detail.credit,
    highlights: pageConfiguration.hero.highlights,
    products: saleProducts,
    pageConfiguration,
    heroProducts,
  };
}
