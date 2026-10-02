export const dashboardTabs = [
  { id: "sales", label: "Sales" },
  { id: "orders", label: "Orders" },
  { id: "products", label: "Products" },
  { id: "customers", label: "Customers" },
  { id: "traffic", label: "Traffic" },
  { id: "meta", label: "Meta ads" },
  { id: "operations", label: "Operations" },
] as const;
export type DashboardTab = (typeof dashboardTabs)[number]["id"];
export function visibleDashboardTabs(
  canManage: boolean,
  canViewMetaAds: boolean,
) {
  return dashboardTabs.filter(
    (tab) =>
      (canManage || tab.id === "operations") &&
      (canViewMetaAds || tab.id !== "meta"),
  );
}
export function dashboardTab(
  value: unknown,
  canManage: boolean,
  canViewMetaAds: boolean,
): DashboardTab {
  return visibleDashboardTabs(canManage, canViewMetaAds).find(
    (tab) => tab.id === value,
  )?.id ?? (canManage ? "sales" : "operations");
}
export const chartColors = [
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#64748b",
];
export type ValueFormat = "number" | "money" | "pence" | "percent" | "ratio";
export type TrendPoint = { date: string; value: number | null };
export function metricValue(
  value: number | null,
  format: ValueFormat = "number",
  currency = "GBP",
): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (format === "pence" || format === "money")
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(value / (format === "pence" ? 100 : 1));
  return (
    new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: format === "ratio" || format === "percent" ? 2 : 1,
    }).format(value) +
    (format === "ratio" ? "×" : format === "percent" ? "%" : "")
  );
}
