"use client";
import { useActionState } from "react";
import { saveTikTokSettings } from "@/app/admin/(dashboard)/tiktok/actions";
import PasswordInput from "./PasswordInput";
import TikTokFeedback from "./TikTokFeedback";

export interface TikTokFormValues { pixelId: string; pixelEnabled: boolean; serverEnabled: boolean; testEventCode: string; revision: string; hasAccessToken: boolean }
const input = "mt-2 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none focus-visible:ring-2 focus-visible:ring-amber-700";
export default function TikTokSettingsForm({ values, canEdit }: { values: TikTokFormValues; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveTikTokSettings, {});
  return <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6" aria-labelledby="tiktok-settings-title">
    <h2 id="tiktok-settings-title" className="font-body text-lg font-semibold text-zinc-950">Pixel and Events API settings</h2>
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="revision" value={state.revision ?? values.revision} />
      <TikTokFeedback state={state} />
      <fieldset disabled={!canEdit || pending} className="space-y-4 disabled:opacity-75">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-medium text-zinc-700">TikTok Pixel ID<input className={input} name="pixelId" defaultValue={values.pixelId} maxLength={20} pattern="[A-Z0-9]{20}|" autoCapitalize="characters" spellCheck={false} /><span className="mt-2 block text-xs font-normal leading-5 text-zinc-600">Use the same existing pixel for browser and server events.</span></label>
          <label className="text-sm font-medium text-zinc-700">Test Events code (optional)<input className={input} name="testEventCode" defaultValue={values.testEventCode} maxLength={100} pattern="[A-Za-z0-9_-]*" /><span className="mt-2 block text-xs font-normal leading-5 text-zinc-600">While set, server events use test mode and browser events are paused. Clear this code to enable live reporting.</span></label>
        </div>
        <PasswordInput name="accessToken" label="Events API access token" className="min-h-11 motion-reduce:transition-none" autoComplete="new-password" maxLength={4096} hint={values.hasAccessToken ? "A token is saved securely. Leave blank to keep it." : "Generate an access token in your pixel’s Settings → Events API."} />
        <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="clearAccessToken" className="size-4 accent-amber-800" />Remove the saved access token</label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="pixelEnabled" defaultChecked={values.pixelEnabled} className="size-4 accent-amber-800" />Enable browser events after marketing consent</label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-700"><input type="checkbox" name="serverEnabled" defaultChecked={values.serverEnabled} className="size-4 accent-amber-800" />Enable server events after marketing consent</label>
        {canEdit ? <button type="submit" className="min-h-11 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:opacity-50">{pending ? "Saving…" : "Save TikTok settings"}</button> : <p className="text-sm text-zinc-600">Only an owner can change credentials or run connection checks.</p>}
      </fieldset>
    </form>
  </section>;
}
