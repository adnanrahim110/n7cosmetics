import Link from "next/link";
import {
  getStoreDashboard,
  getDashboardOperations,
} from "@/lib/admin/dashboard";
import {
  getCustomerAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  type ReportDay,
} from "@/lib/admin/dashboard-reports";
import {
  dashboardMoney,
  type DashboardRange,
} from "@/lib/admin/dashboard-dates";
import type { ValueFormat } from "@/lib/admin/dashboard-display";
import MetricCard from "./MetricCard";
import TimeSeriesPanel, { type ChartSeries } from "./TimeSeriesPanel";
import BreakdownChart from "./BreakdownChart";
import ProductRankings from "./ProductRankings";
import RecentOrders from "./RecentOrders";
import OperationsPanel from "./OperationsPanel";

type Definition = {
  key: string;
  label: string;
  color: string;
  note: string;
  format?: ValueFormat;
  direction?: "up" | "down" | "neutral";
};
const panel = "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";
function seriesFor(
  days: ReportDay[],
  previous: ReportDay[],
  definitions: Definition[],
): ChartSeries[] {
  return definitions.map((item) => ({
    ...item,
    points: days.map((day) => ({
      date: day.date,
      value: day.values[item.key] ?? null,
    })),
    previous: previous.map((day) => ({
      date: day.date,
      value: day.values[item.key] ?? null,
    })),
  }));
}
function ReportMetrics({
  definitions,
  data,
  range,
}: {
  range: DashboardRange;
  definitions: Definition[];
  data: {
    current: Record<string, number>;
    previous: Record<string, number>;
    days: ReportDay[];
    previousDays: ReportDay[];
  };
}) {
  const series = seriesFor(data.days, data.previousDays, definitions);
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 ${definitions.length === 2 ? "" : definitions.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
    >
      {definitions.map(({ key, ...item }, index) => (
        <MetricCard
          comparison={range.preset !== "all"}
          key={key}
          {...item}
          current={data.current[key] ?? null}
          previous={data.previous[key] ?? null}
          points={series[index].points}
          previousPoints={series[index].previous}
        />
      ))}
    </div>
  );
}
function StoreNote() {
  return (
    <p className="text-xs leading-5 text-zinc-500">
      Real website and imported orders only; Stripe test orders are excluded.
      Store dates use Europe/London. Financial reports use GBP, and today is
      incomplete when included.
    </p>
  );
}
export async function SalesView({ range }: { range: DashboardRange }) {
  const data = await getStoreDashboard(range);
  const definitions: Definition[] = [
    {
      key: "netReceipts",
      label: "Net receipts",
      color: "#059669",
      format: "pence",
      note: "Successful payments less refunds; fees and costs are not deducted.",
    },
    {
      key: "orderValue",
      label: "Paid order value",
      color: "#2563eb",
      format: "pence",
      note: "After discounts, including delivery and tax; before refunds.",
    },
    {
      key: "averageOrder",
      label: "Average paid order",
      color: "#7c3aed",
      format: "pence",
      note: "Paid order value divided by paid orders; period average is weighted.",
    },
    {
      key: "refunds",
      label: "Refunds recorded",
      color: "#e11d48",
      format: "pence",
      direction: "down",
      note: "Refunds processed in this period, including earlier orders.",
    },
    {
      key: "discounts",
      label: "Discounts applied",
      color: "#ea580c",
      format: "pence",
      direction: "neutral",
      note: "Order discounts for orders paid in this period.",
    },
    {
      key: "shipping",
      label: "Delivery collected",
      color: "#0891b2",
      format: "pence",
      direction: "neutral",
      note: "Delivery charged on paid orders, before any refunds.",
    },
  ];
  const convert = (days: typeof data.days): ReportDay[] =>
    days.map(({ date, ...values }) => ({
      date,
      values: {
        ...values,
        averageOrder: values.paidOrders
          ? values.orderValue / values.paidOrders
          : NaN,
      },
    }));
  const days = convert(data.days),
    previousDays = convert(data.previousDays);
  const series = seriesFor(days, previousDays, definitions).map((item) => ({
    ...item,
    points: item.points.map((p) => ({
      ...p,
      value: p.value !== null && Number.isFinite(p.value) ? p.value : null,
    })),
    previous: item.previous?.map((p) => ({
      ...p,
      value: p.value !== null && Number.isFinite(p.value) ? p.value : null,
    })),
  }));
  return (
    <div className="space-y-5">
      <StoreNote />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {definitions.map(({ key, ...item }, index) => (
          <MetricCard
            comparison={range.preset !== "all"}
            key={key}
            {...item}
            current={
              key === "averageOrder" && !data.current.paidOrders
                ? null
                : (data.current[key as keyof typeof data.current] as number)
            }
            previous={
              key === "averageOrder" && !data.previous.paidOrders
                ? null
                : (data.previous[key as keyof typeof data.previous] as number)
            }
            points={series[index].points}
            previousPoints={series[index].previous}
          />
        ))}
      </div>
      <TimeSeriesPanel
        title="Sales over time"
        description={
          range.preset === "all"
            ? "Daily values across all recorded history."
            : "Inspect daily values or compare with the preceding equal-length period."
        }
        series={series}
      />
      <details className={`${panel} text-xs leading-6 text-zinc-500`}>
        <summary className="cursor-pointer font-medium text-zinc-700">
          How sales are calculated
        </summary>
        <p className="mt-3">
          Sales follow the original payment date; historical imports fall back
          to placement date when payment date is missing. Partially and fully
          refunded orders remain in their original sale period. Refunds follow
          their own processing date. Net receipts are cash movement, not profit,
          and may be negative.
        </p>
      </details>
    </div>
  );
}
export async function OrdersView({ range }: { range: DashboardRange }) {
  const data = await getOrderAnalytics(range);
  const definitions: Definition[] = [
    {
      key: "placed",
      label: "Orders placed",
      color: "#2563eb",
      note: "All currencies, grouped by placement date.",
    },
    {
      key: "paid",
      label: "Paid orders",
      color: "#059669",
      note: "Placed in period; includes orders later refunded.",
    },
    {
      key: "unpaid",
      label: "Unpaid orders",
      color: "#ea580c",
      direction: "down",
      note: "Currently unpaid, pending or failed payment.",
    },
    {
      key: "cancelled",
      label: "Cancelled orders",
      color: "#e11d48",
      direction: "down",
      note: "Currently cancelled, grouped by placement date.",
    },
  ];
  const labels = (rows: typeof data.statuses) =>
    rows.map((row) => ({
      label: row.label.toLowerCase().replaceAll("_", " "),
      value: Number(row.value),
      color: ["FAILED", "CANCELLED", "REFUNDED"].includes(row.label)
        ? "#e11d48"
        : ["PAID", "DELIVERED", "COMPLETED"].includes(row.label)
          ? "#059669"
          : undefined,
    }));
  return (
    <div className="space-y-5">
      <StoreNote />
      <ReportMetrics range={range} data={data} definitions={definitions} />
      <TimeSeriesPanel
        title="Order activity"
        description="Current order states for the orders placed on each day; not a history of status changes."
        series={seriesFor(data.days, data.previousDays, definitions)}
      />
      <div className="grid gap-5 xl:grid-cols-2">
        <BreakdownChart
          title="Order status"
          description="Current status of orders placed in the selected period."
          rows={labels(data.statuses)}
          donut
        />
        <BreakdownChart
          title="Payment status"
          description="One payment status per order in the same placement cohort."
          rows={labels(data.payments)}
        />
      </div>
      <RecentOrders
        orders={data.recentOrders}
        orderLink={`/admin/orders?source=${range.source}`}
      />
    </div>
  );
}
export async function ProductsView({ range }: { range: DashboardRange }) {
  const [store, data] = await Promise.all([
    getStoreDashboard(range),
    getProductAnalytics(range),
  ]);
  const definitions: Definition[] = [
    {
      key: "units",
      label: "Units sold",
      color: "#7c3aed",
      note: "Paid order quantities; bundle components are not counted twice.",
    },
    {
      key: "itemValue",
      label: "Product sales",
      color: "#059669",
      format: "pence",
      note: "Discounted item value, excluding delivery and order-level tax; before refunds.",
    },
  ];
  return (
    <div className="space-y-5">
      <StoreNote />
      <ReportMetrics range={range} definitions={definitions} data={data} />
      <ProductRankings store={store} />
      <div className="grid gap-5 xl:grid-cols-2">
        <TimeSeriesPanel
          title="Product demand"
          description={
            range.preset === "all"
              ? "Daily paid quantities and product sales across all recorded history."
              : "Daily paid quantities and product sales; current versus previous period."
          }
          series={seriesFor(data.days, data.previousDays, definitions)}
        />
        <BreakdownChart
          title="Units by product type"
          description="Current product classification. Unavailable products retain their recorded sales."
          rows={data.types.map((row) => ({
            label:
              row.label === "STANDARD"
                ? "Individual products"
                : row.label === "BUNDLE"
                  ? "Bundles"
                  : "Product unavailable",
            value: Number(row.value),
          }))}
          donut
        />
      </div>
    </div>
  );
}
export async function CustomersView({ range }: { range: DashboardRange }) {
  const data = await getCustomerAnalytics(range);
  const definitions: Definition[] = [
    {
      key: "buyers",
      label: "Purchasing customers",
      color: "#0891b2",
      note: "Distinct buyers with a paid GBP order in the period.",
    },
    {
      key: "newBuyers",
      label: "New buyers",
      color: "#2563eb",
      note: "Their first recorded paid GBP order falls in this period.",
    },
    {
      key: "returningBuyers",
      label: "Returning buyers",
      color: "#7c3aed",
      note: "Their first paid GBP order predates this period.",
    },
  ];
  const share = (values: Record<string, number>) =>
    values.buyers ? (values.returningBuyers / values.buyers) * 100 : null;
  const countryName = (code: string) => {
    try {
      return /^[A-Z]{2}$/.test(code)
        ? (new Intl.DisplayNames(["en-GB"], { type: "region" }).of(code) ??
            code)
        : code;
    } catch {
      return code;
    }
  };
  return (
    <div className="space-y-5">
      <StoreNote />
      <ReportMetrics range={range} definitions={definitions} data={data} />
      <div className="grid gap-5 xl:grid-cols-2">
        <TimeSeriesPanel
          title="Customer activity"
          description="Daily unique buyers. A buyer can appear on multiple days; daily counts are not summed for the period total."
          series={seriesFor(data.days, data.previousDays, definitions)}
        />
        <div className="space-y-5">
          <MetricCard
            comparison={range.preset !== "all"}
            label="Returning buyer share"
            current={share(data.current)}
            previous={share(data.previous)}
            format="percent"
            color="#7c3aed"
            note="Returning buyers divided by distinct purchasing customers."
            points={data.days.map((day) => ({
              date: day.date,
              value: share(day.values),
            }))}
            previousPoints={data.previousDays.map((day) => ({
              date: day.date,
              value: share(day.values),
            }))}
          />
          <BreakdownChart
            title="Buyer mix"
            description="Each buyer belongs to one cohort for the selected period."
            donut
            rows={[
              {
                label: "New buyers",
                value: data.current.newBuyers,
                color: "#2563eb",
              },
              {
                label: "Returning buyers",
                value: data.current.returningBuyers,
                color: "#7c3aed",
              },
            ]}
          />
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <BreakdownChart
          title="Shipping destinations"
          description="Top ten countries by paid GBP orders; based on order shipping addresses."
          rows={data.countries.map((row) => ({
            label: countryName(row.label),
            value: Number(row.value),
          }))}
        />
        <section className={panel}>
          <h2 className="font-body text-base font-semibold">Top customers</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            By paid GBP order value before refunds, within this period.
          </p>
          <ul className="mt-3 divide-y divide-zinc-100">
            {data.topCustomers.map((buyer, index) => (
              <li
                key={index}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  {buyer.id ? (
                    <Link
                      href={`/admin/customers/${buyer.id}`}
                      className="break-words text-sm font-medium hover:text-amber-800"
                    >
                      {buyer.name}
                    </Link>
                  ) : (
                    <p className="break-words text-sm font-medium">
                      {buyer.name}
                    </p>
                  )}
                  <p className="text-xs text-zinc-400">
                    {buyer.orders} paid orders
                  </p>
                </div>
                <span className="whitespace-nowrap text-sm font-medium">
                  {dashboardMoney(buyer.value)}
                </span>
              </li>
            ))}
          </ul>
          {!data.topCustomers.length ? (
            <p className="py-6 text-sm text-zinc-500">
              No paid purchases in this period.
            </p>
          ) : null}
        </section>
      </div>
      <p className="text-xs leading-5 text-zinc-500">
        Buyers are matched by normalized order email, falling back to customer
        ID. First-purchase history includes both real website orders and
        imports; incomplete historical data can affect cohort classification.
      </p>
    </div>
  );
}
export async function OperationsView({
  range,
  canManage,
}: {
  range: DashboardRange;
  canManage: boolean;
}) {
  const operations = await getDashboardOperations(range.source);
  return (
    <OperationsPanel
      operations={operations}
      canManage={canManage}
      orderLink={`/admin/orders?source=${range.source}`}
    />
  );
}
