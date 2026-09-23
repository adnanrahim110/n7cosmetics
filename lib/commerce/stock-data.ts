import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { hasDatabaseConfig } from "../env";
import { inspectStock, type StockItem, type StockProduct, type StockComponent } from "./stock";

interface ProductRow extends RowDataPacket {
  product_id: string; variant_id: string; product_type: "STANDARD" | "BUNDLE";
  slug: string; product_name: string; stock_on_hand: number; track_inventory: number;
}
interface ComponentRow extends RowDataPacket {
  bundle_product_id: string; variant_id: string; product_name: string; quantity: number;
  stock_on_hand: number; track_inventory: number; product_status: string; variant_status: string; product_type: string;
}

export async function getStockProducts(slugs?: readonly string[], connection?: PoolConnection, reservationKey?: string): Promise<StockProduct[]> {
  if ((!connection && !hasDatabaseConfig()) || slugs?.length === 0) return [];
  // Read-only availability may include stock held by this checkout. Creating a
  // new order never supplies this key and still reserves against physical stock.
  const stockSql = reservationKey ? `v.stock_on_hand + COALESCE((
    SELECT SUM(r.quantity) FROM checkout_stock_reservations r
    INNER JOIN stripe_checkouts c ON c.order_id = r.order_id
    INNER JOIN payments payment ON payment.order_id = c.order_id AND payment.provider = 'STRIPE'
    WHERE r.variant_id = v.id AND payment.idempotency_key = ?
      AND c.inventory_state = 'RESERVED' AND c.expires_at > CURRENT_TIMESTAMP(3)
  ), 0)` : "v.stock_on_hand";
  const reservationParams = reservationKey ? [reservationKey] : [];
  const rows = await selectRows<ProductRow>(`SELECT CAST(p.id AS CHAR) AS product_id, CAST(v.id AS CHAR) AS variant_id,
    p.slug, p.name AS product_name, p.product_type, p.track_inventory, ${stockSql} AS stock_on_hand
    FROM products p INNER JOIN product_variants v ON v.product_id = p.id AND v.is_default = 1 AND v.status = 'ACTIVE'
    WHERE p.status = 'ACTIVE' ${slugs ? `AND p.slug IN (${slugs.map(() => "?").join(",")})` : ""}`, [...reservationParams, ...(slugs ?? [])], connection);
  const bundleIds = rows.filter((row) => row.product_type === "BUNDLE").map((row) => row.product_id);
  const components = bundleIds.length ? await selectRows<ComponentRow>(`SELECT CAST(bi.bundle_product_id AS CHAR) AS bundle_product_id,
    CAST(bi.component_variant_id AS CHAR) AS variant_id, p.name AS product_name, bi.quantity, ${stockSql} AS stock_on_hand, p.track_inventory,
    p.status AS product_status, v.status AS variant_status, p.product_type
    FROM bundle_items bi LEFT JOIN product_variants v ON v.id = bi.component_variant_id LEFT JOIN products p ON p.id = v.product_id
    WHERE bi.bundle_product_id IN (${bundleIds.map(() => "?").join(",")})`, [...reservationParams, ...bundleIds], connection) : [];
  const byBundle = new Map<string, StockComponent[]>();
  for (const component of components) {
    const list = byBundle.get(component.bundle_product_id) ?? [];
    list.push({ variantId: component.variant_id, name: component.product_name, quantity: Number(component.quantity),
      stockOnHand: Number(component.stock_on_hand), trackInventory: Boolean(component.track_inventory),
      available: component.product_status === "ACTIVE" && component.variant_status === "ACTIVE" && component.product_type === "STANDARD" });
    byBundle.set(component.bundle_product_id, list);
  }
  return rows.map((row) => ({ slug: row.slug, name: row.product_name, variantId: row.variant_id, productType: row.product_type,
    stockOnHand: Number(row.stock_on_hand), trackInventory: Boolean(row.track_inventory), components: byBundle.get(row.product_id) ?? [] }));
}

export async function getStorefrontStock(items: readonly StockItem[] = [], reservationKey?: string) {
  return inspectStock(await getStockProducts(undefined, undefined, reservationKey), items);
}
