import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import { getEmailPreferences } from "@/lib/email/brand";
import { emailPreviews } from "@/lib/email/previews";

export default async function EmailTemplatesPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const templates = emailPreviews(await getEmailPreferences());
  const { template } = await searchParams;
  const selected = templates.find((item) => item.key === template) ?? templates[0];
  return <div><PageHeader eyebrow="N7 correspondence" title="Email templates" description="Sample messages using the same layouts sent to customers. These previews do not send email." actions={<Link className="text-sm text-amber-800 underline" href="/admin/emails">Back to delivery</Link>} /><nav aria-label="Email templates" className="my-6 flex flex-wrap gap-2">{templates.map((item) => <Link aria-current={selected.key === item.key ? "page" : undefined} className={`rounded-md border px-3 py-2 text-xs ${selected.key === item.key ? "border-amber-700 bg-amber-50 text-amber-900" : "border-zinc-200 bg-white"}`} href={`/admin/emails/templates?template=${item.key}`} key={item.key}>{item.label}</Link>)}</nav><p className="mb-4 text-sm font-medium">Subject: {selected.email.subject}</p><iframe className="h-[1000px] w-full rounded-xl border border-zinc-200 bg-[#eee8de]" sandbox="" srcDoc={selected.email.html} title={`${selected.label} email preview`} /><details className="mt-5 rounded-lg border border-zinc-200 bg-white p-4"><summary className="cursor-pointer text-sm font-medium">Plain-text version</summary><pre className="mt-4 whitespace-pre-wrap text-sm leading-6">{selected.email.text}</pre></details></div>;
}
