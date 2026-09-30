"use client";
import { useState } from "react";
import {
  chartColors,
  metricValue,
  type ValueFormat,
} from "@/lib/admin/dashboard-display";

export default function BreakdownChart({
  title,
  description,
  rows,
  format = "number",
  currency = "GBP",
  donut = false,
  emptyMessage = "No activity in this period.",
}: {
  title: string;
  description: string;
  rows: { label: string; value: number; color?: string }[];
  format?: ValueFormat;
  currency?: string;
  donut?: boolean;
  emptyMessage?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const total = rows.reduce((sum, row) => sum + Math.max(0, row.value), 0),
    max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  const selected = active !== null && active < rows.length ? active : null;
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-body text-base font-semibold">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
      {!rows.length || rows.every((row) => row.value === 0) ? (
        <p className="py-8 text-sm text-zinc-500">
          {emptyMessage}
        </p>
      ) : (
        <div
          className={`mt-4 ${donut ? "flex flex-wrap items-center gap-5" : ""}`}
        >
          {donut && total > 0 ? (
            <svg
              viewBox="0 0 160 160"
              role="img"
              aria-label={`${title}; values in the adjacent list`}
              className="mx-auto size-40 shrink-0"
            >
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="none"
                stroke="#f4f4f5"
                strokeWidth="20"
              />
              {rows.map((row, index) => {
                const share = Math.max(0, row.value) / total;
                const start =
                  rows
                    .slice(0, index)
                    .reduce((sum, item) => sum + Math.max(0, item.value), 0) /
                  total;
                return (
                  <circle
                    key={index}
                    cx="80"
                    cy="80"
                    r="60"
                    pathLength="100"
                    fill="none"
                    stroke={
                      row.color ?? chartColors[index % chartColors.length]
                    }
                    strokeWidth={selected === index ? 25 : 20}
                    strokeDasharray={`${share * 100} ${100 - share * 100}`}
                    strokeDashoffset={-start * 100}
                    transform="rotate(-90 80 80)"
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                  >
                    <title>
                      {row.label}: {metricValue(row.value, format, currency)}
                    </title>
                  </circle>
                );
              })}
              <text
                x="80"
                y="76"
                textAnchor="middle"
                fontSize="11"
                fill="#71717a"
              >
                {selected === null ? "Total" : "Selected"}
              </text>
              <text
                x="80"
                y="97"
                textAnchor="middle"
                fontSize="18"
                fontWeight="600"
                fill="#18181b"
              >
                {metricValue(
                  selected === null ? total : rows[selected!].value,
                  format,
                  currency,
                )}
              </text>
            </svg>
          ) : null}
          <ul className="min-w-0 flex-1 space-y-3">
            {rows.map((row, index) => (
              <li
                key={`${row.label}:${index}`}
                tabIndex={0}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                onPointerEnter={() => setActive(index)}
                onPointerLeave={() => setActive(null)}
                className="rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          row.color ?? chartColors[index % chartColors.length],
                      }}
                    />
                    <span className="break-words">{row.label}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {metricValue(row.value, format, currency)}
                  </span>
                </div>
                {!donut ? (
                  <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(Math.abs(row.value) / max) * 100}%`,
                        backgroundColor:
                          row.color ?? chartColors[index % chartColors.length],
                        opacity:
                          selected === null || selected === index ? 1 : 0.5,
                      }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
