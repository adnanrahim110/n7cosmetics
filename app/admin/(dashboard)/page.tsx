import type { RowDataPacket } from "mysql2/promise";
import { AlertTriangle, Boxes, ClipboardList, PackageSearch, PoundSterling } from "lucide-react";
import { selectOne } from "@/lib/db/query";
import CustomSelect from "@/components/admin/CustomSelect";

interface DashboardMetrics extends RowDataPacket {
  active_products: number;
  open_orders: number;
  low_stock_variants: number;
  active_collections: number;
  revenue_pence: string;
}

async function getDashboardMetrics(source: string): Promise<DashboardMetrics> {
  const metrics = await selectOne<DashboardMetrics>(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE status = 'ACTIVE') AS active_products,
       (SELECT COUNT(*) FROM orders WHERE status IN ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'ON_HOLD') AND (?='ALL' OR source=?)) AS open_orders,
       (SELECT COUNT(*) FROM product_variants WHERE status = 'ACTIVE' AND stock_on_hand <= low_stock_threshold) AS low_stock_variants,
       (SELECT COUNT(*) FROM collections WHERE status = 'ACTIVE') AS active_collections,
       (SELECT COALESCE(SUM(CASE WHEN payment_type='REFUND' THEN -amount_pence ELSE amount_pence END), 0) FROM payments WHERE status='SUCCEEDED' AND currency='GBP' AND (?='ALL' OR source=?)) AS revenue_pence`,
    [source, source, source, source],
  );

  if (!metrics) throw new Error("Unable to load dashboard metrics");
  return metrics;
}

function formatCurrency(pence: string | number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(pence) / 100);
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const query = await searchParams;
  const source = query.source === "ALL" || query.source === "LEGACY" ? query.source : "LIVE";
  const metrics = await getDashboardMetrics(source);
  const cards = [
    { label: "Active products", value: metrics.active_products, icon: PackageSearch },
    { label: "Open orders", value: metrics.open_orders, icon: ClipboardList },
    { label: "Low stock", value: metrics.low_stock_variants, icon: AlertTriangle },
    { label: "Collections", value: metrics.active_collections, icon: Boxes },
    { label: "Net receipts (GBP)", value: formatCurrency(metrics.revenue_pence), icon: PoundSterling },
  ];

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-amber-700">Store overview</p>
        <h1 className="mt-1 font-body text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">A quick view of products, orders, inventory, and revenue.</p>
      </div>
      <form className="mt-5 flex flex-wrap items-center gap-3">
        <CustomSelect name="source" defaultValue={source} options={[{ value: "LIVE", label: "New website orders" }, { value: "LEGACY", label: "Historical orders" }, { value: "ALL", label: "All orders" }]} />
        <button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white">Apply</button>
        <p className="text-xs text-zinc-500">Order and receipt totals follow this filter. Receipts include recorded refunds.</p>
      </form>
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">{label}</p>
              <span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><Icon size={16} /></span>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
