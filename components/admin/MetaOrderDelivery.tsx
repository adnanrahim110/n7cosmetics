import Link from "next/link";
import { getMetaOrderDelivery } from "@/lib/meta/diagnostics";

export default async function MetaOrderDelivery({ orderId }: { orderId: string }) {
  const delivery = await getMetaOrderDelivery(orderId);
  if (!delivery) return null;
  const date = (value: Date | null) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(value) + " UTC" : "—";
  return <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><h2 className="font-body text-base font-semibold text-zinc-950">Meta Purchase</h2><span className={`rounded-full px-3 py-1 text-xs font-medium ${delivery.status === "Sent" ? "bg-emerald-50 text-emerald-800" : delivery.status === "Failed" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>{delivery.status}</span></div>
    <p className="mt-3 text-sm leading-6 text-zinc-600">{delivery.reason}</p>
    <dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><dt className="text-zinc-500">Checkout recorded</dt><dd>{date(delivery.capturedAt)}</dd><dt className="text-zinc-500">Queued</dt><dd>{date(delivery.queuedAt)}</dd><dt className="text-zinc-500">Last attempt</dt><dd>{date(delivery.lastAttemptAt)}</dd><dt className="text-zinc-500">Accepted by Meta</dt><dd>{date(delivery.sentAt)}</dd><dt className="text-zinc-500">Attempts</dt><dd>{delivery.attempts}</dd></dl>
    <Link href="/admin/meta" className="mt-4 inline-block text-xs text-amber-800 underline">Integration health and settings</Link>
  </section>;
}
