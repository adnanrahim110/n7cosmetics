import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { changePercent } from "@/lib/admin/dashboard-dates";
import {
  metricValue,
  type TrendPoint,
  type ValueFormat,
} from "@/lib/admin/dashboard-display";
import TrendChart from "./TrendChart";

export default function MetricCard({
  label,
  value,
  current,
  previous,
  note,
  points,
  previousPoints,
  color = "#2563eb",
  format = "number",
  currency = "GBP",
  direction = "up",
  comparison = true,
}: {
  label: string;
  value?: string;
  current: number | null;
  previous: number | null;
  note: string;
  points?: TrendPoint[];
  previousPoints?: TrendPoint[];
  color?: string;
  format?: ValueFormat;
  currency?: string;
  direction?: "up" | "down" | "neutral";
  comparison?: boolean;
  accent?: boolean;
}) {
  const change =
    !comparison || current === null || previous === null
      ? null
      : changePercent(current, previous);
  const Icon =
    change === null || change === 0
      ? Minus
      : change > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const favorable =
    change !== null && (direction === "up" ? change > 0 : change < 0);
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <span
          className="mt-1.5 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight tabular-nums">
        {value ?? metricValue(current, format, currency)}
      </p>
      <div
        className={`mt-2 flex items-center gap-1 text-xs ${change === null || change === 0 || direction === "neutral" ? "text-zinc-500" : favorable ? "text-emerald-700" : "text-rose-700"}`}
      >
        <Icon size={14} aria-hidden="true" />
        <span>
          {!comparison
            ? "All time · no previous period"
            : change === null
              ? "No percentage comparison"
              : `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous period`}
        </span>
      </div>
      {points ? (
        <div className="mt-3">
          <TrendChart
            compact
            label={label}
            points={points}
            previous={previousPoints}
            color={color}
            format={format}
            currency={currency}
          />
        </div>
      ) : null}
      <p className="mt-2 text-xs leading-5 text-zinc-400">{note}</p>
    </article>
  );
}
