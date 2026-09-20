import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import PageHeader from "@/components/admin/PageHeader";
import LegacyBadge from "@/components/admin/LegacyBadge";
import Notice from "@/components/admin/Notice";
import { requireAdministrator } from "@/lib/auth/session";
import { selectRows } from "@/lib/db/query";
import { resolveEnquiryAction, retryEmailAction, unsubscribeSubscriberAction } from "./actions";

interface Job extends RowDataPacket { id: string; recipient: string; subject: string; template_key: string; status: string; attempts: number; available_at: Date; created_at: Date; last_error: string | null; can_retry: number }
interface Log extends RowDataPacket { id: string; recipient: string; subject: string; status: string; error_message: string | null; created_at: Date; email_job_id: string | null }
interface Enquiry extends RowDataPacket { id: string; source: string; import_id: string | null; name: string; email: string; phone: string | null; topic: string; message: string; status: string; created_at: Date }
interface Subscriber extends RowDataPacket { id: string; email: string; status: string; requested_at: Date; confirmed_at: Date | null }
const date = (value: Date) => new Date(value).toLocaleString("en-GB");
const button = "rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700";

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; q?: string; status?: string; saved?: string; error?: string }> }) {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const query = await searchParams;
  const tab = ["enquiries", "subscribers", "attempts"].includes(query.tab || "") ? query.tab! : "delivery";
  const page = Math.min(100000, Math.max(1, Number(query.page) || 1));
  const offset = (Math.floor(page) - 1) * 30;
  const q = (query.q || "").trim().slice(0, 190);
  const pattern = `%${q}%`;
  const roleFilter = admin.role === "OWNER" ? "1 = 1" : "template_key <> 'admin-password-reset'";
  const jobs = tab === "delivery" ? await selectRows<Job>(`SELECT CAST(id AS CHAR) AS id, recipient, subject, template_key, status, attempts, available_at, created_at, last_error,
    (payload_encrypted IS NOT NULL AND status IN ('PENDING','FAILED','SENT') AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP(3)) AND template_key NOT IN ('newsletter-confirmation','newsletter-welcome')) AS can_retry
    FROM email_jobs WHERE ${roleFilter} AND (recipient LIKE ? OR subject LIKE ?) AND (? = '' OR status = ?) ORDER BY created_at DESC, id DESC LIMIT 31 OFFSET ${offset}`, [pattern, pattern, query.status || "", query.status || ""]) : [];
  const logs = tab === "attempts" ? await selectRows<Log>(`SELECT CAST(id AS CHAR) AS id, recipient, subject, status, error_message, created_at, CAST(email_job_id AS CHAR) AS email_job_id FROM email_logs WHERE ${roleFilter} AND (recipient LIKE ? OR subject LIKE ?) ORDER BY id DESC LIMIT 31 OFFSET ${offset}`, [pattern, pattern]) : [];
  const enquiries = tab === "enquiries" ? await selectRows<Enquiry>(`SELECT *, CAST(id AS CHAR) AS id FROM contact_enquiries WHERE email LIKE ? OR name LIKE ? OR topic LIKE ? ORDER BY id DESC LIMIT 31 OFFSET ${offset}`, [pattern, pattern, pattern]) : [];
  const subscribers = tab === "subscribers" ? await selectRows<Subscriber>(`SELECT CAST(id AS CHAR) AS id, email, status, requested_at, confirmed_at FROM newsletter_subscribers WHERE email LIKE ? ORDER BY requested_at DESC LIMIT 31 OFFSET ${offset}`, [pattern]) : [];
  const counts = await selectRows<RowDataPacket & { status: string; count: number }>(`SELECT status, COUNT(*) AS count FROM email_jobs WHERE ${roleFilter} GROUP BY status`);
  const totalRows = Math.max(jobs.length, logs.length, enquiries.length, subscribers.length);
  const pageHref = (next: number) => `/admin/emails?${new URLSearchParams({ tab, q, status: query.status || "", page: String(next) })}`;
  return <div>
    <PageHeader eyebrow="Customer communication" title="Email & enquiries" description="Review delivery, recover failed messages and manage N7 fragrance subscriptions." actions={<><Link className={button} href="/admin/emails/templates">Preview templates</Link><Link className={button} href="/admin/settings#smtp">SMTP settings</Link></>} />
    {query.saved ? <Notice type="success">{query.saved === "retry" ? "Message queued for another delivery attempt." : query.saved === "resolved" ? "Enquiry marked resolved." : "Address removed from fragrance updates."}</Notice> : null}
    {query.error ? <Notice>This message is expired, already being processed, or cannot be resent.</Notice> : null}
    <div className="mt-6 flex flex-wrap gap-3">{counts.map((item) => <Link className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm" href={`/admin/emails?status=${item.status}`} key={item.status}><strong>{item.count}</strong> <span className="text-zinc-500">{item.status.toLowerCase()}</span></Link>)}</div>
    <nav aria-label="Email administration" className="mt-6 flex flex-wrap gap-2">{[["delivery", "Delivery queue"], ["attempts", "Attempt history"], ["enquiries", "Enquiries"], ["subscribers", "Subscribers"]].map(([value, label]) => <Link aria-current={tab === value ? "page" : undefined} className={`${button} ${tab === value ? "border-amber-700 text-amber-900" : ""}`} href={`/admin/emails?tab=${value}`} key={value}>{label}</Link>)}</nav>
    <form className="my-5 flex max-w-lg gap-2"><input name="tab" type="hidden" value={tab} /><input aria-label="Search email records" className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm" defaultValue={q} name="q" placeholder="Search email, subject or name" /><button className={button}>Search</button></form>
    {tab === "delivery" ? <p className="mb-4 text-xs leading-6 text-zinc-500">Pending messages wait for SMTP to be configured. Failed sends retry up to five times. Sensitive reset and subscription links expire automatically.</p> : null}
    <div className="space-y-3">
      {jobs.slice(0, 30).map((job) => <article className="rounded-xl border border-zinc-200 bg-white p-5" key={job.id}><div className="flex flex-wrap justify-between gap-3"><div className="min-w-0"><p className="break-words font-medium">{job.subject}</p><p className="mt-1 break-all text-sm text-zinc-500">{job.recipient}</p><p className="mt-2 text-xs text-zinc-400">#{job.id} · {job.template_key} · {date(job.created_at)}</p></div><div className="text-right"><p className="text-xs font-semibold">{job.status} · {job.attempts} attempts</p>{job.status === "PENDING" ? <p className="mt-1 text-xs text-zinc-500">Eligible {date(job.available_at)}</p> : null}{Boolean(job.can_retry) ? <form action={retryEmailAction.bind(null, job.id)} className="mt-3"><button className={button} type="submit">{job.status === "SENT" ? "Resend email" : "Retry now"}</button></form> : null}</div></div>{job.last_error ? <p className="mt-3 break-words rounded-md bg-red-50 p-3 text-xs text-red-800">{job.last_error}</p> : null}</article>)}
      {logs.slice(0, 30).map((log) => <article className="rounded-xl border border-zinc-200 bg-white p-5" key={log.id}><p className="font-medium">{log.subject}</p><p className="mt-1 text-sm text-zinc-500">{log.recipient} · {log.status}</p><p className="mt-2 text-xs text-zinc-400">{date(log.created_at)}{log.email_job_id ? ` · Job #${log.email_job_id}` : " · Direct test"}</p>{log.error_message ? <p className="mt-3 break-words text-xs text-red-800">{log.error_message}</p> : null}</article>)}
      {enquiries.slice(0, 30).map((enquiry) => <article className="rounded-xl border border-zinc-200 bg-white p-5" key={enquiry.id}><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">N7-{enquiry.id} · {enquiry.topic}</h2><p className="mt-2 text-sm text-zinc-500">{enquiry.name} · {date(enquiry.created_at)} · {enquiry.status}</p><a className="mt-2 inline-block text-sm text-amber-800 underline" href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone ? <p className="text-sm text-zinc-500">{enquiry.phone}</p> : null}</div>{enquiry.status === "NEW" ? <form action={resolveEnquiryAction.bind(null, enquiry.id)}><button className={button}>Mark resolved</button></form> : null}</div><p className="mt-5 whitespace-pre-wrap break-words border-t border-zinc-100 pt-4 text-sm leading-7">{enquiry.message}</p></article>)}
      {subscribers.slice(0, 30).map((subscriber) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-5" key={subscriber.id}><div><p className="break-all font-medium">{subscriber.email}</p><p className="mt-1 text-xs text-zinc-500">{subscriber.status} · Requested {date(subscriber.requested_at)}{subscriber.confirmed_at ? ` · Confirmed ${date(subscriber.confirmed_at)}` : ""}</p></div>{subscriber.status !== "UNSUBSCRIBED" ? <form action={unsubscribeSubscriberAction.bind(null, subscriber.id)}><button className={button}>Unsubscribe</button></form> : null}</article>)}
      {!totalRows ? <p className="rounded-xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500">No matching records.</p> : null}
    </div>
    <div className="mt-5 flex justify-between">{page > 1 ? <Link className={button} href={pageHref(page - 1)}>Previous</Link> : <span />}{totalRows > 30 ? <Link className={button} href={pageHref(page + 1)}>Next</Link> : null}</div>
  </div>;
}
