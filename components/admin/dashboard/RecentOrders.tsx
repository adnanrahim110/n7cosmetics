import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import type { RecentOrder } from "@/lib/admin/dashboard";
export default function RecentOrders({
  orders,
  orderLink,
}: {
  orders: RecentOrder[];
  orderLink: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
        <div>
          <h2 className="font-body text-base font-semibold">Recent orders</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Placed within the selected period, including unpaid orders.
          </p>
        </div>
        <Link
          href={orderLink}
          className="shrink-0 text-xs font-medium text-amber-800"
        >
          View all
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-y border-zinc-100 bg-zinc-50 text-xs text-zinc-500">
            <tr>
              {["Order", "Status", "Payment", "Total"].map((label) => (
                <th key={label} className="px-5 py-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-zinc-100 last:border-0"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium hover:text-amber-800"
                  >
                    {order.order_number}
                  </Link>
                  <p className="mt-1 whitespace-nowrap text-xs text-zinc-400">
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeZone: "Europe/London",
                    }).format(new Date(order.placed_at))}
                    {order.source === "LEGACY" ? " · Imported" : ""}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.payment_status} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 tabular-nums">
                  {new Intl.NumberFormat("en-GB", {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.total_pence / 100)}
                </td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                  No orders placed in this period.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
