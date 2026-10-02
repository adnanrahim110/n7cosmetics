import PageHeader from "@/components/admin/PageHeader";
import DashboardControls from "@/components/admin/dashboard/DashboardControls";
import DashboardTabs from "@/components/admin/dashboard/DashboardTabs";
import MetaOverview from "@/components/admin/dashboard/MetaOverview";
import {
  CustomersView,
  OperationsView,
  OrdersView,
  ProductsView,
  SalesView,
} from "@/components/admin/dashboard/StoreViews";
import {
  dashboardRange,
  type DashboardQuery,
  type DashboardRange,
} from "@/lib/admin/dashboard-dates";
import { dashboardTab, type DashboardTab } from "@/lib/admin/dashboard-display";
import { getDashboardRange } from "@/lib/admin/dashboard";
import { getMetaDashboardRange } from "@/lib/meta/insights";
import { requireAdministrator } from "@/lib/auth/session";
import { canAccessMetaAds } from "@/lib/auth/permissions";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
async function DashboardContent({
  tab,
  range,
  canManage,
}: {
  tab: DashboardTab;
  range: DashboardRange;
  canManage: boolean;
}) {
  try {
    if (tab === "operations" || !canManage)
      return await OperationsView({ range, canManage });
    if (tab === "sales") return await SalesView({ range });
    if (tab === "orders") return await OrdersView({ range });
    if (tab === "products") return await ProductsView({ range });
    if (tab === "customers") return await CustomersView({ range });
    return await MetaOverview({ range, mode: tab });
  } catch {
    console.error("Dashboard section could not be loaded.");
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5"
      >
        <h2 className="font-semibold">
          This report is temporarily unavailable
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Use Refresh to try again, or switch to another tab. Unavailable
          figures are not shown as zero.
        </p>
      </div>
    );
  }
}
export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardQuery>;
}) {
  const admin = await requireAdministrator();
  const query = await searchParams;
  const canManage = admin.role !== "FULFILLMENT";
  const canViewMetaAds = canAccessMetaAds(admin);
  const tab = dashboardTab(query.tab, canManage, canViewMetaAds);
  let range = dashboardRange(query);
  if (tab === "meta" || tab === "traffic") range = await getMetaDashboardRange(query);
  let historyUnavailable = false;
  if (
    range.preset === "all" &&
    !["meta", "traffic", "operations"].includes(tab)
  ) {
    try {
      range = await getDashboardRange(query);
    } catch {
      historyUnavailable = true;
      range.warning =
        "All-time history could not be loaded. Refresh to try again.";
    }
  }
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Store intelligence"
        title="Dashboard"
        description="Explore sales, customers and advertising, with every report in one place."
        actions={
          <Link
            href={`/admin/orders?source=${range.source}`}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium"
          >
            View orders <ArrowUpRight size={16} />
          </Link>
        }
      />
      <DashboardTabs
        active={tab}
        range={range}
        canManage={canManage}
        canViewMetaAds={canViewMetaAds}
      />
      <DashboardControls
        range={range}
        tab={tab}
        updatedAt={new Date().toISOString()}
      />
      <div
        role="tabpanel"
        id="dashboard-panel"
        aria-labelledby={`dashboard-tab-${tab}`}
        tabIndex={0}
        className="outline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-700"
      >
        <Suspense
          key={`${tab}:${range.preset}:${range.start}:${range.end}:${range.source}`}
          fallback={
            <div
              role="status"
              className="rounded-xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500"
            >
              Loading report…
            </div>
          }
        >
          {historyUnavailable ? null : (
            <DashboardContent tab={tab} range={range} canManage={canManage} />
          )}
        </Suspense>
      </div>
    </div>
  );
}
