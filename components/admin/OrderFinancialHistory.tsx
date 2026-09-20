import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "@/lib/db/query";
import LegacyBadge from "./LegacyBadge";

interface Payment extends RowDataPacket { id: string; payment_type: string; provider: string; provider_reference: string | null; status: string; amount_pence: number; source: string; created_at: Date; fee_pence: number | null; net_pence: number | null }
interface Refund extends RowDataPacket { id: string; reason: string | null; amount_pence: number; created_at: Date; legacy_id: string | null; provider_reference: string | null }
interface RefundItem extends RowDataPacket { id: string; refund_id: string; name: string; quantity: string; amount_pence: number; tax_pence: number }
interface Adjustment extends RowDataPacket { id: string; adjustment_type: string; name: string; amount_pence: number; tax_pence: number }
export default async function OrderFinancialHistory({ orderId, currency }: { orderId: string; currency: string }) {
  const [payments, refunds, items, adjustments] = await Promise.all([
    selectRows<Payment>("SELECT * FROM payments WHERE order_id=? ORDER BY created_at,id", [orderId]),
    selectRows<Refund>("SELECT * FROM order_refunds WHERE order_id=? ORDER BY created_at,id", [orderId]),
    selectRows<RefundItem>("SELECT i.* FROM order_refund_items i JOIN order_refunds r ON r.id=i.refund_id WHERE r.order_id=? ORDER BY i.id", [orderId]),
    selectRows<Adjustment>("SELECT * FROM order_adjustments WHERE order_id=? ORDER BY id", [orderId]),
  ]);
  const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value / 100);
  return <>
    <section className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Payments & refunds</h2><div className="mt-4 space-y-4">{payments.map(payment => <article key={payment.id} className="border-t border-zinc-100 pt-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><p>{payment.payment_type} · {payment.provider} · {payment.status}</p><strong>{money(payment.amount_pence)}</strong></div><p className="mt-1 break-all text-xs text-zinc-500">{payment.provider_reference || "No transaction reference"} · {new Date(payment.created_at).toLocaleString("en-GB")}</p>{payment.fee_pence !== null ? <p className="mt-1 text-xs text-zinc-500">Fee {money(payment.fee_pence)}{payment.net_pence !== null ? ` · Net ${money(payment.net_pence)}` : ""}</p> : null}<div className="mt-2"><LegacyBadge source={payment.source} /></div></article>)}</div>
      {refunds.map(refund => <article key={refund.id} className="mt-4 rounded-lg bg-zinc-50 p-4"><h3 className="text-sm font-semibold">Refund {refund.legacy_id ? `#${refund.legacy_id}` : ""} · {money(refund.amount_pence)}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{refund.reason || "No reason recorded"}</p><ul className="mt-2 space-y-1 text-xs text-zinc-500">{items.filter(item => String(item.refund_id) === String(refund.id)).map(item => <li key={item.id}>{item.name} · quantity {item.quantity} · {money(item.amount_pence)}{item.tax_pence ? ` · tax ${money(item.tax_pence)}` : ""}</li>)}</ul></article>)}
    </section>
    {adjustments.length ? <section className="rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Original shipping & discount lines</h2><ul className="mt-3 space-y-2 text-sm">{adjustments.map(line => <li className="flex justify-between gap-3" key={line.id}><span>{line.name} <span className="text-xs text-zinc-500">({line.adjustment_type})</span></span><span>{money(line.amount_pence)}{line.tax_pence ? ` + ${money(line.tax_pence)} tax` : ""}</span></li>)}</ul></section> : null}
  </>;
}
