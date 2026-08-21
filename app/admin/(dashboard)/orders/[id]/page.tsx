import Link from "next/link";
import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { ArrowLeft } from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { isDatabaseId } from "@/lib/admin/form";
import { selectOne, selectRows } from "@/lib/db/query";
import { updateOrderAction } from "../actions";

interface Order extends RowDataPacket { id: string; order_number: string; status: string; payment_status: string; fulfillment_status: string; currency: string; customer_email: string; customer_name: string; customer_phone: string | null; subtotal_pence: number; discount_pence: number; shipping_pence: number; tax_pence: number; total_pence: number; coupon_code: string | null; customer_notes: string | null; admin_notes: string | null; payment_provider: string | null; payment_reference: string | null; placed_at: Date }
interface Item extends RowDataPacket { id: string; product_name: string; variant_title: string; sku: string; unit_price_pence: number; quantity: number; discount_pence: number; line_total_pence: number }
interface Address extends RowDataPacket { address_type: string; full_name: string; company: string | null; line_1: string; line_2: string | null; city: string; region: string | null; postal_code: string; country_code: string; phone: string | null }
interface History extends RowDataPacket { id: string; status: string; note: string | null; created_at: Date; administrator_name: string | null }
function money(value: number, currency: string) { return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value / 100); }
const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const orderStatuses = ["NEW", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((value) => ({ value, label: value.toLowerCase() }));
const paymentStatuses = ["UNPAID", "PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"].map((value) => ({ value, label: value.toLowerCase().replaceAll("_", " ") }));
const fulfillmentStatuses = ["UNFULFILLED", "PARTIAL", "FULFILLED", "RETURNED"].map((value) => ({ value, label: value.toLowerCase() }));

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  if (!isDatabaseId(id)) notFound();
  const [order, items, addresses, history, query] = await Promise.all([
    selectOne<Order>("SELECT CAST(id AS CHAR) AS id, orders.* FROM orders WHERE id = ? LIMIT 1", [id]),
    selectRows<Item>("SELECT CAST(id AS CHAR) AS id, product_name, variant_title, sku, unit_price_pence, quantity, discount_pence, line_total_pence FROM order_items WHERE order_id = ? ORDER BY id", [id]),
    selectRows<Address>("SELECT address_type, full_name, company, line_1, line_2, city, region, postal_code, country_code, phone FROM order_addresses WHERE order_id = ? ORDER BY address_type DESC", [id]),
    selectRows<History>(`SELECT CAST(h.id AS CHAR) AS id, h.status, h.note, h.created_at, a.name AS administrator_name FROM order_status_history h LEFT JOIN administrators a ON a.id = h.administrator_id WHERE h.order_id = ? ORDER BY h.created_at DESC`, [id]),
    searchParams,
  ]);
  if (!order) notFound();

  return <div>
    <Link className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-950" href="/admin/orders"><ArrowLeft size={15} />Back to orders</Link>
    <PageHeader eyebrow="Order" title={order.order_number} description={`Placed ${new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short" }).format(new Date(order.placed_at))}`} actions={<><StatusBadge status={order.status} /><StatusBadge status={order.payment_status} /></>} />
    {query.saved ? <Notice type="success">Order saved.</Notice> : null}{query.error ? <Notice>Check the order values.</Notice> : null}
    <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="rounded-xl border border-zinc-200 bg-white shadow-sm"><h2 className="border-b border-zinc-100 px-5 py-4 font-body text-base font-semibold text-zinc-950">Items</h2><div className="divide-y divide-zinc-100">{items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4"><div><p className="font-medium">{item.product_name}</p><p className="mt-1 text-xs text-zinc-400">{item.variant_title} · {item.sku} · {item.quantity} × {money(item.unit_price_pence, order.currency)}</p></div><p className="font-medium">{money(item.line_total_pence, order.currency)}</p></div>)}</div><dl className="ml-auto grid max-w-sm grid-cols-2 gap-y-2 border-t border-zinc-100 px-5 py-4 text-sm"><dt className="text-zinc-500">Subtotal</dt><dd className="text-right">{money(order.subtotal_pence, order.currency)}</dd><dt className="text-zinc-500">Discount</dt><dd className="text-right">−{money(order.discount_pence, order.currency)}</dd><dt className="text-zinc-500">Delivery</dt><dd className="text-right">{money(order.shipping_pence, order.currency)}</dd><dt className="text-zinc-500">Tax</dt><dd className="text-right">{money(order.tax_pence, order.currency)}</dd><dt className="font-semibold">Total</dt><dd className="text-right font-semibold">{money(order.total_pence, order.currency)}</dd></dl></section>
        <section className="grid gap-5 md:grid-cols-2">{addresses.map((address) => <article key={address.address_type} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="font-body text-base font-semibold text-zinc-950">{address.address_type.toLowerCase()} address</h2><address className="mt-3 whitespace-pre-line text-sm not-italic leading-6 text-zinc-600">{[address.full_name, address.company, address.line_1, address.line_2, address.city, address.region, address.postal_code, address.country_code, address.phone].filter(Boolean).join("\n")}</address></article>)}</section>
      </div>
      <aside className="space-y-5">
        <form action={updateOrderAction.bind(null, id)} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="font-body text-base font-semibold text-zinc-950">Update order</h2><CustomSelect className="mt-4" defaultValue={order.status} label="Order status" name="status" options={orderStatuses} required searchable={false} /><CustomSelect className="mt-4" defaultValue={order.payment_status} label="Payment" name="paymentStatus" options={paymentStatuses} required searchable={false} /><CustomSelect className="mt-4" defaultValue={order.fulfillment_status} label="Fulfilment" name="fulfillmentStatus" options={fulfillmentStatuses} required searchable={false} /><label className="mt-4 block text-sm font-medium text-zinc-700">Internal notes<textarea className={input} defaultValue={order.admin_notes ?? ""} maxLength={10000} name="adminNotes" rows={4} /></label><label className="mt-4 block text-sm font-medium text-zinc-700">Status update note<input className={input} maxLength={500} name="historyNote" /></label><button className="mt-5 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Save order</button></form>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="font-body text-base font-semibold text-zinc-950">Customer</h2><p className="mt-3 text-sm font-medium">{order.customer_name}</p><a className="mt-1 block text-sm text-amber-700" href={`mailto:${order.customer_email}`}>{order.customer_email}</a>{order.customer_phone ? <a className="mt-1 block text-sm text-zinc-600" href={`tel:${order.customer_phone}`}>{order.customer_phone}</a> : null}{order.customer_notes ? <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">{order.customer_notes}</p> : null}</section>
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="font-body text-base font-semibold text-zinc-950">History</h2><ol className="mt-4 space-y-4">{history.map((event) => <li key={event.id} className="border-l-2 border-zinc-200 pl-3"><p className="text-sm font-medium">{event.status.toLowerCase()}</p><p className="text-xs text-zinc-400">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}{event.administrator_name ? ` · ${event.administrator_name}` : ""}</p>{event.note ? <p className="mt-1 text-sm text-zinc-600">{event.note}</p> : null}</li>)}</ol></section>
      </aside>
    </div>
  </div>;
}
