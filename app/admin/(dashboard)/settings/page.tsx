import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import CustomSelect from "@/components/admin/CustomSelect";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import SmtpSettingsForm from "@/components/admin/SmtpSettingsForm";
import NotificationSettingsForm from "@/components/admin/NotificationSettingsForm";
import SocialMediaLinksEditor from "@/components/admin/SocialMediaLinksEditor";
import StripeSettings from "@/components/admin/StripeSettings";
import { requireAdministrator } from "@/lib/auth/session";
import { selectRows } from "@/lib/db/query";
import { normalizeSocialMediaLinks } from "@/lib/social-media";
import { getEmailPreferences } from "@/lib/email/brand";
import { readSmtpValues, settingsRevision } from "@/lib/email/store";
import { smtpProviders } from "@/lib/email/settings";
import {
  saveSettingsAction,
  saveSocialMediaSettingsAction,
} from "./actions";

interface SettingRow extends RowDataPacket {
  setting_key: string;
  value_json: unknown;
}

interface SettingsQuery {
  error?: string;
  saved?: string;
  "social-error"?: string;
  "social-saved"?: string;
  "smtp-saved"?: string;
  "smtp-test"?: string;
  "email-saved"?: string;
  "email-error"?: string;
  "notification-test"?: string;
  "stripe-saved"?: string;
  "stripe-error"?: string;
}

function settingValue(value: unknown): string {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === "string" ? parsed : String(parsed ?? "");
    } catch {
      return value;
    }
  }
  return String(value ?? "");
}

