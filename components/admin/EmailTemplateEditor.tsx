"use client";

import { LockKeyhole, LoaderCircle } from "lucide-react";
import { Fragment, useId, useRef, useState, type FormEvent } from "react";
import { saveEmailTemplateAction } from "@/app/admin/(dashboard)/emails/templates/actions";
import { emailCopyDefinition, splitEmailCopy, validateEmailCopy, type EmailCopyKey, type EmailCopyOverrides } from "@/lib/email/copy";
import type { EmailBrand } from "@/lib/email/layout";
import { emailPreviews } from "@/lib/email/previews";
import { showAdminToast } from "./AdminToastProvider";

const tokenLabels: Record<string, string> = {
  customerName: "Customer name", administratorName: "Administrator name", orderNumber: "Order number", total: "Order total", paymentStatus: "Payment status",
  bankInstructions: "Saved bank instructions", courier: "Courier", topic: "Enquiry topic", reference: "Enquiry reference", recipient: "Recipient email", expiryMinutes: "Expiry in minutes", expiryHours: "Expiry in hours",
};

export default function EmailTemplateEditor({ templateKey, label, brand, initialRevision }: { templateKey: EmailCopyKey; label: string; brand: EmailBrand; initialRevision: string }) {
  const id = useId();
  const saving = useRef(false);
  const [draft, setDraft] = useState<EmailCopyOverrides>(brand.emailCopy?.[templateKey] ?? {});
  const [saved, setSaved] = useState(draft);
  const [revision, setRevision] = useState(initialRevision);
  const [scenario, setScenario] = useState("default");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const definition = emailCopyDefinition(templateKey);
  const groups = Array.from(new Set(Object.values(definition).map((field) => field.group)));
  const sample = emailPreviews({ ...brand, emailCopy: { ...brand.emailCopy, [templateKey]: draft } }, scenario).find((item) => item.key === templateKey)!;
  let dirty = true;
  try { dirty = JSON.stringify(validateEmailCopy(templateKey, draft)) !== JSON.stringify(saved); } catch { /* Invalid drafts must remain editable. */ }

  function edit(field: string, index: number, text: string) {
    const parts = [...(draft[field] ?? splitEmailCopy(definition[field].source).literals)];
    parts[index] = text;
    setDraft({ ...draft, [field]: parts });
    setError("");
    setNotice("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    setError("");
    setNotice("");
    let values: EmailCopyOverrides;
    try { values = validateEmailCopy(templateKey, draft); }
    catch (error) { setError(error instanceof Error ? error.message : "Check the email wording."); return; }
    saving.current = true;
    setPending(true);
    try {
      const result = await saveEmailTemplateAction(templateKey, values, revision);
      if (!result.success) { setError(result.message); return; }
      setDraft(result.values);
      setSaved(result.values);
      setRevision(result.revision);
      setNotice("Saved. New emails will use this wording in both versions.");
      showAdminToast({ id: `email-template-${templateKey}`, type: "success", title: "Email wording saved" });
    } catch {
      setError("The wording could not be saved. Please try again.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium">Subject: {sample.email.subject}</p>
      {templateKey.startsWith("order-") || templateKey === "new-order-team" ? <label className="flex items-center gap-2 text-sm text-zinc-600">Sample order
        <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" onChange={(event) => setScenario(event.target.value)} value={scenario}>
          <option value="default">Default example</option><option value="new">New / bank transfer</option><option value="confirmed">Confirmed</option><option value="processing">Processing / paid</option><option value="shipped">Shipped / Royal Mail</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option><option value="cash">Cash on delivery</option><option value="bankMissing">Bank instructions missing</option><option value="other">On hold / payment pending</option>
        </select>
      </label> : null}
    </div>
    <iframe className="h-[1000px] w-full rounded-xl border border-zinc-200 bg-[#eee8de]" sandbox="" srcDoc={sample.email.html} title={`${label} email preview`} />
    <details className="mt-5 rounded-xl border border-zinc-200 bg-white p-5" open>
      <summary className="cursor-pointer text-sm font-semibold">Plain-text version &amp; wording</summary>
      <p className="mt-3 text-sm leading-6 text-zinc-600">Edit the wording below to update both email versions. Locked details are filled in automatically for each email. Save before switching templates.</p>
      <div className="mt-5 grid items-start gap-6 xl:grid-cols-2">
        <form aria-busy={pending} onSubmit={submit}>
          <fieldset className="space-y-4" disabled={pending}>
            {groups.map((group) => <details className="rounded-lg border border-zinc-200 p-4" key={group} open={group === "Header" || group === "Message"}>
              <summary className="cursor-pointer text-sm font-medium">{group}</summary>
              <div className="mt-4 space-y-5">{Object.entries(definition).filter(([, field]) => field.group === group).map(([fieldId, field]) => {
                const { literals, tokens } = splitEmailCopy(field.source);
                const parts = draft[fieldId] ?? literals;
                return <div key={fieldId}>
                  <p className="mb-2 text-sm font-medium text-zinc-700" id={`${id}-${fieldId}`}>{field.label}</p>
                  <div className="space-y-2">{parts.map((part, index) => <Fragment key={index}>
                    <textarea aria-label={`${field.label}${tokens.length ? ` — text ${index + 1}` : ""}`} className="block w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100 disabled:opacity-60" maxLength={field.maxLength} onChange={(event) => edit(fieldId, index, event.target.value)} placeholder={tokens.length ? "Optional wording beside the locked detail" : field.label} rows={part.length > 140 ? 4 : part.length > 75 ? 2 : 1} value={part} />
                    {tokens[index] ? <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600"><LockKeyhole aria-hidden="true" size={12} />{tokenLabels[tokens[index]] ?? tokens[index]}</span> : null}
                  </Fragment>)}</div>
                </div>;
              })}</div>
            </details>)}
          </fieldset>
          {error ? <p className="mt-4 text-sm text-red-700" role="alert">{error}</p> : null}
          {notice ? <p className="mt-4 text-sm text-emerald-700" role="status">{notice}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-50" disabled={pending || !dirty} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : null}{pending ? "Saving…" : "Save wording"}</button>
            <button className="cursor-pointer rounded-lg border border-zinc-300 px-4 py-2.5 text-sm disabled:opacity-50" disabled={pending} onClick={() => { setDraft({}); setError(""); setNotice("Default wording loaded. Select Save wording to apply it."); }} type="button">Restore defaults</button>
            {dirty ? <span className="text-xs text-amber-800">Unsaved changes</span> : null}
          </div>
        </form>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 xl:sticky xl:top-5">
          <p className="text-sm font-medium">Plain-text preview</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Sample details are locked. Products, prices, addresses, tracking details and links come from the actual record when sent.</p>
          <pre className="mt-4 max-h-[800px] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-6">{sample.email.text}</pre>
        </div>
      </div>
    </details>
  </>;
}
