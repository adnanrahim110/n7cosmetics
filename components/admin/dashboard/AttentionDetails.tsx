import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import type { AwaitingOrder, LowStock } from "@/lib/admin/dashboard";
import { productNameWithCode } from "@/lib/commerce/product-label";

export function AwaitingOrderDetails({
  orders,
  total,
  orderLink,
}: {
  orders: AwaitingOrder[];
  total: number;
  orderLink: string;
}) {
  return (
    <>
      <p className="text-xs leading-5 text-zinc-500">
        Oldest orders first.
        {orders.length < total
          ? ` Showing ${orders.length} of ${total.toLocaleString("en-GB")}.`
          : ""}
      </p>
      <ul className="mt-2 divide-y divide-zinc-100">
        {orders.map((order) => (
          <li key={order.id} className="space-y-1 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`/admin/orders/${order.id}`}
                className="text-sm font-medium hover:text-amber-800"
              >
                {order.order_number}
              </Link>
              <StatusBadge status={order.status} />
            </div>
            <p className="break-words text-xs leading-4 text-zinc-500">
              {order.customer_name} ·{" "}
              {new Intl.DateTimeFormat("en-GB", {
                dateStyle: "medium",
                timeZone: "Europe/London",
              }).format(new Date(order.placed_at))}
              {order.source === "LEGACY" ? " · Imported" : ""}
              {order.fulfillment_status === "PARTIAL"
                ? " · Partly fulfilled"
                : ""}
            </p>
          </li>
        ))}
      </ul>
      {!orders.length ? (
        <p className="py-3 text-sm text-zinc-500">
          No paid orders are awaiting fulfilment.
        </p>
      ) : null}
      <Link
        href={orderLink}
        className="mt-3 inline-block text-xs font-medium text-amber-800"
      >
        Browse orders
      </Link>
    </>
  );
}

export function StockAttentionDetails({
  items,
  total,
  canManage,
  outOfStock = false,
}: {
  items: LowStock[];
  total: number;
  canManage: boolean;
  outOfStock?: boolean;
}) {
  return (
    <>
      <p className="text-xs leading-5 text-zinc-500">
        {outOfStock
          ? "Variants with no stock available."
          : "At or below the stock threshold, including out-of-stock variants."}
        {items.length < total
          ? ` Showing ${items.length} of ${total.toLocaleString("en-GB")}, lowest stock first.`
          : ""}
      </p>
      <ul className="mt-2 divide-y divide-zinc-100">
        {items.map((item) => (
          <li key={item.variant_id} className="py-2">
            <div className="flex items-baseline justify-between gap-2">
              {canManage ? (
                <Link
                  href={`/admin/products/${item.product_id}`}
                  className="min-w-0 break-words text-sm font-medium hover:text-amber-800"
                >
                  {productNameWithCode(item.name, item.product_code)}
                </Link>
              ) : (
                <p className="min-w-0 break-words text-sm font-medium">
                  {productNameWithCode(item.name, item.product_code)}
                </p>
              )}
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${item.stock_on_hand <= 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
              >
                {item.stock_on_hand <= 0
                  ? "Out of stock"
                  : `${item.stock_on_hand} left`}
              </span>
            </div>
            <p className="mt-0.5 break-words text-xs leading-4 text-zinc-400">
              {item.title} · Threshold {item.low_stock_threshold}
            </p>
          </li>
        ))}
      </ul>
      {!items.length ? (
        <p className="py-3 text-sm text-zinc-500">
          {outOfStock
            ? "No tracked variants are out of stock."
            : "No tracked variants are at or below their stock threshold."}
        </p>
      ) : null}
      {canManage ? (
        <Link
          href="/admin/products"
          className="mt-3 inline-block text-xs font-medium text-amber-800"
        >
          Browse products
        </Link>
      ) : null}
    </>
  );
}
