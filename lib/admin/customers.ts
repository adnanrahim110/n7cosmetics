import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";

export interface CustomerRow extends RowDataPacket {
  id: string; email: string | null; full_name: string; phone: string | null; country_code: string | null;
  source: "LIVE" | "LEGACY"; import_id: string | null; created_at: Date; registered_at: Date | null;
  admin_notes: string | null; order_count: number; last_order_at: Date | null; spent_pence: number;
}
export const customerSearch = (value?: string) => value?.trim().slice(0, 100) ?? "";
export const customerOrigin = (value?: string) => value === "LIVE" || value === "LEGACY" ? value : "ALL";
const where = "(?='' OR LOCATE(?,c.full_name)>0 OR LOCATE(?,COALESCE(c.email,''))>0 OR LOCATE(?,COALESCE(c.phone,''))>0) AND (?='ALL' OR c.source=?)";
const values = (q: string, source: string) => [q, q, q.toLowerCase(), q, source, source];
const columns = `c.*,CAST(c.id AS CHAR) id,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id) order_count,
  (SELECT MAX(o.placed_at) FROM orders o WHERE o.customer_id=c.id) last_order_at,
  (SELECT COALESCE(SUM(CASE WHEN p.payment_type='REFUND' THEN -p.amount_pence ELSE p.amount_pence END),0)
   FROM payments p JOIN orders o ON o.id=p.order_id WHERE o.customer_id=c.id AND p.status='SUCCEEDED' AND p.currency='GBP') spent_pence`;
export async function countCustomers(q: string, source: string) {
  const row = await selectOne<RowDataPacket & { total: number }>(`SELECT COUNT(*) total FROM customers c WHERE ${where}`, values(q, source));
  return Number(row?.total ?? 0);
}
export async function getCustomers(q: string, source: string, limit: number, offset: number) {
  return selectRows<CustomerRow>(`SELECT ${columns} FROM customers c WHERE ${where} ORDER BY c.created_at DESC,c.id DESC LIMIT ? OFFSET ?`, [...values(q, source), limit, offset]);
}
export async function getCustomer(id: string) { return selectOne<CustomerRow>(`SELECT ${columns} FROM customers c WHERE c.id=?`, [id]); }
export async function* exportCustomers(q: string, source: string) {
  const maximum = await selectOne<RowDataPacket & { id: string | null }>("SELECT CAST(MAX(id) AS CHAR) id FROM customers");
  if (!maximum?.id) return;
  let after = "0";
  while (true) {
    const rows = await selectRows<CustomerRow>(`SELECT ${columns} FROM customers c WHERE ${where} AND c.id>? AND c.id<=? ORDER BY c.id LIMIT 500`, [...values(q, source), after, maximum.id]);
    if (!rows.length) return;
    for (const row of rows) yield row;
    after = rows[rows.length - 1].id;
  }
}
