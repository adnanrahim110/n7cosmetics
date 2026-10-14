import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import {
  calendarDate,
  dayStartUtc,
  shiftDate,
  type DashboardRange,
} from "./dashboard-dates";
import type { RecentOrder } from "./dashboard";
import { customerInsights, type CustomerInsightRow } from "./dashboard-customer-insights";
import { getMetaSettings } from "../meta/settings";
import { metaMatchingFields, type MetaMatchingKey } from "../meta/matching-coverage";
import { productSalesRows, type SoldProductItem, type ProductReservation } from "./dashboard-product-units";

export function realOrders(alias = "o") {
  return `(${alias}.source='LEGACY' OR EXISTS (SELECT 1 FROM stripe_checkouts sc WHERE sc.order_id=${alias}.id AND sc.stripe_mode='live'))`;
}
const eligible = `(?='ALL' OR o.source=?) AND ${realOrders()}`;
const paid = "o.payment_status IN ('PAID','PARTIALLY_REFUNDED','REFUNDED')";
const paidAt = "COALESCE(o.paid_at,o.placed_at)";
export interface ReportDay {
  date: string;
  values: Record<string, number>;
}
export interface BreakdownRow extends RowDataPacket {
  label: string;
  value: number;
}
interface HourRow extends RowDataPacket {
  hour: string;
  [key: string]: unknown;
}
export function reportDays(range: DashboardRange, keys: string[]) {
  return Array.from(
    { length: range.days * (range.preset === "all" ? 1 : 2) },
    (_, index) => ({
      date: shiftDate(range.previousStart, index),
      values: Object.fromEntries(keys.map((key) => [key, 0])),
    }),
  );
}
function hourlyDays(range: DashboardRange, keys: string[], rows: { hour: string; [key: string]: unknown }[]) {
  const days = reportDays(range, keys),
    map = new Map(days.map((day) => [day.date, day]));
  for (const row of rows) {
    const day = map.get(calendarDate(new Date(row.hour)));
    if (day) for (const key of keys) day.values[key] += Number(row[key] ?? 0);
  }
  const current = days.filter((day) => day.date >= range.start),
    previous = days.filter((day) => day.date < range.start);
  const total = (items: ReportDay[]) =>
    Object.fromEntries(
      keys.map((key) => [
        key,
        items.reduce((sum, day) => sum + day.values[key], 0),
      ]),
    );
  return {
    days: current,
    previousDays: previous,
    current: total(current),
    previous: total(previous),
  };
}
export async function getOrderAnalytics(range: DashboardRange) {
  const from = dayStartUtc(range.start),
    end = dayStartUtc(shiftDate(range.end, 1));
  const currentArgs = [range.source, range.source, from, end];
  const [hours, statuses, payments, recentOrders] = await withTransaction(
    (connection) =>
      Promise.all([
        selectRows<HourRow>(
          `SELECT DATE_FORMAT(o.placed_at,'%Y-%m-%dT%H:00:00Z') hour, COUNT(*) placed,
      SUM(${paid}) paid, SUM(o.payment_status IN ('UNPAID','PENDING','FAILED')) unpaid,
      SUM(o.status='CANCELLED') cancelled FROM orders o WHERE ${eligible} AND o.placed_at>=? AND o.placed_at<? GROUP BY hour`,
          [range.source, range.source, dayStartUtc(range.previousStart), end],
          connection,
        ),
        selectRows<BreakdownRow>(
          `SELECT o.status label, COUNT(*) value FROM orders o WHERE ${eligible} AND o.placed_at>=? AND o.placed_at<? GROUP BY o.status ORDER BY value DESC`,
          currentArgs,
          connection,
        ),
        selectRows<BreakdownRow>(
          `SELECT o.payment_status label, COUNT(*) value FROM orders o WHERE ${eligible} AND o.placed_at>=? AND o.placed_at<? GROUP BY o.payment_status ORDER BY value DESC`,
          currentArgs,
          connection,
        ),
        selectRows<RecentOrder>(
          `SELECT CAST(o.id AS CHAR) id,o.order_number,o.status,o.payment_status,o.total_pence,o.currency,o.placed_at,o.source FROM orders o WHERE ${eligible} AND o.placed_at>=? AND o.placed_at<? ORDER BY o.placed_at DESC,o.id DESC LIMIT 12`,
          currentArgs,
          connection,
        ),
      ]),
  );
  return {
    ...hourlyDays(range, ["placed", "paid", "unpaid", "cancelled"], hours),
    statuses,
    payments,
    recentOrders,
  };
}
export async function getProductAnalytics(range: DashboardRange) {
  interface ItemRow extends RowDataPacket, SoldProductItem {}
  interface ReservationRow extends RowDataPacket, ProductReservation {}
  const args = [
    range.source,
    range.source,
    dayStartUtc(range.previousStart),
    dayStartUtc(shiftDate(range.end, 1)),
  ];
  const [items, reservations] = await withTransaction((connection) =>
    Promise.all([
      selectRows<ItemRow>(
        `SELECT CAST(oi.id AS CHAR) id, CAST(o.id AS CHAR) orderId,
      CAST(oi.parent_item_id AS CHAR) parentId, CAST(oi.variant_id AS CHAR) variantId,
      DATE_FORMAT(${paidAt},'%Y-%m-%dT%H:00:00Z') hour,
      COALESCE(p.product_type,'UNAVAILABLE') productType, oi.quantity,
      oi.line_total_pence itemValue, oi.discount_pence itemDiscounts,
      contents.units componentsPerBundle, contents.untracked_units untrackedPerBundle
      FROM order_items oi JOIN orders o ON o.id=oi.order_id
      LEFT JOIN products p ON p.id=oi.product_id
      LEFT JOIN (
        SELECT bi.bundle_product_id, SUM(bi.quantity) units,
          SUM(CASE WHEN component.track_inventory=0 THEN bi.quantity ELSE 0 END) untracked_units
        FROM bundle_items bi JOIN product_variants v ON v.id=bi.component_variant_id
        JOIN products component ON component.id=v.product_id GROUP BY bi.bundle_product_id
      ) contents ON contents.bundle_product_id=oi.product_id
      WHERE ${eligible} AND ${paid} AND o.currency='GBP' AND ${paidAt}>=? AND ${paidAt}<?`,
        args,
        connection,
      ),
      selectRows<ReservationRow>(
        `SELECT CAST(r.order_id AS CHAR) orderId, CAST(r.variant_id AS CHAR) variantId, r.quantity
      FROM checkout_stock_reservations r JOIN orders o ON o.id=r.order_id
      WHERE ${eligible} AND ${paid} AND o.currency='GBP' AND ${paidAt}>=? AND ${paidAt}<?`,
        args,
        connection,
      ),
    ]),
  );
  const rows = productSalesRows(items, reservations);
  const types = new Map<string, number>();
  for (const row of rows) {
    if (calendarDate(new Date(row.hour)) >= range.start)
      types.set(row.label, (types.get(row.label) ?? 0) + row.units);
  }
  return {
    ...hourlyDays(range, ["units", "itemValue", "itemDiscounts"], rows),
    types: [...types].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
  };
}
interface BuyerHour extends RowDataPacket, CustomerInsightRow {
  first_paid: Date;
  value: string;
  name: string;
  customer_id: string | null;
}
export async function getCustomerAnalytics(range: DashboardRange) {
  const end = dayStartUtc(shiftDate(range.end, 1));
  const rows = await withTransaction((connection) =>
    selectRows<BuyerHour>(
      `WITH history AS (
      SELECT o.*, SHA2(COALESCE(NULLIF(LOWER(TRIM(o.customer_email)),''),CONCAT('customer:',o.customer_id),CONCAT('order:',o.id)),256) buyer,
      ${paidAt} paid_date FROM orders o WHERE ${realOrders()} AND ${paid} AND o.currency='GBP' AND ${paidAt}<?
    ), firsts AS (SELECT buyer,MIN(paid_date) first_paid FROM history GROUP BY buyer)
    SELECT h.buyer, DATE_FORMAT(h.paid_date,'%Y-%m-%dT%H:00:00Z') hour, MAX(f.first_paid) first_paid,
      COUNT(*) orders, SUM(h.total_pence) value, MAX(h.customer_name) name, CAST(MAX(h.customer_id) AS CHAR) customer_id,
      a.country_code,a.city,a.region,a.postal_code
    FROM history h JOIN firsts f ON f.buyer=h.buyer
    LEFT JOIN order_addresses a ON a.order_id=h.id AND a.address_type='SHIPPING'
    WHERE (?='ALL' OR h.source=?) AND h.paid_date>=?
    GROUP BY h.buyer,hour,a.country_code,a.city,a.region,a.postal_code`,
      [end, range.source, range.source, dayStartUtc(range.previousStart)],
      connection,
    ),
  );
  const days = reportDays(range, ["buyers", "newBuyers", "returningBuyers", "orders"]);
  const dailyOrders = new Map(days.map((day) => [day.date, day]));
  const daySets = new Map(
    days.map((day) => [
      day.date,
      {
        buyers: new Set<string>(),
        newBuyers: new Set<string>(),
        returningBuyers: new Set<string>(),
      },
    ]),
  );
  const sets = {
    current: {
      buyers: new Set<string>(),
      newBuyers: new Set<string>(),
      returningBuyers: new Set<string>(),
    },
    previous: {
      buyers: new Set<string>(),
      newBuyers: new Set<string>(),
      returningBuyers: new Set<string>(),
    },
  };
  const orderCounts = { current: 0, previous: 0 };
  const top = new Map<
    string,
    { name: string; id: string | null; orders: number; value: number }
  >();
  for (const row of rows) {
    const date = calendarDate(new Date(row.hour)),
      day = daySets.get(date);
    if (!day) continue;
    const period = date >= range.start ? "current" : "previous";
    orderCounts[period] += Number(row.orders);
    const reportDay = dailyOrders.get(date);
    if (reportDay) reportDay.values.orders += Number(row.orders);
    const returning =
      new Date(row.first_paid) <
      dayStartUtc(period === "current" ? range.start : range.previousStart);
    const key = returning ? "returningBuyers" : "newBuyers";
    day.buyers.add(row.buyer);
    day[key].add(row.buyer);
    sets[period].buyers.add(row.buyer);
    sets[period][key].add(row.buyer);
    if (period === "current") {
      const buyer = top.get(row.buyer) ?? {
        name: row.name,
        id: row.customer_id,
        orders: 0,
        value: 0,
      };
      buyer.orders += Number(row.orders);
      buyer.value += Number(row.value);
      top.set(row.buyer, buyer);
    }
  }
  for (const day of days)
    for (const key of ["buyers", "newBuyers", "returningBuyers"] as const)
      day.values[key] = daySets.get(day.date)![key].size;
  const totals = (period: keyof typeof sets) => ({
    buyers: sets[period].buyers.size,
    newBuyers: sets[period].newBuyers.size,
    returningBuyers: sets[period].returningBuyers.size,
    orders: orderCounts[period],
  });
  return {
    days: days.filter((day) => day.date >= range.start),
    previousDays: days.filter((day) => day.date < range.start),
    current: totals("current"),
    previous: totals("previous"),
    ...customerInsights(range, rows),
    topCustomers: [...top.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10),
  };
}
export async function getTrackingHealth(range: DashboardRange) {
  // The queue retains 30 days only; its records describe event delivery, never visitor sessions.
  const settings = await getMetaSettings();
  const rows = await selectRows<BreakdownRow & { status: string }>(
    `SELECT event_name label,status,COUNT(*) value FROM meta_event_jobs
    WHERE pixel_id=? AND test_event_code='' AND (?='all' OR event_time>=?) AND event_time<? GROUP BY event_name,status`,
    [
      settings.pixelId,
      range.preset,
      dayStartUtc(range.start, range.timeZone),
      dayStartUtc(shiftDate(range.end, 1), range.timeZone),
    ],
  );
  return rows.map((row) => ({
    label: row.label,
    status: row.status,
    value: Number(row.value),
  }));
}

export async function getMetaMatchingReport(range: DashboardRange) {
  const settings = await getMetaSettings();
  type CoverageRow = RowDataPacket & { event_name: string; total: number; known: number } & Record<MetaMatchingKey, number>;
  // Fixed field names come from our schema, never from report/filter input.
  const columns = metaMatchingFields.map(({ key }) => `SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(matching_fields_json, '$.${key}')) = 'true' THEN 1 ELSE 0 END) AS ${key}`).join(",");
  const rows = await selectRows<CoverageRow>(`SELECT event_name, COUNT(*) total, COUNT(matching_fields_json) known, ${columns}
    FROM meta_event_jobs WHERE pixel_id = ? AND test_event_code = '' AND status = 'SENT'
    AND (? = 'all' OR event_time >= ?) AND event_time < ? GROUP BY event_name`,
  [settings.pixelId, range.preset, dayStartUtc(range.start, range.timeZone), dayStartUtc(shiftDate(range.end, 1), range.timeZone)]);
  return rows.map(row => ({ name: row.event_name, total: Number(row.total), known: Number(row.known),
    fields: Object.fromEntries(metaMatchingFields.map(({ key }) => [key, Number(row[key])])) as Record<MetaMatchingKey, number>,
  }));
}
