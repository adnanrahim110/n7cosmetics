import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { getStockProducts } from "./stock-data";
import { stockAvailability, type StockComponent } from "./stock";

export interface CatalogExportProduct {
  productId: string;
  variantId: string;
  name: string;
  productCode: string | null;
  isRecreation: boolean;
  slug: string;
  productType: "STANDARD" | "BUNDLE";
  description: string | null;
  shortDescription: string | null;
  brand: string | null;
  sku: string;
  pricePence: number;
  imageUrl: string | null;
  images: string[];
  size: string | null;
  availableQuantity: number | null;
  soldOut: boolean;
  components: StockComponent[];
  componentsVisible: boolean;
}

interface ProductRow extends RowDataPacket {
  product_id: string; variant_id: string; name: string; product_code: string | null; slug: string;
  product_type: "STANDARD" | "BUNDLE"; description: string | null; short_description: string | null;
  brand: string | null; sku: string; price_pence: number; size: string | null; components_visible: number; is_recreation: number;
}
interface ImageRow extends RowDataPacket { product_id: string; url: string }

// Keep providers on one published, purchasable catalogue. All queries use the
// same transaction snapshot, including component stock and product images.
export async function readCatalogExport(connection: PoolConnection): Promise<CatalogExportProduct[]> {
  const rows = await selectRows<ProductRow>(`SELECT CAST(p.id AS CHAR) AS product_id, CAST(v.id AS CHAR) AS variant_id,
    p.name, p.product_code, p.slug, p.product_type, p.description, p.short_description, p.brand,
    v.sku, v.price_pence, v.title AS size,
    EXISTS (SELECT 1 FROM product_collections pc INNER JOIN collections collection ON collection.id = pc.collection_id
      WHERE pc.product_id = p.id AND collection.slug = 'recreations') AS is_recreation,
    NOT EXISTS (SELECT 1 FROM bundle_items bi
      INNER JOIN product_variants component ON component.id = bi.component_variant_id
      WHERE bi.bundle_product_id = p.id AND NOT EXISTS
        (SELECT 1 FROM product_images image WHERE image.product_id = component.product_id)) AS components_visible
    FROM products p INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
    WHERE p.status = 'ACTIVE' ORDER BY p.id`, [], connection);
  if (new Set(rows.map(row => row.product_id)).size !== rows.length) throw new Error("A product has multiple active default variants.");
  const images = await selectRows<ImageRow>(`SELECT CAST(i.product_id AS CHAR) AS product_id, i.url
    FROM product_images i INNER JOIN products p ON p.id = i.product_id AND p.status = 'ACTIVE'
    ORDER BY i.product_id, i.sort_order, i.id`, [], connection);
  const stock = await getStockProducts(undefined, connection);
  const byVariant = new Map(stock.map(product => [product.variantId, product]));
  const byProduct = new Map<string, string[]>();
  for (const image of images) {
    const list = byProduct.get(image.product_id) ?? [];
    list.push(image.url);
    byProduct.set(image.product_id, list);
  }
  return rows.map(row => {
    const stockProduct = byVariant.get(row.variant_id);
    const availability = stockAvailability(stockProduct);
    const gallery = byProduct.get(row.product_id) ?? [];
    return {
      productId: row.product_id, variantId: row.variant_id, name: row.name, productCode: row.product_code,
      isRecreation: Boolean(row.is_recreation),
      slug: row.slug, productType: row.product_type, description: row.description, shortDescription: row.short_description,
      brand: row.brand, sku: row.sku, pricePence: Number(row.price_pence), imageUrl: gallery[0] ?? null, images: gallery,
      size: row.size, availableQuantity: availability.availableQuantity, soldOut: availability.soldOut,
      components: stockProduct?.components ?? [], componentsVisible: Boolean(row.components_visible),
    };
  });
}

export async function getCatalogExport(): Promise<CatalogExportProduct[]> {
  return withTransaction(readCatalogExport);
}
