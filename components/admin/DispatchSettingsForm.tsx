"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DispatchSchedule } from "@/lib/commerce/dispatch";

export interface DispatchSettingsState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
}

const weekdays = [[1, "Monday"], [2, "Tuesday"], [3, "Wednesday"], [4, "Thursday"], [5, "Friday"], [6, "Saturday"], [0, "Sunday"]] as const;
const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus-visible:ring-2 focus-visible:ring-amber-700";

export default function DispatchSettingsForm({ value, action }: {
  value: DispatchSchedule;
  action: (state: DispatchSettingsState, form: FormData) => Promise<DispatchSettingsState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [schedule, setSchedule] = useState(value);
  const [closedDates, setClosedDates] = useState(value.closedDates.join("\n"));
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  return (
    <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" id="dispatch">
      <h2 className="font-body text-base font-semibold text-zinc-950">Dispatch working hours</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">The product-page countdown follows the same-day cutoff on working days. After the cutoff it shows the next dispatch day, skipping closed dates.</p>
      <form action={formAction} className="mt-5 space-y-5">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-zinc-800"><input checked={schedule.enabled} className="size-4 accent-amber-800 focus-visible:ring-2 focus-visible:ring-amber-700" name="enabled" onChange={(event) => setSchedule({ ...schedule, enabled: event.target.checked })} type="checkbox" />Show dispatch information on product pages</label>
        <fieldset>
          <legend className="text-sm font-medium text-zinc-800">Working days</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {weekdays.map(([day, label]) => <label className={cn("flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm", schedule.workingDays.includes(day) ? "border-amber-700 bg-amber-50 text-amber-950" : "border-zinc-300 text-zinc-700")} key={day}><input checked={schedule.workingDays.includes(day)} className="size-4 accent-amber-800 focus-visible:ring-2 focus-visible:ring-amber-700" name="workingDays" onChange={(event) => setSchedule({ ...schedule, workingDays: event.target.checked ? [...schedule.workingDays, day] : schedule.workingDays.filter((item) => item !== day) })} type="checkbox" value={day} />{label}</label>)}
          </div>
          {fieldError("workingDays") ? <p className="mt-2 text-xs text-red-700">{fieldError("workingDays")}</p> : null}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium text-zinc-700">Opening time<input aria-invalid={Boolean(fieldError("opensAt"))} className={inputClass} name="opensAt" onChange={(event) => setSchedule({ ...schedule, opensAt: event.target.value })} required type="time" value={schedule.opensAt} />{fieldError("opensAt") ? <span className="mt-2 block text-xs text-red-700">{fieldError("opensAt")}</span> : null}</label>
          <label className="text-sm font-medium text-zinc-700">Same-day cutoff<input aria-invalid={Boolean(fieldError("cutoffAt"))} className={inputClass} name="cutoffAt" onChange={(event) => setSchedule({ ...schedule, cutoffAt: event.target.value })} required type="time" value={schedule.cutoffAt} />{fieldError("cutoffAt") ? <span className="mt-2 block text-xs text-red-700">{fieldError("cutoffAt")}</span> : null}</label>
          <label className="text-sm font-medium text-zinc-700">Time zone<input aria-invalid={Boolean(fieldError("timeZone"))} className={inputClass} maxLength={100} name="timeZone" onChange={(event) => setSchedule({ ...schedule, timeZone: event.target.value })} placeholder="Europe/London" required value={schedule.timeZone} /><span className="mt-2 block text-xs font-normal text-zinc-600">Europe/London follows GMT and British Summer Time automatically.</span>{fieldError("timeZone") ? <span className="mt-2 block text-xs text-red-700">{fieldError("timeZone")}</span> : null}</label>
        </div>
        <label className="block text-sm font-medium text-zinc-700">Closed dates<textarea aria-invalid={Boolean(fieldError("closedDates"))} className={inputClass} name="closedDates" onChange={(event) => setClosedDates(event.target.value)} placeholder="2026-12-25" rows={3} value={closedDates} /><span className="mt-2 block text-xs font-normal text-zinc-600">Add bank holidays and other closures, one date per line (YYYY-MM-DD).</span>{fieldError("closedDates") ? <span className="mt-2 block text-xs text-red-700">{fieldError("closedDates")}</span> : null}</label>
        {state.error ? <p className="text-sm text-red-700" role="alert">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-emerald-700" role="status">Dispatch schedule saved.</p> : null}
        <div className="flex justify-end"><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none" disabled={pending} type="submit">{pending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" size={16} /> : <Save size={16} />}{pending ? "Saving…" : "Save dispatch schedule"}</button></div>
      </form>
    </section>
  );
}
