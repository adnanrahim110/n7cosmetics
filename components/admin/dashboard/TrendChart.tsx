"use client";
import { useId, useState } from "react";
import {
  metricValue,
  type TrendPoint,
  type ValueFormat,
} from "@/lib/admin/dashboard-display";
import { shortDate } from "@/lib/admin/dashboard-dates";

export default function TrendChart({
  points,
  previous = [],
  color = "#2563eb",
  label,
  format = "number",
  currency = "GBP",
  compact = false,
}: {
  points: TrendPoint[];
  previous?: TrendPoint[];
  color?: string;
  label: string;
  format?: ValueFormat;
  currency?: string;
  compact?: boolean;
}) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const values = [...points, ...previous].flatMap((point) =>
    point.value === null ? [] : [point.value],
  );
  if (!points.length || !values.length)
    return (
      <p className="py-4 text-xs text-zinc-500">Daily history unavailable.</p>
    );
  const low = Math.min(0, ...values),
    high = Math.max(1, ...values),
    span = high - low;
  const width = 600,
    height = compact ? 100 : 240,
    left = compact ? 8 : 72,
    right = 590,
    top = 12,
    bottom = height - (compact ? 8 : 28);
  const x = (i: number) =>
    left +
    (points.length === 1 ? 0.5 : i / (points.length - 1)) * (right - left);
  const y = (value: number) => bottom - ((value - low) / span) * (bottom - top);
  const path = (rows: TrendPoint[]) =>
    rows
      .map((point, index) =>
        point.value === null
          ? ""
          : `${index === 0 || rows[index - 1].value === null ? "M" : "L"}${x(index)},${y(point.value)}`,
      )
      .join(" ");
  const selected = active === null ? null : Math.min(active, points.length - 1);
  const describe = (value: number | null) =>
    metricValue(value, format, currency);
  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={`w-full touch-pan-y rounded-md outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-600 ${compact ? "h-16" : "h-60"}`}
        role="slider"
        tabIndex={0}
        aria-label={`${label} by day; use left and right arrows to inspect dates`}
        aria-valuemin={1}
        aria-valuemax={points.length}
        aria-valuenow={(selected ?? points.length - 1) + 1}
        aria-valuetext={`${shortDate(points[selected ?? points.length - 1].date)}: ${describe(points[selected ?? points.length - 1].value)}`}
        onFocus={() => setActive(points.length - 1)}
        onBlur={() => setActive(null)}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const px = ((event.clientX - bounds.left) / bounds.width) * width;
          setActive(
            Math.max(
              0,
              Math.min(
                points.length - 1,
                Math.round(
                  ((px - left) / (right - left)) * (points.length - 1),
                ),
              ),
            ),
          );
        }}
        onPointerLeave={() => setActive(null)}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          setActive(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? points.length - 1
                : Math.max(
                    0,
                    Math.min(
                      points.length - 1,
                      (selected ?? points.length - 1) +
                        (event.key === "ArrowLeft" ? -1 : 1),
                    ),
                  ),
          );
        }}
      >
        <title>{label}</title>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {!compact
          ? [0, 1, 2, 3].map((step) => {
              const value = low + (span * step) / 3;
              return (
                <g key={step}>
                  <line
                    x1={left}
                    x2={right}
                    y1={y(value)}
                    y2={y(value)}
                    stroke="#e4e4e7"
                    strokeDasharray="3 4"
                  />
                  <text
                    x={left - 8}
                    y={y(value) + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#71717a"
                  >
                    {describe(value)}
                  </text>
                </g>
              );
            })
          : null}
        {points.every((point) => point.value !== null) ? (
          <path
            d={`${path(points)} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`}
            fill={`url(#${id})`}
          />
        ) : null}
        {previous.length ? (
          <path
            d={path(previous)}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <path
          d={path(points)}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.length === 1 && points[0].value !== null ? (
          <circle cx={x(0)} cy={y(points[0].value)} r="3" fill={color} />
        ) : null}
        {selected !== null ? (
          <g>
            <line
              x1={x(selected)}
              x2={x(selected)}
              y1={top}
              y2={bottom}
              stroke={color}
              strokeOpacity="0.35"
            />
            {points[selected].value !== null ? (
              <circle
                cx={x(selected)}
                cy={y(points[selected].value!)}
                r="3.5"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
            ) : null}
          </g>
        ) : null}
        {!compact ? (
          <>
            <text x={left} y={height - 6} fontSize="10" fill="#71717a">
              {shortDate(points[0].date)}
            </text>
            <text
              x={right}
              y={height - 6}
              textAnchor="end"
              fontSize="10"
              fill="#71717a"
            >
              {shortDate(points.at(-1)!.date)}
            </text>
          </>
        ) : null}
      </svg>
      <p
        className={`min-h-5 text-xs tabular-nums ${compact ? "text-zinc-500" : "mt-2 text-zinc-600"}`}
        aria-live="polite"
      >
        {selected === null ? (
          compact ? (
            "Hover or focus to inspect"
          ) : (
            `Daily ${label.toLowerCase()}${previous.length ? " · dashed line: previous period" : ""}`
          )
        ) : (
          <>
            {shortDate(points[selected].date)} ·{" "}
            {describe(points[selected].value)}
            {previous[selected]
              ? ` · Previous: ${describe(previous[selected].value)}`
              : ""}
          </>
        )}
      </p>
      {!compact ? (
        <details className="mt-3 text-xs text-zinc-500">
          <summary className="cursor-pointer font-medium">
            View daily data
          </summary>
          <div className="mt-2 max-h-64 overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Date</th>
                  <th>{label}</th>
                  {previous.length ? <th>Previous period</th> : null}
                </tr>
              </thead>
              <tbody>
                {points.map((point, index) => (
                  <tr key={point.date} className="border-t border-zinc-100">
                    <td className="py-2">{shortDate(point.date)}</td>
                    <td>{describe(point.value)}</td>
                    {previous.length ? (
                      <td>{describe(previous[index]?.value ?? null)}</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
