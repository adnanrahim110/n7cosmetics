import { selectOne, selectRows } from "@/lib/db/query";
import type { RowDataPacket } from "mysql2/promise";

export default async function MetaDeliveryHealth() {
  const [worker, totals, failure, accepted] = await Promise.all([
    selectOne<RowDataPacket>("SELECT checked_at, last_success_at, last_error, checked_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE) AS fresh FROM meta_worker_health WHERE id = 1"),
    selectOne<RowDataPacket>("SELECT SUM(status IN ('PENDING','PROCESSING')) AS waiting, SUM(status = 'FAILED') AS failed FROM meta_event_jobs"),
    selectRows<RowDataPacket>("SELECT event_name, last_error, last_attempt_at FROM meta_event_jobs WHERE last_error IS NOT NULL AND status IN ('PENDING','FAILED') ORDER BY id DESC LIMIT 3"),
    selectOne<RowDataPacket>("SELECT sent_at FROM meta_event_jobs WHERE status = 'SENT' AND test_event_code = '' ORDER BY sent_at DESC LIMIT 1"),
  ]);
  const fresh = Boolean(worker?.fresh);
  const workerState = !worker ? "No heartbeat recorded" : !fresh ? "Heartbeat overdue" : worker.last_error ? "Needs attention" : "Running";
  const date = (value: unknown) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(String(value))) + " UTC" : "—";
  return <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="font-body text-base font-semibold text-zinc-950">Delivery health</h2>
    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
      <div><dt className="text-zinc-500">Background worker</dt><dd className={`mt-1 font-medium ${fresh && !worker?.last_error ? "text-emerald-800" : "text-amber-800"}`}>{workerState}</dd><dd className="mt-1 text-xs text-zinc-500">Last seen: {date(worker?.checked_at)}</dd></div>
      <div><dt className="text-zinc-500">Waiting / failed</dt><dd className="mt-1 font-medium">{Number(totals?.waiting ?? 0)} / {Number(totals?.failed ?? 0)}</dd><dd className="mt-1 text-xs text-zinc-500">Retained server jobs from the last 30 days</dd></div>
      <div><dt className="text-zinc-500">Latest live acceptance</dt><dd className="mt-1 font-medium">{date(accepted?.sent_at)}</dd></div>
    </dl>
    {!fresh || worker?.last_error ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{worker?.last_error || "Check that the Meta background worker is running with the current application release."}</p> : null}
    {failure.map((job, index) => <p key={index} className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{job.event_name}: {job.last_error}<span className="mt-1 block text-xs">Last attempt: {date(job.last_attempt_at)}</span></p>)}
  </section>;
}
