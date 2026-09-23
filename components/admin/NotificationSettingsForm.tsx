"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveNotificationSettingsAction, sendNotificationTestAction } from "@/app/admin/(dashboard)/settings/email-actions";
import { MAX_NOTIFICATION_RECIPIENTS, notificationDescriptions, notificationLabels, notificationRecipients, notificationSettingsSchema, notificationTypes, type EmailSettingsFormState, type NotificationSettings } from "@/lib/email/settings";
import { EmailSubmitButton } from "./SmtpSettingsForm";

const input = "w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";

function RecipientList({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return <div className="space-y-2">
    {values.map((value, index) => <div className="flex items-center gap-2" key={index}>
      <label className="min-w-0 flex-1"><span className="sr-only">{label} email {index + 1}</span><input className={input} type="email" value={value} onChange={(event) => onChange(values.map((item, i) => i === index ? event.target.value : item))} maxLength={190} placeholder="team@example.com" required /></label>
      <button type="button" className="rounded-lg border border-red-200 p-2.5 text-red-700 hover:bg-red-50" aria-label={`Remove ${label.toLowerCase()} email ${index + 1}`} onClick={() => onChange(values.filter((_, i) => i !== index))}><Trash2 size={17} /></button>
    </div>)}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs text-zinc-500">{values.length}/{MAX_NOTIFICATION_RECIPIENTS} email addresses</span>
      <button type="button" disabled={values.length >= MAX_NOTIFICATION_RECIPIENTS} className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold disabled:opacity-50" onClick={() => onChange([...values, ""])}><Plus size={15} />Add recipient</button>
    </div>
  </div>;
}

export default function NotificationSettingsForm({ saved, replyTo, contactEmail, bankInstructions }: { saved: NotificationSettings; replyTo: string; contactEmail?: string; bankInstructions: string }) {
  const [state, action, pending] = useActionState(saveNotificationSettingsAction, {} as EmailSettingsFormState);
  const [settings, setSettings] = useState(saved);
  const [clientError, setClientError] = useState("");
  const [replyAddress, setReplyAddress] = useState(replyTo);
  const [instructions, setInstructions] = useState(bankInstructions);
  const testable = notificationTypes.filter((type) => notificationRecipients(saved, type).length);
  return <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" id="email-content">
    <h2 className="font-body text-base font-semibold">Store notification recipients</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-500">Choose who receives internal store alerts. Each address receives its own email with separate delivery tracking. Customer confirmations, subscription emails and password recovery use the customer’s or account holder’s address.</p>
    <form action={action} className="mt-5" onSubmit={(event) => {
      const result = notificationSettingsSchema.safeParse(settings);
      if (!result.success) { event.preventDefault(); setClientError(result.error.issues[0]?.message || "Check the recipient lists."); }
      else setClientError("");
    }}>
      <input type="hidden" name="notifications" value={JSON.stringify(settings)} />
      <fieldset disabled={pending} className="space-y-5">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <h3 className="mb-2 font-body text-sm font-semibold text-zinc-900">Default store recipients</h3>
          <p className="mb-3 text-xs leading-5 text-zinc-500">Used by notification types set to the default list. Changing the public contact email does not change these recipients.</p>
          <RecipientList label="Default recipients" values={settings.defaultRecipients} onChange={(defaultRecipients) => setSettings((current) => ({ ...current, defaultRecipients }))} />
        </div>
        {notificationTypes.map((type) => {
          const route = settings.routes[type];
          const effective = notificationRecipients(settings, type);
          return <div className="rounded-xl border border-zinc-200 p-4" key={type}>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={route.enabled} onChange={(event) => setSettings((current) => ({ ...current, routes: { ...current.routes, [type]: { ...current.routes[type], enabled: event.target.checked } } }))} />{notificationLabels[type]}</label>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{notificationDescriptions[type]}</p>
            {route.enabled ? <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-zinc-600">Recipient list<select className={`${input} mt-1`} value={route.useDefault ? "default" : "custom"} onChange={(event) => setSettings((current) => ({ ...current, routes: { ...current.routes, [type]: { ...current.routes[type], useDefault: event.target.value === "default" } } }))}><option value="default">Use default store recipients</option><option value="custom">Use a custom recipient list</option></select></label>
              {!route.useDefault ? <RecipientList label={notificationLabels[type]} values={route.recipients} onChange={(recipients) => setSettings((current) => ({ ...current, routes: { ...current.routes, [type]: { ...current.routes[type], recipients } } }))} /> : <p className={`break-words text-xs leading-5 ${effective.length ? "text-zinc-500" : "text-amber-800"}`}>{effective.length ? effective.join(", ") : "Add at least one default recipient before enabling this notification."}</p>}
            </div> : null}
          </div>;
        })}
        <label className="block text-sm font-medium text-zinc-700">Customer reply-to email<input className={`${input} mt-1.5`} type="email" name="replyTo" value={replyAddress} onChange={(event) => setReplyAddress(event.target.value)} maxLength={190} placeholder={contactEmail || "support@example.com"} /><span className="mt-1.5 block text-xs font-normal text-zinc-500">Leave blank to use the public contact email. Replies to team order and enquiry notifications go directly to the customer.</span></label>
        <label className="block text-sm font-medium text-zinc-700">Bank transfer instructions<textarea className={`${input} mt-1.5`} name="bankInstructions" value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={2000} rows={3} /><span className="mt-1.5 block text-xs font-normal text-zinc-500">Used for existing unpaid bank-transfer orders.</span></label>
      </fieldset>
      {clientError || state.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{clientError || state.error}</p> : null}
      <p className="mt-4 text-xs leading-5 text-zinc-500">Duplicate addresses are merged when saved. Disabled alerts and removed recipients are cancelled before their next delivery attempt. Messages already being sent may still complete.</p>
      <div className="mt-4 flex justify-end"><EmailSubmitButton label="Save notification settings" pendingLabel="Saving settings…" /></div>
    </form>
    {testable.length ? <form action={sendNotificationTestAction} className="mt-6 flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-5">
      <label className="min-w-0 flex-1 text-sm font-medium text-zinc-700">Test saved recipients<select className={`${input} mt-1.5`} name="notificationType">{testable.map((type) => <option value={type} key={type}>{notificationLabels[type]} ({notificationRecipients(saved, type).length})</option>)}</select></label>
      <EmailSubmitButton label="Send group test" pendingLabel="Queuing tests…" />
      <p className="w-full text-xs text-zinc-500">Uses saved lists. Save changes first, then check Email & enquiries for each recipient’s result.</p>
    </form> : null}
  </section>;
}
