import type { TimingHour } from "@/lib/admin/dashboard-timing";

export function hourWindow(hour: number): string {
  const label = (value: number) => `${value % 12 || 12}:00 ${value < 12 ? "AM" : "PM"}`;
  return `${label(hour)}–${label((hour + 1) % 24)}`;
}
const average = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 4 });

export default function TimingHourTable({ title, metric, rows }: { title: string; metric: string; rows: TimingHour[] }) {
  return (
    <div role="region" aria-label={title} tabIndex={0} className="mt-4 max-w-full overflow-x-auto rounded-lg border border-zinc-200 outline-offset-4 focus-visible:outline-2 focus-visible:outline-amber-700">
      <table className="w-full min-w-80 text-left text-sm">
        <caption className="sr-only">{title}</caption>
        <thead className="bg-zinc-50 text-xs text-zinc-600">
          <tr>
            <th scope="col" className="px-3 py-3 font-medium">Hour</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">{metric}</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Average / hour</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Hours sampled</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.hour} className="h-12 hover:bg-zinc-50">
              <th scope="row" className="whitespace-nowrap px-3 py-3 font-medium text-zinc-900">{hourWindow(row.hour)}</th>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.total.toLocaleString("en-GB")}</td>
              <td className="px-3 py-3 text-right font-medium tabular-nums text-zinc-900">{row.average === null ? "—" : average.format(row.average)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-zinc-700">{row.samples.toLocaleString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
