"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CustomSelect from "@/components/admin/CustomSelect";
import { RefreshCw } from "lucide-react";
import {
  calendarDate,
  customRangeError,
  shiftDate,
  shortDate,
  type DashboardRange,
} from "@/lib/admin/dashboard-dates";
import type { DashboardTab } from "@/lib/admin/dashboard-display";

const field =
  "mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:opacity-50";
const periods = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7", "7 days"],
  ["30", "30 days"],
  ["90", "90 days"],
  ["all", "All time"],
  ["custom", "Custom"],
] as const;
function selection(range: DashboardRange) {
  return {
    preset: range.preset,
    source: range.source,
    start: range.start,
    end: range.end,
  };
}
export default function DashboardControls({
  range,
  updatedAt,
  tab = "sales",
}: {
  range: DashboardRange;
  updatedAt: string;
  tab?: DashboardTab;
}) {
  const router = useRouter();
  const key = `${tab}:${range.preset}:${range.start}:${range.end}:${range.source}`;
  const [draft, setDraft] = useState(() => ({ key, ...selection(range) }));
  const [automatic, setAutomatic] = useState(true);
  const [pending, startTransition] = useTransition();
  const controls = useRef<HTMLDivElement>(null);
  // Synchronize server navigation (including Back) without remounting the inputs.
  if (draft.key !== key) setDraft({ key, ...selection(range) });
  const today = calendarDate(new Date(updatedAt), range.timeZone);
  const error =
    draft.preset === "custom"
      ? customRangeError(draft.start, draft.end, today)
      : undefined;
  const changed =
    draft.preset !== range.preset ||
    draft.source !== range.source ||
    (draft.preset === "custom" &&
      (draft.start !== range.start || draft.end !== range.end));
  const ads = tab === "meta" || tab === "traffic";

  useEffect(() => {
    if (!changed || error || pending || draft.key !== key) return;
    // Date inputs may emit intermediate values while typing; only submit a valid pair.
    const timer = window.setTimeout(
      () => {
        const query = new URLSearchParams({
          tab,
          range: draft.preset,
          source: draft.source,
        });
        if (draft.preset === "custom") {
          query.set("start", draft.start);
          query.set("end", draft.end);
        }
        startTransition(() =>
          router.replace(`/admin?${query}`, { scroll: false }),
        );
      },
      draft.preset === "custom" ? 600 : 0,
    );
    return () => window.clearTimeout(timer);
  }, [changed, error, pending, draft, key, tab, router]);

  useEffect(() => {
    if (!automatic || pending || changed || error) return;
    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !controls.current?.contains(document.activeElement)
      )
        startTransition(() => router.refresh());
    }, 60000);
    return () => window.clearInterval(timer);
  }, [automatic, pending, changed, error, router]);

  return (
    <div
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      aria-busy={pending}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div ref={controls} className="flex min-w-0 flex-wrap items-end gap-3">
          <fieldset disabled={pending} className="min-w-0 max-w-full">
            <legend className="text-xs font-medium text-zinc-500">
              Period
            </legend>
            <div className="mt-1 flex max-w-full overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-1">
              {periods.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={draft.preset === value}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      preset: value,
                      ...(value === "custom" &&
                      customRangeError(current.start, current.end, today)
                        ? { start: shiftDate(today, -29), end: today }
                        : {}),
                    }))
                  }
                  className={`min-h-8 shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-60 ${draft.preset === value ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-600 hover:bg-white hover:text-zinc-950"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {draft.preset === "custom" ? (
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs font-medium text-zinc-500">
                From
                <input
                  className={field}
                  type="date"
                  name="start"
                  min="2000-01-01"
                  max={today}
                  value={draft.start}
                  readOnly={pending}
                  aria-invalid={Boolean(error)}
                  aria-describedby="dashboard-date-help"
                  onChange={(event) =>
                    setDraft({ ...draft, start: event.target.value })
                  }
                />
              </label>
              <label className="text-xs font-medium text-zinc-500">
                Through
                <input
                  className={field}
                  type="date"
                  name="end"
                  min="2000-01-01"
                  max={today}
                  value={draft.end}
                  readOnly={pending}
                  aria-invalid={Boolean(error)}
                  aria-describedby="dashboard-date-help"
                  onChange={(event) =>
                    setDraft({ ...draft, end: event.target.value })
                  }
                />
              </label>
            </div>
          ) : null}
          <CustomSelect
            label="Order origin"
            name="source"
            value={draft.source}
            disabled={ads || pending}
            className="min-w-48"
            triggerClassName="min-h-10"
            searchable={false}
            onChange={([source]) => setDraft({ ...draft, source: source as DashboardRange["source"] })}
            options={[
              { value: "LIVE", label: "New website" },
              { value: "LEGACY", label: "Historical imports" },
              { value: "ALL", label: "All orders" },
            ]}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={automatic}
              onChange={(event) => setAutomatic(event.target.checked)}
              className="accent-amber-800"
            />
            Auto-refresh
          </label>
          <button
            type="button"
            disabled={pending || changed || Boolean(error)}
            onClick={() => startTransition(() => router.refresh())}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={15} className={pending ? "animate-spin" : ""} />
            {pending ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      {draft.preset === "custom" ? (
        <p
          id="dashboard-date-help"
          aria-live="polite"
          className={`mt-2 text-xs ${error ? "text-amber-800" : "text-zinc-500"}`}
        >
          {error ?? "Dates apply automatically. Select up to 366 days."}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-zinc-100 pt-3 text-xs leading-5 text-zinc-500">
        <p>
          {range.preset === "all" ? (
            ads ? (
              "All time · all available Meta reporting history"
            ) : tab === "operations" ? (
              "All time · current operations"
            ) : (
              <>
                All time · {shortDate(range.start)} – {shortDate(range.end)}
              </>
            )
          ) : (
            <>
              {shortDate(range.start)} – {shortDate(range.end)}{" "}
              <span className="text-zinc-400">compared with</span>{" "}
              {shortDate(range.previousStart)} – {shortDate(range.previousEnd)}
            </>
          )}
        </p>
        <p role="status">
          {pending ? (
            "Updating report…"
          ) : (
            <>
              Page refreshed{" "}
              {new Intl.DateTimeFormat("en-GB", {
                timeZone: range.timeZone ?? "Europe/London",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }).format(new Date(updatedAt))}{" "}
              {ads ? range.timeZone ?? "Europe/London" : "UK time"}{automatic ? " · every minute" : ""}
            </>
          )}
        </p>
      </div>
      {tab === "operations" ? (
        <p className="mt-2 text-xs text-zinc-500">
          Operations reflect current stock and fulfilment across all dates.
        </p>
      ) : null}
      {ads ? (
        <p className="mt-2 text-xs text-zinc-500">
          Meta uses the ad account’s time zone. Order origin does not filter
          advertising reports. Reports refresh at most once per minute;
          attribution can arrive later.
        </p>
      ) : null}
      {range.warning ? (
        <p role="alert" className="mt-3 text-sm text-amber-800">
          {range.warning}
        </p>
      ) : null}
    </div>
  );
}
