"use client";
import type { MetaDeliveryHealthSummary } from "@/lib/meta/delivery-health";
import { useMetaAdminStatus } from "@/lib/meta/use-admin-status";
import MetaDeliveryMetric from "./MetaDeliveryMetric";

const states = { running: "Running", overdue: "Heartbeat overdue", missing: "No heartbeat recorded", error: "Needs attention" };
function time(value: string | null): string {
  return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value)) + " UK time" : "—";
}
export default function MetaDeliveryStatus({ initial }: { initial: MetaDeliveryHealthSummary }) {
  const { summary, error } = useMetaAdminStatus("/admin/api/meta-delivery", initial);
  return <section aria-labelledby="meta-delivery-health-title" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 id="meta-delivery-health-title" className="font-body text-base font-semibold text-zinc-950">Delivery health</h2>
    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
      <MetaDeliveryMetric label="Background worker" value={states[summary.worker.state]} detail={`Last seen: ${time(summary.worker.seenAt)}`} healthy={summary.worker.state === "running"} />
      <MetaDeliveryMetric label="Waiting / retained failures" value={`${summary.waiting} / ${summary.failed}`} detail="Retained server jobs from the last 30 days" />
      <MetaDeliveryMetric label="Latest live acceptance" value={time(summary.acceptedAt)} detail="Refreshes every 30 seconds" />
    </dl>
    {summary.worker.state !== "running" ? <p role="status" className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-950">{summary.worker.error || (summary.local ? "The local Meta worker is starting with the development server. If the heartbeat remains overdue, restart pnpm dev or run pnpm meta:worker." : "Check that the Meta background worker is running with the current application release.")}</p> : null}
    {summary.credentialError || error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{summary.credentialError || "Unable to refresh delivery health. The last available results are shown."}</p> : null}
    {summary.activeIssues.map(issue => <p role="alert" key={issue.id} className="mt-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">{issue.name}: {issue.message}<span className="mt-1 block text-xs">Last attempt: {time(issue.attemptedAt)} · {issue.status === "FAILED" ? "failed; review credentials and event details" : "awaiting retry"}</span></p>)}
    {summary.history.length ? <details className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700"><summary className="flex min-h-11 cursor-pointer items-center font-medium text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Past failed deliveries · {summary.historyTotal}</summary><p className="mt-2 text-xs leading-5 text-zinc-600">Up to 3 previous unsuccessful attempts are shown here, separately from current worker health. Their erased event payloads cannot be replayed. Current token encryption is checked separately above.</p><ul className="mt-3 space-y-3">{summary.history.map(issue => <li key={issue.id}><p>{issue.name}: {issue.message}</p><p className="mt-1 text-xs text-zinc-500">Last attempt: {time(issue.attemptedAt)}</p></li>)}</ul></details> : null}
  </section>;
}
