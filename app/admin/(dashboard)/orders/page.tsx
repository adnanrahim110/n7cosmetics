import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import { Eye, Search } from "lucide-react";
import AdminThumbnail from "@/components/admin/AdminThumbnail";
import CustomSelect from "@/components/admin/CustomSelect";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { selectOne, selectRows } from "@/lib/db/query";

interface OrderRow extends RowDataPacket {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  total_pence: number;
  currency: string;
  item_count: number;
  image_url: string | null;
  placed_at: Date;
}

interface OrderCountRow extends RowDataPacket {
  total_count: number | string;
}

interface OrdersPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

const statuses = ["ALL", "NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
const pageSize = 25;

function money(pence: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const query = await searchParams;
  const q = query.q?.trim().slice(0, 100) ?? "";
  const status = statuses.includes(query.status as (typeof statuses)[number]) ? query.status! : "ALL";
  const term = `%${q}%`;
  const count = await selectOne<OrderCountRow>(
    `SELECT COUNT(*) AS total_count
     FROM orders o
     WHERE (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)
       AND (? = 'ALL' OR o.status = ?)`,
    [term, term, term, status, status],
  );
  const totalItems = Number(count?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(parsePage(query.page), totalPages);
  const offset = (page - 1) * pageSize;
  const orders = await selectRows<OrderRow>(
    `SELECT
       CAST(o.id AS CHAR) AS id,
       o.order_number,
       o.status,
       o.payment_status,
       o.customer_name,
       o.customer_email,
       o.total_pence,
       o.currency,
       o.placed_at,
       COALESCE(SUM(oi.quantity), 0) AS item_count,
       (SELECT first_item.image_url FROM order_items first_item WHERE first_item.order_id = o.id ORDER BY first_item.id LIMIT 1) AS image_url
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)
       AND (? = 'ALL' OR o.status = ?)
     GROUP BY o.id
     ORDER BY o.placed_at DESC
     LIMIT ? OFFSET ?`,
    [term, term, term, status, status, pageSize, offset],
  );

  return (
    <div>
      <PageHeader eyebrow="Sales" title="Orders" description="Review customers, payment state, and fulfilment progress." />
      <form className="mt-7 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_190px_auto]">
        <label className="flex items-center rounded-lg border border-zinc-300 px-3 focus-within:border-amber-700 focus-within:ring-2 focus-within:ring-amber-100">
          <Search className="text-zinc-400" size={16} />
          <input aria-label="Search orders" className="w-full px-2 py-2 text-sm outline-none" defaultValue={q} name="q" placeholder="Order, customer, email" />
        </label>
        <CustomSelect defaultValue={status} name="status" options={statuses.map((value) => ({ value, label: value === "ALL" ? "All statuses" : value.toLowerCase() }))} searchable={false} />
        <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">Filter</button>
      </form>

      <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AdminThumbnail alt={order.order_number} size="sm" src={order.image_url} />
                      <div>
                        <Link className="font-medium hover:text-amber-700" href={`/admin/orders/${order.id}`}>{order.order_number}</Link>
                        <p className="mt-0.5 text-xs text-zinc-400">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.placed_at))}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p>{order.customer_name}</p><p className="text-xs text-zinc-400">{order.customer_email}</p></td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={order.payment_status} /></td>
                  <td className="px-4 py-3 text-zinc-600">{order.item_count}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(order.total_pence, order.currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link aria-label={`View order ${order.order_number}`} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50" href={`/admin/orders/${order.id}`}><Eye size={14} />View</Link>
                  </td>
                </tr>
              ))}
              {!orders.length ? <tr><td className="px-4 py-12 text-center text-zinc-500" colSpan={7}>No orders found.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} pathname="/admin/orders" query={{ q, status: status === "ALL" ? undefined : status }} totalItems={totalItems} />
      </div>
    </div>
  );
}
