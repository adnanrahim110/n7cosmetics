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
import { getMetaSettings } from "../meta/settings";
import { metaMatchingFields, type MetaMatchingKey } from "../meta/matching-coverage";

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
function hourlyDays(range: DashboardRange, keys: string[], rows: HourRow[]) {
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
  const args = [
    range.source,
    range.source,
    dayStartUtc(range.start),
    dayStartUtc(shiftDate(range.end, 1)),
  ];
  const [hours, types] = await withTransaction((connection) =>
    Promise.all([
      selectRows<HourRow>(
        `SELECT DATE_FORMAT(${paidAt},'%Y-%m-%dT%H:00:00Z') hour, SUM(oi.quantity) units,
      SUM(oi.line_total_pence) itemValue, SUM(oi.discount_pence) itemDiscounts
      FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE ${eligible} AND ${paid} AND o.currency='GBP'
      AND ${paidAt}>=? AND ${paidAt}<? AND oi.parent_item_id IS NULL GROUP BY hour`,
        [range.source, range.source, dayStartUtc(range.previousStart), args[3]],
        connection,
      ),
      selectRows<BreakdownRow>(
        `SELECT COALESCE(p.product_type,'UNAVAILABLE') label, SUM(oi.quantity) value
      FROM order_items oi JOIN orders o ON o.id=oi.order_id LEFT JOIN products p ON p.id=oi.product_id
      WHERE ${eligible} AND ${paid} AND o.currency='GBP' AND ${paidAt}>=? AND ${paidAt}<? AND oi.parent_item_id IS NULL GROUP BY p.product_type ORDER BY value DESC`,
        args,
        connection,
      ),
    ]),
  );
  return {
    ...hourlyDays(range, ["units", "itemValue", "itemDiscounts"], hours),
    types,
  };
}
interface BuyerHour extends RowDataPacket {
  buyer: string;
  hour: string;
  first_paid: Date;
  orders: number;
  value: string;
  name: string;
  customer_id: string | null;
}
export async function getCustomerAnalytics(range: DashboardRange) {
  const end = dayStartUtc(shiftDate(range.end, 1));
  const [rows, countries] = await withTransaction((connection) =>
    Promise.all([
      selectRows<BuyerHour>(
        `WITH history AS (
      SELECT o.*, SHA2(COALESCE(NULLIF(LOWER(TRIM(o.customer_email)),''),CONCAT('customer:',o.customer_id),CONCAT('order:',o.id)),256) buyer,
      ${paidAt} paid_date FROM orders o WHERE ${realOrders()} AND ${paid} AND o.currency='GBP' AND ${paidAt}<?
    ), firsts AS (SELECT buyer,MIN(paid_date) first_paid FROM history GROUP BY buyer)
    SELECT h.buyer, DATE_FORMAT(h.paid_date,'%Y-%m-%dT%H:00:00Z') hour, MAX(f.first_paid) first_paid,
      COUNT(*) orders, SUM(h.total_pence) value, MAX(h.customer_name) name, CAST(MAX(h.customer_id) AS CHAR) customer_id
    FROM history h JOIN firsts f ON f.buyer=h.buyer WHERE (?='ALL' OR h.source=?) AND h.paid_date>=?
    GROUP BY h.buyer,hour`,
        [end, range.source, range.source, dayStartUtc(range.previousStart)],
        connection,
      ),
      selectRows<BreakdownRow>(
        `SELECT COALESCE(NULLIF(a.country_code,''),'Unknown') label, COUNT(*) value
      FROM orders o LEFT JOIN order_addresses a ON a.order_id=o.id AND a.address_type='SHIPPING'
      WHERE ${eligible} AND ${paid} AND o.currency='GBP' AND ${paidAt}>=? AND ${paidAt}<? GROUP BY label ORDER BY value DESC LIMIT 10`,
        [range.source, range.source, dayStartUtc(range.start), end],
        connection,
      ),
    ]),
  );
  const days = reportDays(range, ["buyers", "newBuyers", "returningBuyers"]);
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
  const top = new Map<
    string,
    { name: string; id: string | null; orders: number; value: number }
  >();
  for (const row of rows) {
    const date = calendarDate(new Date(row.hour)),
      day = daySets.get(date);
    if (!day) continue;
    const period = date >= range.start ? "current" : "previous";
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
  const totals = (period: keyof typeof sets) =>
    Object.fromEntries(
      Object.entries(sets[period]).map(([key, set]) => [key, set.size]),
    );
  return {
    days: days.filter((day) => day.date >= range.start),
    previousDays: days.filter((day) => day.date < range.start),
    current: totals("current"),
    previous: totals("previous"),
    countries,
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
