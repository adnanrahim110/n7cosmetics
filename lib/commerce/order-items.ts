import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";

export interface OrderItem extends RowDataPacket {
  id: string; product_name: string; product_code: string | null; variant_title: string; sku: string;
  unit_price_pence: number; quantity: number; discount_pence: number; line_total_pence: number; image_url: string | null;
}

export function getOrderItems(orderId: string, connection?: PoolConnection): Promise<OrderItem[]> {
  return selectRows<OrderItem>(`SELECT CAST(oi.id AS CHAR) AS id, oi.product_name,
    COALESCE(NULLIF(oi.product_code, ''), NULLIF(p.product_code, ''), NULLIF(oi.sku, '')) AS product_code,
    oi.variant_title, oi.sku, oi.unit_price_pence, oi.quantity, oi.discount_pence, oi.line_total_pence, oi.image_url
    FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ? ORDER BY oi.id`, [orderId], connection);
}
