import Link from "next/link";
import type { getStoreDashboard } from "@/lib/admin/dashboard";
import { dashboardMoney } from "@/lib/admin/dashboard-dates";
import { productNameWithCode } from "@/lib/commerce/product-label";
const panel = "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";
const number = (value: number) => value.toLocaleString("en-GB");
export default function ProductRankings({
  store,
}: {
  store: Awaited<ReturnType<typeof getStoreDashboard>>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className={`min-w-0 ${panel}`}>
        <h2 className="font-body text-base font-semibold">
          Top-selling products
        </h2>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Ranked by discounted item value from paid orders, before refunds.
        </p>
        <div className="mt-4 space-y-4">
          {store.topProducts.map((product, index) => (
            <div key={`${product.product_id}:${product.name}`}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-3">
                  <span className="text-xs tabular-nums text-zinc-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex min-w-0 items-baseline gap-2">
                    {product.product_id ? (
                      <Link
                        href={`/admin/${product.product_type === "BUNDLE" ? "bundles" : "products"}/${product.product_id}`}
                        className="min-w-0 text-sm font-medium hover:text-amber-800"
                      >
                        {productNameWithCode(
                          product.name,
                          product.product_code,
                        )}
                      </Link>
                    ) : (
                      <p className="min-w-0 text-sm font-medium">
                        {productNameWithCode(
                          product.name,
                          product.product_code,
                        )}
                      </p>
                    )}
                    <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">
                      {number(Number(product.units))} units sold
                    </span>
                  </div>
                </div>
                <span className="whitespace-nowrap text-sm font-medium tabular-nums">
                  {dashboardMoney(Number(product.value))}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{
                    width: `${Number(store.topProducts[0]?.value) > 0 ? (Number(product.value) / Number(store.topProducts[0].value)) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {!store.topProducts.length ? (
            <p className="rounded-lg bg-zinc-50 p-5 text-sm text-zinc-500">
              No paid product sales in this period.
            </p>
          ) : null}
        </div>
      </section>
      <section className={`min-w-0 ${panel}`}>
        <h2 className="font-body text-base font-semibold">
          Sales by collection
        </h2>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Top five by discounted item value from paid orders, before refunds.
        </p>
        <div className="mt-4 space-y-4">
          {store.collectionSales.map((collection) => (
            <div key={collection.collection_id ?? "unassigned"}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <p className="min-w-0 break-words text-sm font-medium">
                    {collection.name}
                  </p>
                  <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">
                    {number(Number(collection.units))} units sold
                  </span>
                </div>
                <span className="whitespace-nowrap text-sm font-medium tabular-nums">
                  {dashboardMoney(Number(collection.value))}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-cyan-600"
                  style={{
                    width: `${Number(store.collectionSales[0]?.value) > 0 ? (Number(collection.value) / Number(store.collectionSales[0].value)) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
          {!store.collectionSales.length ? (
            <p className="rounded-lg bg-zinc-50 p-5 text-sm text-zinc-500">
              No paid product sales in this period.
            </p>
          ) : null}
        </div>
        {store.collectionSales.length ? (
          <p className="mt-4 text-xs leading-5 text-zinc-400">
            Uses current collection assignments. Products in multiple
            collections contribute to each, so values should not be added
            together.
          </p>
        ) : null}
      </section>
    </div>
  );
}
