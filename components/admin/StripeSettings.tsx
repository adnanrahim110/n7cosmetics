import PasswordInput from "./PasswordInput";
import Notice from "./Notice";
import { selectRows } from "@/lib/db/query";
import { getApplicationConfig } from "@/lib/env";
import { saveStripeSettingsAction } from "@/app/admin/(dashboard)/settings/stripe-actions";
import type { RowDataPacket } from "mysql2/promise";

function parseSettingValue(value: unknown): string | boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === "boolean" || typeof parsed === "string") return parsed;
      return String(parsed ?? "");
    } catch {
      return value;
    }
  }
  return String(value ?? "");
}

export default async function StripeSettings({ saved, error }: { saved?: string; error?: string }) {
  const rows = await selectRows<RowDataPacket & { setting_key: string; value_json: unknown }>("SELECT setting_key, value_json FROM site_settings WHERE setting_group = 'stripe'");
  const settings = Object.fromEntries(rows.map((row) => [row.setting_key, parseSettingValue(row.value_json)]));
  const input = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
  return <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" id="stripe">
    <h2 className="font-body text-base font-semibold">Stripe payments</h2>
    <p className="mt-1 text-sm leading-6 text-zinc-500">Credit/debit cards, Apple Pay and Google Pay. Secret keys are encrypted in the database. Leave saved secret fields blank to keep them.</p>
    {saved ? <Notice type="success">Stripe settings saved.</Notice> : null}
    {error ? <Notice>{error === "pending" ? "Existing payments are still pending. Wait for them to settle or expire before changing account keys or mode." : error === "changed" ? "Stripe settings changed in another session. Review them and save again." : "Enter matching Stripe keys and a webhook signing secret before enabling payments."}</Notice> : null}
    <form action={saveStripeSettingsAction} className="mt-5 grid gap-5 sm:grid-cols-2">
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="stripeEnabled" defaultChecked={settings["stripe.enabled"] === true || settings["stripe.enabled"] === "true"} />Enable Stripe checkout</label>
      <label className="text-sm font-medium text-zinc-700">Mode<select className={input} name="stripeMode" defaultValue={String(settings["stripe.mode"] || "test")}><option value="test">Test</option><option value="live">Live</option></select></label>
      <label className="text-sm font-medium text-zinc-700">Publishable key<input className={input} name="stripePublishableKey" defaultValue={String(settings["stripe.publishable_key"] || "")} placeholder="pk_test_… or pk_live_…" maxLength={500} autoComplete="off" /></label>
      <PasswordInput autoComplete="new-password" label="Secret key" name="stripeSecretKey" maxLength={500} placeholder="sk_test_… or sk_live_…" hint={settings["stripe.secret_key_encrypted"] ? "Saved securely. Leave blank to keep." : "Add the secret key from your Stripe account."} />
      <PasswordInput autoComplete="new-password" label="Webhook signing secret" name="stripeWebhookSecret" maxLength={500} placeholder="whsec_…" hint={settings["stripe.webhook_secret_encrypted"] ? "Saved securely. Leave blank to keep." : "Add the signing secret for this webhook endpoint."} />
      <div className="space-y-2 text-sm text-zinc-600 sm:col-span-2">
        <p>Webhook endpoint: <code className="break-all">{getApplicationConfig().appUrl}/api/payments/stripe/webhook</code></p>
        <p>Events: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled.</p>
        <p>Register the storefront HTTPS domain under Stripe payment method domains for Apple Pay and Google Pay. Wallet availability depends on the customer’s browser and device.</p>
      </div>
      <div className="flex justify-end sm:col-span-2"><button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Save Stripe settings</button></div>
    </form>
  </section>;
}
