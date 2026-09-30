import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import {
  calendarDate,
  dashboardRange,
  dayStartUtc,
  shiftDate,
  type DashboardRange,
  type DashboardSource,
  type DashboardQuery,
} from "./dashboard-dates";

// A live checkout must be in Stripe live mode; imported historical orders have no checkout row.
const eligible =
  "(? = 'ALL' OR o.source = ?) AND (o.source = 'LEGACY' OR EXISTS (SELECT 1 FROM stripe_checkouts sc WHERE sc.order_id = o.id AND sc.stripe_mode = 'live'))";
const paid = "o.payment_status IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')";
const paidAt = "COALESCE(o.paid_at, o.placed_at)";
const paymentAt =
  "CASE WHEN p.payment_type = 'CHARGE' THEN COALESCE(o.paid_at,p.processed_at,p.created_at) ELSE COALESCE(p.processed_at,p.created_at) END";
export interface StoreDay {
  date: string;
  paidOrders: number;
  orderValue: number;
  subtotal: number;
  discounts: number;
  shipping: number;
  tax: number;
  charges: number;
  refunds: number;
  netReceipts: number;
}
export interface StoreTotals extends Omit<StoreDay, "date"> {
  averageOrder: number;
}
interface HourRow extends RowDataPacket {
  hour: string;
  paid_orders?: number;
  order_value?: string;
  subtotal?: string;
  discounts?: string;
  shipping?: string;
  tax?: string;
  charges?: string;
  refunds?: string;
}
export interface TopProduct extends RowDataPacket {
  product_id: string | null;
  product_type: string | null;
  product_code: string | null;
  name: string;
  units: string;
  value: string;
}
export interface CollectionSales extends RowDataPacket {
  collection_id: string | null;
  name: string;
  units: string;
  value: string;
}
export interface RecentOrder extends RowDataPacket {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_pence: number;
  currency: string;
  placed_at: Date;
  source: string;
}
export interface LowStock extends RowDataPacket {
  variant_id: string;
  product_id: string;
  product_code: string | null;
  name: string;
  title: string;
  stock_on_hand: number;
  low_stock_threshold: number;
}
export interface AwaitingOrder extends RowDataPacket {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  fulfillment_status: string;
  placed_at: Date;
  source: string;
}
export function emptyStoreDay(date: string): StoreDay {
  return {
    date,
    paidOrders: 0,
    orderValue: 0,
    subtotal: 0,
    discounts: 0,
    shipping: 0,
    tax: 0,
    charges: 0,
    refunds: 0,
    netReceipts: 0,
  };
}
export function storeTotals(days: StoreDay[]): StoreTotals {
  const total = days.reduce<StoreTotals>(
    (sum, day) => {
      for (const key of [
        "paidOrders",
        "orderValue",
        "subtotal",
        "discounts",
        "shipping",
        "tax",
        "charges",
        "refunds",
        "netReceipts",
      ] as const)
        sum[key] += day[key];
      return sum;
    },
    { ...emptyStoreDay(""), averageOrder: 0 },
  );
  return {
    ...total,
    averageOrder: total.paidOrders
      ? Math.round(total.orderValue / total.paidOrders)
      : 0,
  };
}
export async function getDashboardRange(
  query: DashboardQuery,
  now = new Date(),
) {
  const range = dashboardRange(query, now);
  if (range.preset !== "all") return range;
  const history = await selectOne<RowDataPacket>(
    `SELECT MIN(first_at) first_at FROM (
      SELECT MIN(LEAST(o.placed_at, COALESCE(o.paid_at,o.placed_at))) first_at
      FROM orders o WHERE ${eligible}
      UNION ALL
      SELECT MIN(${paymentAt}) first_at FROM payments p JOIN orders o ON o.id=p.order_id
      WHERE ${eligible} AND p.status='SUCCEEDED'
    ) history`,
    [range.source, range.source, range.source, range.source],
  );
  return dashboardRange(
    query,
    now,
    history?.first_at ? calendarDate(new Date(history.first_at)) : undefined,
  );
}
export async function getStoreDashboard(range: DashboardRange) {
  const start = dayStartUtc(range.previousStart),
    end = dayStartUtc(shiftDate(range.end, 1));
  const filter = [range.source, range.source, start, end];
  const [orderHours, paymentHours, topProducts, recentOrders, collectionSales] =
    await withTransaction(async (connection) =>
      Promise.all([
        selectRows<HourRow>(
          `SELECT DATE_FORMAT(${paidAt}, '%Y-%m-%dT%H:00:00Z') hour, COUNT(*) paid_orders,
      SUM(o.total_pence) order_value, SUM(o.subtotal_pence) subtotal, SUM(o.discount_pence) discounts,
      SUM(o.shipping_pence) shipping, SUM(o.tax_pence) tax FROM orders o
      WHERE ${eligible} AND ${paid} AND o.currency='GBP' AND ${paidAt} >= ? AND ${paidAt} < ? GROUP BY hour`,
          filter,
          connection,
        ),
        selectRows<HourRow>(
          `SELECT DATE_FORMAT(${paymentAt}, '%Y-%m-%dT%H:00:00Z') hour,
      SUM(CASE WHEN p.payment_type='CHARGE' THEN p.amount_pence ELSE 0 END) charges,
      SUM(CASE WHEN p.payment_type='REFUND' THEN p.amount_pence ELSE 0 END) refunds
      FROM payments p JOIN orders o ON o.id=p.order_id WHERE ${eligible} AND p.status='SUCCEEDED' AND p.currency='GBP'
      AND ${paymentAt} >= ? AND ${paymentAt} < ? GROUP BY hour`,
          filter,
          connection,
        ),
        selectRows<TopProduct>(
          `SELECT CAST(oi.product_id AS CHAR) product_id, MAX(product.product_type) product_type,
      MAX(COALESCE(NULLIF(TRIM(oi.product_code), ''), NULLIF(TRIM(product.product_code), ''))) product_code,
      MAX(oi.product_name) name, SUM(oi.quantity) units, SUM(oi.line_total_pence) value
      FROM order_items oi JOIN orders o ON o.id=oi.order_id LEFT JOIN products product ON product.id=oi.product_id WHERE ${eligible} AND ${paid} AND o.currency='GBP'
      AND ${paidAt} >= ? AND ${paidAt} < ? AND oi.parent_item_id IS NULL
      GROUP BY oi.product_id, CASE WHEN oi.product_id IS NULL THEN oi.product_name ELSE '' END ORDER BY value DESC, name LIMIT 5`,
          [range.source, range.source, dayStartUtc(range.start), end],
          connection,
        ),
        selectRows<RecentOrder>(
          `SELECT CAST(o.id AS CHAR) id, o.order_number, o.status, o.payment_status, o.total_pence, o.currency, o.placed_at, o.source
      FROM orders o WHERE ${eligible} AND o.placed_at >= ? AND o.placed_at < ? ORDER BY o.placed_at DESC, o.id DESC LIMIT 6`,
          [range.source, range.source, dayStartUtc(range.start), end],
          connection,
        ),
        selectRows<CollectionSales>(
          `SELECT CAST(c.id AS CHAR) collection_id, COALESCE(c.name, 'Unassigned products') name,
       SUM(oi.quantity) units, SUM(oi.line_total_pence) value
       FROM order_items oi JOIN orders o ON o.id=oi.order_id
       LEFT JOIN product_collections pc ON pc.product_id=oi.product_id
       LEFT JOIN collections c ON c.id=pc.collection_id
       WHERE ${eligible} AND ${paid} AND o.currency='GBP'
       AND ${paidAt} >= ? AND ${paidAt} < ? AND oi.parent_item_id IS NULL
       GROUP BY c.id, c.name ORDER BY value DESC, name LIMIT 5`,
          [range.source, range.source, dayStartUtc(range.start), end],
          connection,
        ),
      ]),
    );
  const buckets = new Map<string, StoreDay>();
  for (let i = 0; i < range.days * (range.preset === "all" ? 1 : 2); i++) {
    const date = shiftDate(range.previousStart, i);
    buckets.set(date, emptyStoreDay(date));
  }
  for (const row of orderHours) {
    const day = buckets.get(calendarDate(new Date(row.hour)));
    if (!day) continue;
    day.paidOrders += Number(row.paid_orders);
    day.orderValue += Number(row.order_value);
    day.subtotal += Number(row.subtotal);
    day.discounts += Number(row.discounts);
    day.shipping += Number(row.shipping);
    day.tax += Number(row.tax);
  }
  for (const row of paymentHours) {
    const day = buckets.get(calendarDate(new Date(row.hour)));
    if (!day) continue;
    day.charges += Number(row.charges);
    day.refunds += Number(row.refunds);
    day.netReceipts = day.charges - day.refunds;
  }
  const days = [...buckets.values()].filter((day) => day.date >= range.start);
  const previousDays = [...buckets.values()].filter(
    (day) => day.date < range.start,
  );
  return {
    days,
    previousDays,
    current: storeTotals(days),
    previous: storeTotals(previousDays),
    topProducts,
    recentOrders,
    collectionSales,
    updatedAt: new Date().toISOString(),
  };
}
export async function getDashboardOperations(source: DashboardSource) {
  const awaitingWhere = `${eligible} AND o.payment_status IN ('PAID','PARTIALLY_REFUNDED') AND o.status IN ('NEW','CONFIRMED','PROCESSING','ON_HOLD') AND o.fulfillment_status IN ('UNFULFILLED','PARTIAL')`;
  const stockWhere =
    "p.status='ACTIVE' AND p.product_type='STANDARD' AND p.track_inventory=1 AND v.status='ACTIVE' AND v.stock_on_hand <= v.low_stock_threshold";
  const [orders, stock, lowStock, awaitingOrders] = await withTransaction(
    (connection) =>
      Promise.all([
        selectOne<RowDataPacket>(
          `SELECT COUNT(*) awaiting_fulfilment FROM orders o WHERE ${awaitingWhere}`,
          [source, source],
          connection,
        ),
        selectOne<RowDataPacket>(
          `SELECT COUNT(*) low_stock, COALESCE(SUM(v.stock_on_hand <= 0),0) out_of_stock FROM product_variants v JOIN products p ON p.id=v.product_id WHERE ${stockWhere}`,
          [],
          connection,
        ),
        selectRows<LowStock>(
          `SELECT CAST(v.id AS CHAR) variant_id, CAST(p.id AS CHAR) product_id, NULLIF(TRIM(p.product_code), '') product_code,
       p.name, v.title, v.stock_on_hand, v.low_stock_threshold
       FROM product_variants v JOIN products p ON p.id=v.product_id WHERE ${stockWhere}
       ORDER BY v.stock_on_hand, p.name, v.id LIMIT 100`,
          [],
          connection,
        ),
        selectRows<AwaitingOrder>(
          `SELECT CAST(o.id AS CHAR) id, o.order_number, o.customer_name, o.status, o.fulfillment_status, o.placed_at, o.source
       FROM orders o WHERE ${awaitingWhere} ORDER BY o.placed_at, o.id LIMIT 100`,
          [source, source],
          connection,
        ),
      ]),
  );
  return {
    awaitingFulfilment: Number(orders?.awaiting_fulfilment ?? 0),
    lowStockCount: Number(stock?.low_stock ?? 0),
    outOfStock: Number(stock?.out_of_stock ?? 0),
    lowStock,
    outOfStockItems: lowStock.filter((item) => item.stock_on_hand <= 0),
    awaitingOrders,
  };
}
