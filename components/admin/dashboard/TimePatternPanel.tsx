"use client";

import { useId, useState } from "react";
import { timingHours, timingWeekdays, type TimingPattern } from "@/lib/admin/dashboard-timing";
import { cn } from "@/lib/cn";
import TimingHourTable, { hourWindow } from "./TimingHourTable";

export interface TimingMetric { key: string; label: string }
export default function TimePatternPanel({ title, description, timing, metrics }: {
  title: string;
  description: string;
  timing: TimingPattern;
  metrics: readonly TimingMetric[];
}) {
  const dayId = useId();
  const [day, setDay] = useState<number | null>(null);
  const [selected, setSelected] = useState(metrics[0].key);
  const metric = metrics.find((item) => item.key === selected) ?? metrics[0];
  const hours = timingHours(timing, day, metric.key);
  const top = hours.filter((hour) => hour.total > 0 && hour.average !== null)
    .sort((a, b) => (b.average ?? 0) - (a.average ?? 0) || b.total - a.total || a.hour - b.hour).slice(0, 5);
  const dayLabel = day === null ? "All weekdays" : timingWeekdays[day];
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-body text-base font-semibold text-zinc-950">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p>
      <p className="mt-2 text-xs font-medium text-zinc-700">Time zone: {timing.timeZone}</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={dayId} className="mb-1 block text-xs font-medium text-zinc-700">Day of week</label>
          <select
            id={dayId}
            value={day ?? "all"}
            onChange={(event) => setDay(event.target.value === "all" ? null : Number(event.target.value))}
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
          >
            <option value="all">All weekdays</option>
            {timingWeekdays.map((label, index) => <option key={label} value={index}>{label}</option>)}
          </select>
        </div>
        <div role="group" aria-label={`${title} metric`} className="flex flex-wrap gap-2">
          {metrics.map((item) => (
            <button
              key={item.key} type="button" aria-pressed={metric.key === item.key} onClick={() => setSelected(item.key)}
              className={cn("min-h-11 min-w-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 motion-reduce:transition-none", metric.key === item.key ? "border-amber-700 bg-amber-50 text-amber-950" : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100")}
            >{item.label}</button>
          ))}
        </div>
      </div>
      <div role="status" className="mt-4 text-sm text-zinc-700">
        {top.length ? <p>Peak average for {dayLabel.toLowerCase()}: <strong className="font-semibold text-zinc-950">{hourWindow(top[0].hour)}</strong>. Top five hours below.</p> : <p>No {metric.label.toLowerCase()} in completed hours for this selection. Try another weekday or date range.</p>}
      </div>
      {top.length ? <TimingHourTable title={`${dayLabel}: highest average ${metric.label.toLowerCase()}`} metric={metric.label} rows={top} /> : null}
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer rounded-lg py-3 text-sm font-medium text-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">View all 24 hours</summary>
        <TimingHourTable title={`${dayLabel}: ${metric.label} for every hour`} metric={metric.label} rows={hours} />
      </details>
      <p className="mt-3 text-xs leading-5 text-zinc-600">Average = total ÷ completed occurrences of that hour in the selected period, including zero-activity hours. The current incomplete hour and future hours are excluded.</p>
    </section>
  );
}
