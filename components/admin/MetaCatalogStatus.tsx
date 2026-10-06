"use client";
import type { MetaCatalogSummary } from "@/lib/meta/catalog-status";
import { useMetaAdminStatus } from "@/lib/meta/use-admin-status";
import { cn } from "@/lib/cn";
import MetaCatalogMetricCard, { type MetaCatalogMetricProps } from "./MetaCatalogMetricCard";

function time(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value)) + " UK time" : "Not yet";
}
export default function MetaCatalogStatus({ initial }: { initial: MetaCatalogSummary }) {
  const { summary, error } = useMetaAdminStatus("/admin/api/meta-catalog", initial);
  const metrics = [
    { label: "Eligible website items", value: summary.eligible, tone: "neutral" },
    { label: "Confirmed synced", value: summary.counts.SYNCED ?? 0, tone: "success" },
    { label: "Queued / processing", value: (summary.counts.QUEUED ?? 0) + (summary.counts.PROCESSING ?? 0) + (summary.counts.SUBMITTED ?? 0), tone: "processing" },
    { label: "Failed items", value: summary.counts.FAILED ?? 0, tone: "error" },
  ] satisfies MetaCatalogMetricProps[];
  return <div className="space-y-4 border-t border-zinc-200 pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-body text-base font-semibold text-zinc-950">Catalogue sync status</h3>
      <span className={cn("rounded-full px-3 py-1 text-xs font-medium", !summary.ready ? "bg-zinc-100 text-zinc-700" : summary.accessVerified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>{!summary.enabled ? "Paused" : !summary.ready ? "Awaiting credentials" : summary.accessVerified ? "Connected · read access checked" : "Awaiting connection check"}</span>
    </div>
    {summary.name ? <p className="text-sm text-zinc-700">{summary.name} · {summary.catalogId}</p> : null}
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{metrics.map(metric => <MetaCatalogMetricCard key={metric.label} {...metric} />)}</div>
    <dl className="grid gap-3 text-xs text-zinc-600 sm:grid-cols-2"><div><dt className="font-medium text-zinc-800">Last website scan</dt><dd className="mt-1">{time(summary.lastScan)}</dd></div><div><dt className="font-medium text-zinc-800">Last batch confirmed by Meta</dt><dd className="mt-1">{time(summary.lastSuccess)}</dd></div></dl>
    <p className="text-xs leading-5 text-zinc-500">Checks for website changes every 30 seconds while the Meta worker is running. Meta processes batches asynchronously; confirmed sync does not guarantee ad approval. {summary.excluded} website items need catalogue details.</p>
    {summary.ready && !summary.workerRecent ? <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">The Meta worker has no recent heartbeat. Keep it running for automatic updates and retries.</p> : null}
    {summary.error || error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{summary.error || "Unable to refresh catalogue status. The last available results are shown."}</p> : null}
    {summary.issues.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="mb-3 text-left text-sm font-semibold text-zinc-800">Items needing attention · up to 8 recent issues</caption><thead className="border-b border-zinc-200 text-xs text-zinc-500"><tr><th scope="col" className="p-3 font-medium">Product</th><th scope="col" className="p-3 font-medium">Details</th></tr></thead><tbody>{summary.issues.map(issue => <tr key={issue.id} className="border-b border-zinc-100"><td className="p-3 align-top"><span className="font-medium text-zinc-900">{issue.name}</span><span className="mt-1 block text-xs text-zinc-500">{issue.id}</span></td><td className="min-w-64 p-3 align-top text-xs leading-5 text-zinc-600">{issue.message}</td></tr>)}</tbody></table></div> : <p className="text-sm text-zinc-500">No catalogue item issues recorded.</p>}
  </div>;
}
