"use client";
import { useState } from "react";
import type { TrendPoint, ValueFormat } from "@/lib/admin/dashboard-display";
import CustomSelect from "@/components/admin/CustomSelect";
import TrendChart from "./TrendChart";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: TrendPoint[];
  previous?: TrendPoint[];
  format?: ValueFormat;
  currency?: string;
}
export default function TimeSeriesPanel({
  title,
  description,
  series,
}: {
  title: string;
  description: string;
  series: ChartSeries[];
}) {
  const [key, setKey] = useState(series[0]?.key);
  const active = series.find((item) => item.key === key) ?? series[0];
  const chart = active
    ? {
        label: active.label,
        color: active.color,
        points: active.points,
        previous: active.previous,
        format: active.format,
        currency: active.currency,
      }
    : null;
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-body text-base font-semibold">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
        </div>
        <CustomSelect
          label="Metric"
          className="min-w-48 max-w-full"
          value={active?.key ?? ""}
          disabled={!series.length}
          onChange={([value]) => setKey(value)}
          options={series.map(item => ({ value: item.key, label: item.label }))}
          searchable={false}
        />
      </div>
      {active && chart ? (
        <TrendChart key={active.key} {...chart} />
      ) : (
        <p className="text-sm text-zinc-500">Daily history unavailable.</p>
      )}
    </section>
  );
}
