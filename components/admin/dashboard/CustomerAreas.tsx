"use client";

import { useState } from "react";
import type { CustomerAreaBreakdown, CustomerAreaKind } from "@/lib/admin/dashboard-customer-insights";
import { cn } from "@/lib/cn";
import CustomerBreakdownTable from "./CustomerBreakdownTable";

const groups: { key: CustomerAreaKind; label: string; missing: string }[] = [
  { key: "cities", label: "City / town", missing: "city / town" },
  { key: "counties", label: "County / region", missing: "county / region" },
  { key: "postcodes", label: "Postcode area", missing: "valid postcode" },
];
const rankings = [
  { key: "byCustomers", label: "Customers" },
  { key: "byOrders", label: "Orders" },
] as const;
const button = "min-h-11 min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 motion-reduce:transition-none";

export default function CustomerAreas({ areas }: { areas: Record<CustomerAreaKind, CustomerAreaBreakdown> }) {
  const [group, setGroup] = useState(groups[0]);
  const [ranking, setRanking] = useState<"byCustomers" | "byOrders">("byCustomers");
  const data = areas[group.key];
  const rows = data[ranking];
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-body text-base font-semibold text-zinc-950">Top UK areas</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-600">Top ten areas from paid GBP orders in the selected period, using recorded UK shipping addresses.</p>
      <div role="group" aria-label="Group areas by" className="mt-4 flex flex-wrap gap-2">
        {groups.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={group.key === item.key}
            onClick={() => setGroup(item)}
            className={cn(button, group.key === item.key ? "border-amber-700 bg-amber-50 text-amber-950" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100")}
          >{item.label}</button>
        ))}
      </div>
      <div role="group" aria-label="Rank areas by" className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs text-zinc-600">Rank by</span>
        {rankings.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-pressed={ranking === item.key}
            onClick={() => setRanking(item.key)}
            className={cn(button, ranking === item.key ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100")}
          >{item.label}</button>
        ))}
      </div>
      <div aria-live="polite" aria-atomic="true">
        <p className="sr-only">{group.label}, ranked by {ranking === "byCustomers" ? "customers" : "orders"}. {rows.length} areas shown.</p>
      </div>
      {rows.length ? (
        <CustomerBreakdownTable title={`Top UK areas by ${group.label}`} labelHeading={group.label} rows={rows} />
      ) : <p className="py-8 text-sm text-zinc-600">No recorded UK {group.label.toLowerCase()} data in this period. Try another area grouping or date range.</p>}
      {data.missing.orders ? (
        <p className="mt-3 text-xs leading-5 text-zinc-600">Missing {group.missing} or UK address: {data.missing.customers.toLocaleString("en-GB")} customers · {data.missing.orders.toLocaleString("en-GB")} paid orders.</p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-zinc-600">Customers count once per area and may appear in multiple areas. Counties are shown as entered; postcode areas use the first letters, for example SW or M.</p>
    </section>
  );
}
