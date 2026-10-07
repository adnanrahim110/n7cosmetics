import type { CatalogRemoteSummary } from "@/lib/meta/catalog-remote-status";
import { formatMetaAdminTime } from "@/lib/meta/admin-time";
import MetaCatalogMetricCard, { type MetaCatalogMetricProps } from "./MetaCatalogMetricCard";
import MetaCatalogRemoteProducts from "./MetaCatalogRemoteProducts";

export default function MetaCatalogRemoteStatus({ status, enabled, ready }: { status: CatalogRemoteSummary; enabled: boolean; ready: boolean }) {
  const metrics = [
    { label: "Images ready", value: status.imagesReady, tone: "success" },
    { label: "Images pending / unchecked", value: status.imagesPending, tone: "processing" },
    { label: "Image issues", value: status.imageFailures, tone: "error" },
    { label: "Fresh Meta checks", value: status.checked, tone: "neutral" },
    { label: "Eligible for catalogue ads", value: status.adsEligible, tone: "success" },
    { label: "Ad issues / rejected", value: status.adsBlocked, tone: "error" },
    { label: "Awaiting ad confirmation", value: status.adsPending, tone: "processing" },
    { label: "Ad eligibility not reported", value: status.adsUnknown, tone: "neutral" },
  ] satisfies MetaCatalogMetricProps[];
  return <section aria-labelledby="meta-remote-status-title" className="space-y-4 border-t border-zinc-200 pt-4">
    <header className="space-y-2"><h3 id="meta-remote-status-title" className="font-body text-base font-semibold text-zinc-950">Meta images &amp; ad eligibility</h3><p className="text-xs leading-5 text-zinc-500">Product data delivery, image processing and ad approval are separate checks. Eligibility requires Meta’s explicit ad approval, a current ready image and no blocking product issues. An empty or “no review” response is shown as not reported.</p></header>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{metrics.map(metric => <MetaCatalogMetricCard key={metric.label} {...metric} />)}</div>
    <p className="text-xs leading-5 text-zinc-500">Last successful Meta status check: <span className="font-medium text-zinc-700">{formatMetaAdminTime(status.lastChecked)}</span> · Checks and page results refresh every 30 seconds while enabled. {status.checked} of {status.total} website items have fresh checks.</p>
    {!enabled ? <p role="status" className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">Catalogue status checks are paused with this connection.</p> : !ready ? <p role="status" className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">Save the catalogue ID and token to start Meta status checks.</p> : status.total > status.checked && !status.error ? <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-950">{status.total - status.checked} items await a current Meta check. Results older than two minutes, changed products and changed credentials are not counted as eligible.</p> : null}
    {status.error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">Meta status check failed: {status.error} Previous check times are retained; unavailable results are not treated as approval.</p> : null}
    <MetaCatalogRemoteProducts items={status.items} />
  </section>;
}
