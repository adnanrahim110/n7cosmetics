import type { CustomerAreaRow } from "@/lib/admin/dashboard-customer-insights";
const count = new Intl.NumberFormat("en-GB");

export default function CustomerBreakdownTable({
  title,
  labelHeading,
  rows,
}: {
  title: string;
  labelHeading: string;
  rows: readonly CustomerAreaRow[];
}) {
  return (
    <div
      role="region"
      aria-label={title}
      tabIndex={0}
      className="mt-4 max-w-full overflow-x-auto rounded-lg border border-zinc-200 outline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-700"
    >
      <table className="w-full min-w-80 text-left text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="bg-zinc-50 text-xs text-zinc-600">
          <tr>
            <th scope="col" className="px-3 py-3 font-medium">{labelHeading}</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Customers</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Paid orders</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.label} className="h-12 hover:bg-zinc-50">
              <th scope="row" className="break-words px-3 py-3 font-medium text-zinc-900">
                {row.label}
              </th>
              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-zinc-700">{count.format(row.customers)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-zinc-900">{count.format(row.orders)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