const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const card = "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SettingsQuery> }) {
  const [admin, rows, query] = await Promise.all([
    requireAdministrator(),
    selectRows<SettingRow>("SELECT setting_key, value_json FROM site_settings WHERE setting_key IN ('contact.phone','contact.email','contact.address','contact.whatsapp','social.links','store.currency','inventory.low_stock_threshold','email.reply_to')"),
    searchParams,
  ]);
  const settings = Object.fromEntries(rows.map((row) => [row.setting_key, settingValue(row.value_json)]));
  const socialLinks = normalizeSocialMediaLinks(rows.find((row) => row.setting_key === "social.links")?.value_json);
  const smtpTest = query["smtp-test"];
  const [smtpValues, email] = await Promise.all([admin.role === "OWNER" ? readSmtpValues() : Promise.resolve({} as Record<string, unknown>), getEmailPreferences()]);

  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Global settings" description="Contact details, storefront information, social profiles, inventory defaults, and project-wide email delivery." />
      {query.saved ? <Notice type="success">Global settings saved.</Notice> : null}
      {query.error ? <Notice>Check the email, field lengths, and inventory threshold.</Notice> : null}
      {query["social-saved"] ? <Notice type="success">Social media profiles saved and published across the storefront.</Notice> : null}
      {query["social-error"] ? <Notice>Check every social profile has a supported platform and a valid web address.</Notice> : null}
      {query["smtp-saved"] ? <Notice type="success">SMTP connection verified and saved securely.</Notice> : null}
      {query["email-saved"] ? <Notice type="success">Store notification settings saved.</Notice> : null}
      {query["email-error"] ? <Notice>Check the recipient address and payment instructions.</Notice> : null}
      {smtpTest === "sent" ? <Notice type="success">Test email accepted by the SMTP server. Check the chosen recipient’s inbox.</Notice> : null}
      {smtpTest === "failed" ? <Notice>Delivery test failed. Check Email & enquiries → Attempt history for the connection or sender error.</Notice> : null}
      {smtpTest === "skipped" ? <Notice>SMTP is not fully configured yet.</Notice> : null}
      {smtpTest === "invalid" ? <Notice>Enter a valid test recipient email address.</Notice> : null}
      {query["notification-test"] === "queued" ? <Notice type="success">Tests queued for the saved recipients. Check delivery history for each result.</Notice> : null}
      {query["notification-test"] === "empty" || query["notification-test"] === "invalid" ? <Notice>Enable this notification and save at least one recipient before testing.</Notice> : null}

      <form action={saveSettingsAction} className="mt-7 space-y-6">
        <section className={`${card} grid gap-5 sm:grid-cols-2`}>
          <div className="sm:col-span-2"><h2 className="font-body text-base font-semibold text-zinc-950">Contact details</h2></div>
          <label className="text-sm font-medium text-zinc-700">Phone<input className={input} defaultValue={settings["contact.phone"]} maxLength={50} name="phone" /></label>
          <label className="text-sm font-medium text-zinc-700">Email<input className={input} defaultValue={settings["contact.email"]} maxLength={190} name="email" type="email" /></label>
          <label className="text-sm font-medium text-zinc-700">WhatsApp<input className={input} defaultValue={settings["contact.whatsapp"]} maxLength={50} name="whatsapp" /></label>
          <label className="text-sm font-medium text-zinc-700 sm:col-span-2">Address<textarea className={input} defaultValue={settings["contact.address"]} maxLength={1000} name="address" rows={3} /></label>
        </section>

        <section className={`${card} grid gap-5 sm:grid-cols-2`}>
          <div className="sm:col-span-2">
            <h2 className="font-body text-base font-semibold text-zinc-950">Storefront</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">General display settings used throughout the customer-facing store.</p>
          </div>
          <CustomSelect defaultValue={settings["store.currency"] || "GBP"} label="Currency" name="currency" options={[{ value: "GBP", label: "GBP — British pound" }, { value: "PKR", label: "PKR — Pakistani rupee" }, { value: "USD", label: "USD — US dollar" }, { value: "EUR", label: "EUR — Euro" }]} required searchable={false} />
        </section>

        <section className={card}>
          <div>
            <h2 className="font-body text-base font-semibold text-zinc-950">Inventory defaults</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">This threshold applies globally to every product and is synchronised to all existing inventory records when saved.</p>
          </div>
          <label className="mt-5 block max-w-sm text-sm font-medium text-zinc-700">Global low-stock threshold<input className={input} defaultValue={settings["inventory.low_stock_threshold"] || "5"} max={1000000} min={0} name="lowStockThreshold" required type="number" /><span className="mt-1.5 block text-xs font-normal leading-5 text-zinc-500">Products at or below this quantity appear in the low-stock count.</span></label>
        </section>
        <div className="flex justify-end"><button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Save settings</button></div>
      </form>

      <section className={`${card} mt-8`} id="social-media">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Storefront profiles</p>
          <h2 className="mt-1 font-body text-base font-semibold text-zinc-950">Social media</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">Add and order the profiles shown wherever social media appears on the storefront. Removing a profile here removes it everywhere.</p>
        </div>
        <form action={saveSocialMediaSettingsAction} className="mt-5">
          <SocialMediaLinksEditor defaultLinks={socialLinks} />
          <div className="mt-5 flex justify-end border-t border-zinc-100 pt-5"><button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800" type="submit">Save social media</button></div>
        </form>
      </section>

      {admin.role === "OWNER" ? <StripeSettings saved={query["stripe-saved"]} error={query["stripe-error"]} /> : null}

      {admin.role === "OWNER" || admin.role === "MANAGER" ? <NotificationSettingsForm key={JSON.stringify([email.notifications, email.replyToEmail, email.bankInstructions])} saved={email.notifications} replyTo={settings["email.reply_to"] || ""} contactEmail={email.contactEmail} bankInstructions={email.bankInstructions || ""} /> : null}
      {admin.role === "OWNER" ? <SmtpSettingsForm key={settingsRevision(smtpValues)} saved={{ provider: smtpProviders.includes(smtpValues["smtp.provider"] as typeof smtpProviders[number]) ? smtpValues["smtp.provider"] as typeof smtpProviders[number] : smtpValues["smtp.host"] === "smtp.gmail.com" ? "gmail" : "custom", host: String(smtpValues["smtp.host"] || ""), port: Number(smtpValues["smtp.port"] || 465), security: smtpValues["smtp.secure"] === false ? "starttls" : "tls", user: String(smtpValues["smtp.user"] || ""), fromName: String(smtpValues["smtp.from_name"] || "N7 Cosmetics"), fromEmail: String(smtpValues["smtp.from_email"] || ""), hasPassword: Boolean(smtpValues["smtp.password_encrypted"]), revision: settingsRevision(smtpValues), verifiedAt: String(smtpValues["smtp.verified_at"] || "") }} adminEmail={admin.email} /> : null}
      <p className="mt-5 text-sm"><Link className="text-amber-800 underline" href="/admin/emails">Delivery history, enquiries and email templates</Link></p>
    </div>
  );
}
