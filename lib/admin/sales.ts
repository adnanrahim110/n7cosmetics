import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "@/lib/db/query";

export type SaleStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type SaleOfferType = "BUY_X_GET_Y_FREE";

export interface SaleListRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  status: SaleStatus;
  offer_type: SaleOfferType;
  buy_quantity: number;
  free_quantity: number;
  sort_order: number;
  product_ids: string | null;
  product_count: number | string;
  updated_at: Date;
}

export interface SaleProductOption extends RowDataPacket {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
}

export async function listSales(): Promise<SaleListRow[]> {
  return selectRows<SaleListRow>(
    `SELECT CAST(s.id AS CHAR) AS id, s.name, s.slug, s.status, s.offer_type,
       s.buy_quantity, s.free_quantity, s.sort_order, s.updated_at,
       (SELECT GROUP_CONCAT(sp.product_id ORDER BY sp.sort_order, sp.product_id)
        FROM sale_products sp WHERE sp.sale_id = s.id) AS product_ids,
       (SELECT COUNT(*) FROM sale_products sp WHERE sp.sale_id = s.id) AS product_count
     FROM sales s
     ORDER BY (s.status = 'ACTIVE') DESC, s.sort_order, s.updated_at DESC`,
  );
}

export async function getSale(id: string): Promise<SaleListRow | null> {
  return selectOne<SaleListRow>(
    `SELECT CAST(s.id AS CHAR) AS id, s.name, s.slug, s.status, s.offer_type,
       s.buy_quantity, s.free_quantity, s.sort_order, s.updated_at,
       (SELECT GROUP_CONCAT(sp.product_id ORDER BY sp.sort_order, sp.product_id)
        FROM sale_products sp WHERE sp.sale_id = s.id) AS product_ids,
       (SELECT COUNT(*) FROM sale_products sp WHERE sp.sale_id = s.id) AS product_count
     FROM sales s WHERE s.id = ? LIMIT 1`,
    [id],
  );
}

export async function getSaleProductOptions(): Promise<SaleProductOption[]> {
  return selectRows<SaleProductOption>(
    `SELECT CAST(p.id AS CHAR) AS id, p.name, v.sku,
       (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1
     WHERE p.product_type = 'STANDARD' AND p.status != 'ARCHIVED'
     ORDER BY p.name`,
  );
}
