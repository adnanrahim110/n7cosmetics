import { getMetaMatchingReport } from "@/lib/admin/dashboard-reports";
import type { DashboardRange } from "@/lib/admin/dashboard-dates";
import { metaMatchingFields } from "@/lib/meta/matching-coverage";

export default async function MetaMatchingCoverage({ range }: { range: DashboardRange }) {
  const report = await getMetaMatchingReport(range).catch(() => null);
  const groups = ["ViewContent", "Purchase", "All events"].map(name => {
    const rows = report?.filter(row => name === "All events" || row.name === name) ?? [];
    return { name, total: rows.reduce((sum, row) => sum + row.total, 0), known: rows.reduce((sum, row) => sum + row.known, 0), rows };
  });
  return <section className="rounded-2xl border border-zinc-200 bg-white p-5">
    <h2 className="text-sm font-semibold text-zinc-900">Matching parameters sent</h2>
    <p className="mt-2 text-xs leading-5 text-zinc-500">
      {range.preset === "all" ? `All retained events through ${range.end}` : `${range.start} to ${range.end}`} · {range.timeZone ?? "Europe/London"}. Accepted live server events only; records are retained for 30 days. Coverage shows which fields were sent, not Meta’s match-quality score or ad attribution. Email and phone are available after a consenting checkout; ad click IDs require a real ad click.
    </p>
    {report ? <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs">
      <thead className="border-b border-zinc-200 text-zinc-500"><tr><th className="py-3 font-medium">Parameter</th>{groups.map(group => <th key={group.name} className="px-3 py-3 font-medium">{group.name}<span className="mt-1 block font-normal">{group.known} measured / {group.total} accepted</span></th>)}</tr></thead>
      <tbody>{metaMatchingFields.map(field => <tr key={field.key} className="border-b border-zinc-100 last:border-0"><th className="py-3 font-medium text-zinc-700">{field.label}</th>{groups.map(group => {
        const count = group.rows.reduce((sum, row) => sum + row.fields[field.key], 0);
        return <td key={group.name} className="px-3 py-3 tabular-nums text-zinc-600">{group.known ? `${Math.round(count / group.known * 100)}% (${count}/${group.known})` : "—"}</td>;
      })}</tr>)}</tbody>
    </table><p className="mt-3 text-xs text-zinc-500">Older events without coverage records are excluded from percentages. New coverage starts with this update.</p></div> : <p role="status" className="mt-4 text-sm text-zinc-500">Matching-parameter coverage is unavailable.</p>}
  </section>;
}
