"use client";
import { useEffect, useState } from "react";
import type { TikTokDeliveryStatus as DeliveryStatus } from "@/lib/tiktok/diagnostics";
import { cn } from "@/lib/cn";
import TikTokDeliveryRetry from "./TikTokDeliveryRetry";
const date = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC";
export default function TikTokDeliveryStatus({ initial, canEdit }: { initial: DeliveryStatus; canEdit: boolean }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let fetching = false;
    const load = async () => {
      if (fetching) return;
      fetching = true; setBusy(true);
      try {
        const response = await fetch("/admin/api/tiktok-delivery", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("unavailable");
        const next: DeliveryStatus = await response.json();
        if (!controller.signal.aborted) { setValue(next); setError(""); }
      } catch { if (!controller.signal.aborted) setError("Unable to refresh delivery status. Try again."); }
      finally { fetching = false; if (!controller.signal.aborted) setBusy(false); }
    };
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => { controller.abort(); clearTimeout(first); clearInterval(timer); };
  }, [refresh]);
  const healthy = value.workerRunning;
  return <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6" aria-labelledby="tiktok-delivery-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 id="tiktok-delivery-title" className="font-body text-lg font-semibold text-zinc-950">Event delivery</h2><button type="button" disabled={busy} onClick={() => setRefresh(current => current + 1)} className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-amber-700 disabled:opacity-50">{busy ? "Refreshing…" : "Refresh status"}</button></div>
    <p role="status" className={cn("mt-4 text-sm leading-6", healthy ? "text-emerald-800" : "text-amber-900")}>{healthy ? "Worker is running." : "Worker has no recent successful heartbeat. Check the TikTok worker service."}{value.worker ? ` Last check: ${date(value.worker.checkedAt)}.` : ""}</p>
    {error ? <p role="alert" className="mt-4 text-sm text-red-800">{error}</p> : null}
    {!value.jobs.length ? <p className="mt-4 text-sm leading-6 text-zinc-600">No server events recorded yet. Events appear here after marketing consent and Events API configuration.</p> : <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Recent TikTok server events"><table className="w-full text-left text-sm"><thead><tr className="border-b border-zinc-200 text-zinc-600"><th scope="col" className="p-3">Event</th><th scope="col" className="p-3">Status</th><th scope="col" className="p-3">Attempts</th><th scope="col" className="p-3">Time</th><th scope="col" className="p-3">Details</th></tr></thead><tbody>{value.jobs.map(job => <tr key={job.id} className="border-b border-zinc-100 align-top text-zinc-800"><td className="p-3">{job.name}{job.test ? " (test)" : ""}</td><td className="p-3">{job.status === "SENT" ? "Accepted by TikTok" : job.status}</td><td className="p-3">{job.attempts}</td><td className="whitespace-nowrap p-3">{date(job.sentAt ?? job.createdAt)}</td><td className="min-w-64 p-3 wrap-anywhere">{job.error || (job.requestId ? `Request: ${job.requestId}` : "—")}</td></tr>)}</tbody></table></div>}
    <p className="mt-4 text-xs leading-5 text-zinc-600">Accepted means TikTok returned a successful API response. Confirm attribution, deduplication and event matching in Events Manager.</p>
    {canEdit ? <TikTokDeliveryRetry /> : null}
  </section>;
}
