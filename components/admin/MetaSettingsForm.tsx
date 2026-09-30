"use client";
import { useActionState } from "react";
import { saveMetaSettings, checkMetaConnection, type MetaFormState } from "@/app/admin/(dashboard)/meta/actions";
import PasswordInput from "./PasswordInput";

export interface MetaFormValues { pixelId: string; pixelEnabled: boolean; capiEnabled: boolean; adAccountId: string; reportingEnabled: boolean; testEventCode: string; revision: string; hasCapiToken: boolean; hasReportingToken: boolean }
const input = "mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const card = "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6";
function Feedback({ state }: { state: MetaFormState }) {
  return state.error || state.success ? <p role={state.error ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${state.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{state.error || state.success}</p> : null;
}
export function MetaConnectionCheck({ kind, disabled }: { kind: "capi" | "reporting"; disabled: boolean }) {
  const [state, action, pending] = useActionState(checkMetaConnection, {});
  return <form action={action} className="space-y-3"><input type="hidden" name="kind" value={kind} /><button disabled={disabled || pending} type="submit" className="min-h-10 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50">{pending ? "Checking…" : kind === "capi" ? "Send server test event" : "Check reporting access"}</button><Feedback state={state} /></form>;
}
export default function MetaSettingsForm({ values, canEdit }: { values: MetaFormValues; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveMetaSettings, {});
  return <form action={action} className="space-y-5">
    <input type="hidden" name="revision" value={state.revision ?? values.revision} />
    <Feedback state={state} />
    <fieldset disabled={!canEdit || pending} className="space-y-5 disabled:opacity-75">
      <section className={card}>
        <h2 className="font-body text-base font-semibold text-zinc-950">Website tracking</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">Start with your Pixel ID. No access token or ad account is needed for browser tracking.</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">Pixel / dataset ID<input className={input} name="pixelId" defaultValue={values.pixelId} inputMode="numeric" pattern="[0-9]{5,30}|" maxLength={30} placeholder="e.g. 123456789012345" /><span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">Use the same web dataset for the Pixel and Conversions API.</span></label>
          <label className="flex items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="pixelEnabled" defaultChecked={values.pixelEnabled} className="size-4 accent-amber-800" />Enable browser tracking after visitor consent</label>
        </div>
      </section>
      <section className={card}>
        <h2 className="font-body text-base font-semibold text-zinc-950">Conversions API</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">Send consented events from N7’s server. Paid orders use verified Stripe payments and shared event IDs.</p>
        <label className="mt-4 flex items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="capiEnabled" defaultChecked={values.capiEnabled} className="size-4 accent-amber-800" />Enable server tracking when a dataset ID and token are saved</label>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div><PasswordInput name="capiToken" label="Conversions API access token" autoComplete="new-password" maxLength={4096} hint={values.hasCapiToken ? "Saved securely. Leave blank to keep the existing token." : "Generate this token in Events Manager for the dataset above."} /><label className="mt-3 flex items-center gap-2 text-xs text-zinc-600"><input name="clearCapiToken" type="checkbox" />Remove the saved token</label></div>
          <label className="text-sm font-medium text-zinc-700">Test Events code <span className="font-normal text-zinc-500">(optional)</span><input className={input} name="testEventCode" defaultValue={values.testEventCode} maxLength={100} pattern="[A-Za-z0-9_-]*" placeholder="TEST…" /><span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">Routes server events to Meta’s Test Events tool. Remove this code for live server reporting. Stripe test purchases are sent only with this code and never through the browser Pixel.</span></label>
        </div>
      </section>
      <section className={card}>
        <h2 className="font-body text-base font-semibold text-zinc-950">Advertising reporting connection</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">Connect your ad account to the main dashboard. Advertising reporting is independent of website tracking.</p>
        <label className="mt-4 flex items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="reportingEnabled" defaultChecked={values.reportingEnabled} className="size-4 accent-amber-800" />Enable reporting access</label>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">Ad account ID<input className={input} name="adAccountId" defaultValue={values.adAccountId} maxLength={34} placeholder="123456789012345 or act_123456789012345" /><span className="mt-1 block text-xs font-normal leading-5 text-zinc-500">This is an ad account ID, not a Business Portfolio or Page ID.</span></label>
          <div><PasswordInput name="reportingToken" label="Reporting access token" autoComplete="new-password" maxLength={4096} hint={values.hasReportingToken ? "Saved securely. Leave blank to keep the existing token." : "Use a token with ads_read and access to this ad account."} /><label className="mt-3 flex items-center gap-2 text-xs text-zinc-600"><input name="clearReportingToken" type="checkbox" />Remove the saved token</label></div>
        </div>
      </section>
      {canEdit ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">Access tokens are encrypted and never returned to storefront visitors.</p><button type="submit" className="min-h-11 rounded-lg bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save Meta settings"}</button></div> : <p className="text-sm text-zinc-500">Only an owner can change credentials or run connection checks.</p>}
    </fieldset>
  </form>;
}
