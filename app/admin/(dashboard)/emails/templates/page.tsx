import Link from "next/link";
import PageHeader from "@/components/admin/PageHeader";
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor";
import { getEmailPreferences } from "@/lib/email/brand";
import { emailPreviews } from "@/lib/email/previews";
import { settingsRevision } from "@/lib/email/store";

export default async function EmailTemplatesPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const preferences = await getEmailPreferences();
  const templates = emailPreviews(preferences);
  const { template } = await searchParams;
  const selected = templates.find((item) => item.key === template) ?? templates[0];
  const brand = { appUrl: preferences.appUrl, contactEmail: preferences.contactEmail, address: preferences.address, emailCopy: { [selected.key]: preferences.emailCopy?.[selected.key] ?? {} } };
  return <div><PageHeader eyebrow="N7 correspondence" title="Email templates" description="Edit wording and preview sample emails. Saved changes apply to new emails; previews do not send email." actions={<Link className="text-sm text-amber-800 underline" href="/admin/emails">Back to delivery</Link>} /><nav aria-label="Email templates" className="my-6 flex flex-wrap gap-2">{templates.map((item) => <Link aria-current={selected.key === item.key ? "page" : undefined} className={`rounded-md border px-3 py-2 text-xs ${selected.key === item.key ? "border-amber-700 bg-amber-50 text-amber-900" : "border-zinc-200 bg-white"}`} href={`/admin/emails/templates?template=${item.key}`} key={item.key}>{item.label}</Link>)}</nav><EmailTemplateEditor brand={brand} initialRevision={settingsRevision(brand.emailCopy[selected.key])} key={selected.key} label={selected.label} templateKey={selected.key} /></div>;
}
