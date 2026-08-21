import type { RowDataPacket } from "mysql2/promise";
import { AlertTriangle, Boxes, ClipboardList, PackageSearch, PoundSterling } from "lucide-react";
import { selectOne } from "@/lib/db/query";

interface DashboardMetrics extends RowDataPacket {
  active_products: number;
  open_orders: number;
  low_stock_variants: number;
  active_collections: number;
  revenue_pence: string;
}

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const metrics = await selectOne<DashboardMetrics>(
    `SELECT
       (SELECT COUNT(*) FROM products WHERE status = 'ACTIVE') AS active_products,
       (SELECT COUNT(*) FROM orders WHERE status IN ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED')) AS open_orders,
       (SELECT COUNT(*) FROM product_variants WHERE status = 'ACTIVE' AND stock_on_hand <= low_stock_threshold) AS low_stock_variants,
       (SELECT COUNT(*) FROM collections WHERE status = 'ACTIVE') AS active_collections,
       (SELECT COALESCE(SUM(total_pence), 0) FROM orders WHERE payment_status = 'PAID') AS revenue_pence`,
  );

  if (!metrics) throw new Error("Unable to load dashboard metrics");
  return metrics;
}

function formatCurrency(pence: string | number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(pence) / 100);
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();
  const cards = [
    { label: "Active products", value: metrics.active_products, icon: PackageSearch },
    { label: "Open orders", value: metrics.open_orders, icon: ClipboardList },
    { label: "Low stock", value: metrics.low_stock_variants, icon: AlertTriangle },
    { label: "Collections", value: metrics.active_collections, icon: Boxes },
    { label: "Paid revenue", value: formatCurrency(metrics.revenue_pence), icon: PoundSterling },
  ];

  return (
    <div>
      <div>
        <p className="text-sm font-medium text-amber-700">Store overview</p>
        <h1 className="mt-1 font-body text-2xl font-semibold tracking-tight text-zinc-950">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">A quick view of products, orders, inventory, and revenue.</p>
      </div>
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
