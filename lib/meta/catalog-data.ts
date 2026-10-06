import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { getStockProducts } from "../commerce/stock-data";
import { stockAvailability } from "../commerce/stock";
import { getApplicationConfig } from "../env";
import { buildCatalogItem, type CatalogItem } from "./catalog-product";
import { metaContentId } from "./shared";

interface ProductRow extends RowDataPacket {
  product_id: string; variant_id: string; name: string; product_code: string | null; slug: string;
  product_type: "STANDARD" | "BUNDLE"; description: string | null; short_description: string | null;
  brand: string | null; price_pence: number; image_url: string | null; size: string | null;
}
export interface CatalogSnapshotItem { id: string; name: string; item?: CatalogItem; error?: string }
export async function getCatalogSnapshot(): Promise<CatalogSnapshotItem[]> {
  const [rows, stock] = await Promise.all([
    selectRows<ProductRow>(`SELECT CAST(p.id AS CHAR) AS product_id, CAST(v.id AS CHAR) AS variant_id,
      p.name, p.product_code, p.slug, p.product_type, p.description, p.short_description, p.brand,
      v.price_pence, v.title AS size, i.url AS image_url
      FROM products p INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
      LEFT JOIN product_images i ON i.id = (SELECT image.id FROM product_images image WHERE image.product_id = p.id ORDER BY image.sort_order, image.id LIMIT 1)
      WHERE p.status = 'ACTIVE' ORDER BY p.id`),
    getStockProducts(),
  ]);
  const byId = new Map(stock.map(product => [product.variantId, stockAvailability(product)]));
  return rows.map(row => {
    const availability = byId.get(row.variant_id);
    const result = buildCatalogItem({
      productId: row.product_id, variantId: row.variant_id, name: row.name, productCode: row.product_code,
      slug: row.slug, productType: row.product_type, description: row.description, shortDescription: row.short_description,
      brand: row.brand, pricePence: Number(row.price_pence), imageUrl: row.image_url, size: row.size,
      availableQuantity: availability?.availableQuantity ?? (availability ? null : 0), soldOut: availability?.soldOut ?? true,
    }, getApplicationConfig().appUrl);
    return { id: metaContentId(row.variant_id), name: `${row.product_code?.trim() ? `${row.product_code.trim()} — ` : ""}${row.name}`.slice(0, 190), ...result };
  });
}
