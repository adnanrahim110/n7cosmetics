"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveSmtpSettingsAction, sendTestEmailAction } from "@/app/admin/(dashboard)/settings/email-actions";
import { smtpPasswordRequired, type SmtpInput, type EmailSettingsFormState } from "@/lib/email/settings";
import PasswordInput from "./PasswordInput";

export function EmailSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? pendingLabel : label}</button>;
}

const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
type SavedSmtp = Omit<SmtpInput, "password"> & { hasPassword: boolean; revision: string; verifiedAt?: string };

export default function SmtpSettingsForm({ saved, adminEmail }: { saved: SavedSmtp; adminEmail: string }) {
  const [state, action, pending] = useActionState(saveSmtpSettingsAction, {} as EmailSettingsFormState);
  const [fields, setFields] = useState(saved);
  const passwordRequired = smtpPasswordRequired(fields, saved);
  const set = <K extends keyof SavedSmtp>(key: K, value: SavedSmtp[K]) => setFields((current) => ({ ...current, [key]: value }));
  return <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" id="smtp">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Owner only</p>
    <h2 className="mt-1 font-body text-base font-semibold text-zinc-950">SMTP email delivery</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-500">Connect Gmail, a hosted mailbox or any provider supporting SMTP with a username and password. All store emails use this connection. Credentials are encrypted.</p>
    {saved.verifiedAt ? <p className="mt-3 text-sm text-emerald-700">Active connection verified {new Date(saved.verifiedAt).toLocaleString("en-GB")}.</p> : <p className="mt-3 text-sm text-amber-800">Save and verify your connection before sending a delivery test.</p>}
    <form action={action} className="mt-5">
      <input type="hidden" name="revision" value={saved.revision} />
      <fieldset className="grid gap-5 sm:grid-cols-2" disabled={pending}>
        <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Provider<select className={input} name="provider" value={fields.provider} onChange={(event) => {
          const provider = event.target.value as SmtpInput["provider"];
          setFields((current) => ({ ...current, provider, ...(provider === "gmail" ? { host: "smtp.gmail.com", port: 465, security: "tls" as const } : current.provider === "gmail" ? { host: "", port: 465, security: "tls" as const } : {}) }));
        }}><option value="custom">Custom SMTP</option><option value="gmail">Gmail / Google Workspace</option><option value="hosted">Hosted mailbox / Webmail</option></select></label>
        <p className="text-sm leading-6 text-zinc-500 sm:col-span-2">{fields.provider === "gmail" ? <>Use your full mailbox address and a <a className="text-amber-800 underline" href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noreferrer">Google app password</a>. Your sender must be an address this account can send from.</> : fields.provider === "hosted" ? "Copy the outgoing SMTP server, port and username from your hosting provider’s mail-client settings. Enter the mailbox password, not the hosting control-panel password or webmail URL." : "Use your provider’s SMTP hostname and credentials. The username may differ from your email address. OAuth-only accounts require a separate integration."}</p>
        <label className="text-sm font-medium text-zinc-700">SMTP hostname<input className={input} name="host" value={fields.host} onChange={(e) => set("host", e.target.value)} placeholder="mail.example.com" maxLength={253} required autoComplete="off" /></label>
        <label className="text-sm font-medium text-zinc-700">Port<input className={input} name="port" type="number" min={1} max={65535} value={fields.port || ""} onChange={(e) => set("port", Number(e.target.value))} required /></label>
        <label className="text-sm font-medium text-zinc-700">Encryption<select className={input} name="security" value={fields.security} onChange={(e) => {
          const security = e.target.value as SmtpInput["security"];
          setFields((current) => ({ ...current, security, port: [465, 587].includes(current.port) ? security === "tls" ? 465 : 587 : current.port }));
        }}><option value="tls">SSL/TLS — normally port 465</option><option value="starttls">STARTTLS — normally port 587</option></select></label>
        <label className="text-sm font-medium text-zinc-700">SMTP username<input className={input} name="user" value={fields.user} onChange={(e) => set("user", e.target.value)} maxLength={255} required autoComplete="off" /></label>
        <PasswordInput label="SMTP password" name="password" autoComplete="new-password" maxLength={500} required={passwordRequired} hint={passwordRequired ? "Required for a new server or username." : "A password is saved. Leave blank to keep it for this account."} />
        <label className="text-sm font-medium text-zinc-700">Sender name<input className={input} name="fromName" value={fields.fromName} onChange={(e) => set("fromName", e.target.value)} maxLength={120} required /></label>
        <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Sender email<input className={input} name="fromEmail" type="email" value={fields.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} maxLength={190} required /><span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">Use a mailbox or sending address authorised by your provider. Configure your domain’s SPF, DKIM and DMARC records with the provider.</span></label>
      </fieldset>
      {state.error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{state.error}</p> : null}
      <p className="mt-4 text-xs leading-5 text-zinc-500">Saving verifies the connection without sending email, then activates it. Existing queued emails use the new connection. A delivery test also checks whether the sender is accepted.</p>
      <div className="mt-4 flex justify-end"><EmailSubmitButton label="Save and verify SMTP" pendingLabel="Verifying connection…" /></div>
    </form>
    {saved.hasPassword ? <form action={sendTestEmailAction} className="mt-6 flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-5">
      <label className="min-w-0 flex-1 text-sm font-medium text-zinc-700">Test recipient<input className={input} defaultValue={adminEmail} name="recipient" type="email" required maxLength={190} /></label>
      <EmailSubmitButton label="Send delivery test" pendingLabel="Sending test…" />
      <p className="w-full text-xs text-zinc-500">Uses the saved connection and sender. Check Email & enquiries for any delivery errors.</p>
    </form> : null}
  </section>;
}
