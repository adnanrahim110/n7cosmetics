"use client";

import { useActionState } from "react";
import Link from "next/link";
import AdminToggle from "../AdminToggle";
import MerchantTextField from "./MerchantTextField";
import type { GoogleReviewsFormState, GoogleReviewsSettings } from "@/lib/google-reviews/config";

export default function GoogleReviewsSettingsForm({ settings, revision, action }: {
  settings: GoogleReviewsSettings; revision: string;
  action: (previous: GoogleReviewsFormState, form: FormData) => Promise<GoogleReviewsFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const error = (name: string) => state.fieldErrors?.[name]?.[0];
  return <section aria-labelledby="google-reviews-heading" className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6" id="customer-reviews">
    <h2 className="text-lg font-semibold" id="google-reviews-heading">Google Customer Reviews</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-600">Invite buyers to review their order after delivery and show Google’s store information across the storefront. Google controls the displayed rating and eligibility.</p>
    <form action={formAction} aria-busy={pending} className="mt-6 space-y-6">
      <input name="revision" type="hidden" value={state.revision ?? revision} />
      <div className="grid gap-6 sm:grid-cols-2">
        <MerchantTextField name="merchantId" label="Merchant Center ID" hint="The numeric ID from your Google Customer Reviews setup." defaultValue={settings.merchantId} maxLength={15} inputMode="numeric" error={error("merchantId")} />
        <MerchantTextField name="fallbackDeliveryDays" label="Fallback delivery working days" hint="Used only when the order’s shipping method has no maximum estimate. Counted after dispatch, skipping configured closed days." defaultValue={String(settings.fallbackDeliveryDays)} maxLength={2} type="number" min={1} max={30} step={1} error={error("fallbackDeliveryDays")} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminToggle name="surveyEnabled" label="Enable purchase review invitations" description="Shown after verified live payments and delivery-address confirmation. Test payments are excluded." defaultChecked={settings.surveyEnabled} />
        <AdminToggle name="widgetEnabled" label="Enable Google store widget" description="Shown on browsing pages, hidden during checkout, shopping overlays and mobile quick purchase." defaultChecked={settings.widgetEnabled} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-zinc-800" htmlFor="google-widget-position">Widget position</label>
          <select aria-invalid={Boolean(error("widgetPosition"))} className="mt-2 min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" id="google-widget-position" name="widgetPosition" defaultValue={settings.widgetPosition}>
            <option value="LEFT_BOTTOM">Bottom left</option><option value="RIGHT_BOTTOM">Bottom right</option>
          </select>
          {error("widgetPosition") ? <p className="mt-2 text-sm text-red-700">{error("widgetPosition")}</p> : null}
        </div>
        <MerchantTextField name="widgetRegion" label="Widget country" hint="GB for the UK. Leave blank for Google’s automatic region." defaultValue={settings.widgetRegion} maxLength={2} error={error("widgetRegion")} />
        <MerchantTextField name="widgetBottomMargin" label="Desktop bottom space (px)" hint="16–240, in steps of 4." defaultValue={String(settings.widgetBottomMargin)} maxLength={3} type="number" min={16} max={240} step={4} error={error("widgetBottomMargin")} />
        <MerchantTextField name="widgetMobileBottomMargin" label="Mobile bottom space (px)" hint="Keep clear of mobile controls. 16–240, in steps of 4." defaultValue={String(settings.widgetMobileBottomMargin)} maxLength={3} type="number" min={16} max={240} step={4} error={error("widgetMobileBottomMargin")} />
      </div>
      <p className="text-sm leading-6 text-zinc-600">Invitations use the actual order number, email and delivery country. The expected arrival date uses the paid date, selected shipping estimate and <Link href="/admin/settings#dispatch" className="font-medium text-amber-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">dispatch schedule</Link>. These integrations run on the configured public HTTPS domain. The survey sends the order email to Google; it is separate from Meta/TikTok consent and newsletter preferences.</p>
      {state.error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800" role="status">Google Customer Reviews settings saved.</p> : null}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : "Save review settings"}</button>
    </form>
  </section>;
}
