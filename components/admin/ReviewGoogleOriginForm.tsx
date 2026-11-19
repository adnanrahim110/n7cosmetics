"use client";

import { useActionState } from "react";
import { reviewOriginLabels, type ReviewOrigin, type ReviewOriginFormState } from "@/lib/google-product-reviews/provenance";

export default function ReviewGoogleOriginForm({ reviewId, revision, origin, incentive, action }: {
  reviewId: string; revision: string; origin: ReviewOrigin; incentive: number | null;
  action: (previous: ReviewOriginFormState, form: FormData) => Promise<ReviewOriginFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const prefix = `review-origin-${reviewId}`;
  return <details className="mt-4 rounded-lg border border-zinc-200 p-4">
    <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Google feed: {state.success ? "Customer source confirmed" : reviewOriginLabels[origin]}</summary>
    <p className="mt-2 text-xs leading-5 text-zinc-600">Website submissions and archived WordPress customer reviews are eligible after publication. Curated seeds and entries with an unconfirmed source stay out of the feed. Confirm only after checking the customer’s original review.</p>
    <form action={formAction} aria-busy={pending} className="mt-4 space-y-4">
      <input type="hidden" name="reviewId" value={reviewId} /><input type="hidden" name="revision" value={state.revision ?? revision} />
      <div><label className="block text-sm font-medium text-zinc-800" htmlFor={`${prefix}-evidence`}>Original customer source or reference</label>
        <textarea className="mt-2 min-h-24 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" aria-describedby={`${prefix}-hint`} id={`${prefix}-evidence`} name="evidence" minLength={10} maxLength={500} required rows={3} />
        <p className="mt-2 text-xs text-zinc-600" id={`${prefix}-hint`}>Use an internal review/email/ticket reference. Avoid customer contact details. This reference is kept in the admin audit log.</p>
      </div>
      <div><label className="block text-sm font-medium text-zinc-800" htmlFor={`${prefix}-incentive`}>Was an incentive offered?</label>
        <select className="mt-2 min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" id={`${prefix}-incentive`} name="incentive" defaultValue={incentive === null ? "UNKNOWN" : incentive ? "YES" : "NO"}>
          <option value="UNKNOWN">Not recorded</option><option value="NO">Confirmed: no incentive</option><option value="YES">Yes — disclose an incentive</option>
        </select>
        <p className="mt-2 text-xs text-zinc-600">Choose yes whenever an incentive was offered, regardless of the rating.</p>
      </div>
      <label className="flex min-h-11 items-center gap-3 text-sm text-zinc-800"><input className="size-4 accent-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" type="checkbox" name="confirmed" required />I checked that this is the customer’s original product review.</label>
      {state.error ? <p className="text-sm text-red-800" role="alert">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-800" role="status">Customer source saved. Published reviews update the feed automatically.</p> : null}
      <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : "Confirm customer source"}</button>
    </form>
  </details>;
}
