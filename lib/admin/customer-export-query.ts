import type { CustomerExportOptions } from "./customer-export-options";
import type { SqlValue } from "../db/query";

// Every SQL identifier comes from this allowlist; all user values are parameters.
const sortColumns = { created_at: "c.created_at", full_name: "c.full_name", email: "c.email", order_count: "order_count", spent_pence: "spent_pence", last_order_at: "last_order_at" };
const dateColumns = { created_at: "c.created_at", registered_at: "c.registered_at", last_order_at: "last_order_at" };
export const customerExportSelect = `SELECT CAST(c.id AS CHAR) id,c.full_name,c.email,c.phone,c.country_code,
  c.source,c.import_id,c.created_at,c.registered_at,c.admin_notes,
  COALESCE(stats.order_count,0) order_count,stats.last_order_at,COALESCE(totals.spent_pence,0) spent_pence
  FROM customers c
  LEFT JOIN (SELECT customer_id,COUNT(*) order_count,MAX(placed_at) last_order_at FROM orders GROUP BY customer_id) stats ON stats.customer_id=c.id
  LEFT JOIN (SELECT o.customer_id,SUM(CASE WHEN p.payment_type='REFUND' THEN -p.amount_pence ELSE p.amount_pence END) spent_pence
    FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.status='SUCCEEDED' AND p.currency='GBP' GROUP BY o.customer_id) totals ON totals.customer_id=c.id`;

export function customerExportQuery(options: CustomerExportOptions, count = false) {
  const conditions: string[] = [];
  const values: SqlValue[] = [];
  if (options.q) { conditions.push("(LOCATE(?,c.full_name)>0 OR LOCATE(?,COALESCE(c.email,''))>0 OR LOCATE(?,COALESCE(c.phone,''))>0)"); values.push(options.q, options.q.toLowerCase(), options.q); }
  if (options.source !== "ALL") { conditions.push("c.source=?"); values.push(options.source); }
  const dateColumn = dateColumns[options.dateField];
  if (options.from) { conditions.push(`${dateColumn}>=?`); values.push(options.from); }
  // Half-open upper bound includes the entire selected final day, including milliseconds.
  if (options.to) { conditions.push(`${dateColumn}<DATE_ADD(?,INTERVAL 1 DAY)`); values.push(options.to); }
  if (options.orders !== "all") conditions.push(`COALESCE(stats.order_count,0)${options.orders === "with" ? ">0" : "=0"}`);
  for (const [key, column, operator, multiplier] of [
    ["minOrders", "COALESCE(stats.order_count,0)", ">=", 1], ["maxOrders", "COALESCE(stats.order_count,0)", "<=", 1],
    ["minSpend", "COALESCE(totals.spent_pence,0)", ">=", 100], ["maxSpend", "COALESCE(totals.spent_pence,0)", "<=", 100],
  ] as const) if (options[key] !== "") { conditions.push(`${column}${operator}?`); values.push(Math.round(Number(options[key]) * multiplier)); }
  const sql = `${customerExportSelect}${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""}`;
  return { sql: count ? `SELECT COUNT(*) total FROM (${sql}) matched` : `${sql} ORDER BY ${sortColumns[options.sort]} ${options.direction === "asc" ? "ASC" : "DESC"},c.id ASC`, values };
}
