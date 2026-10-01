export const STORE_TIME_ZONE = "Europe/London";
export type DashboardSource = "LIVE" | "LEGACY" | "ALL";
export type DashboardQuery = Record<string, string | string[] | undefined>;
export interface DashboardRange {
  timeZone?: string;
  preset: string;
  source: DashboardSource;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  days: number;
  warning?: string;
}
const dayMs = 86400000;
export function calendarDate(date: Date, timeZone = STORE_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * dayMs)
    .toISOString()
    .slice(0, 10);
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function customRangeError(
  start: string,
  end: string,
  today: string,
): string | undefined {
  if (!validDate(start) || !validDate(end)) return "Choose both dates.";
  if (start < "2000-01-01" || end > today)
    return "Choose dates from 1 Jan 2000 through today.";
  if (start > end) return "From must be on or before Through.";
  if ((Date.parse(end) - Date.parse(start)) / dayMs >= 366)
    return "Choose up to 366 days, or use All time.";
}
export function dashboardRange(
  query: DashboardQuery,
  now = new Date(),
  historyStart?: string,
  timeZone = STORE_TIME_ZONE,
): DashboardRange {
  const today = calendarDate(now, timeZone);
  const preset = [
    "today",
    "yesterday",
    "7",
    "30",
    "90",
    "all",
    "custom",
  ].includes(String(query.range))
    ? String(query.range)
    : "30";
  const source: DashboardSource =
    query.source === "LEGACY" || query.source === "ALL" ? query.source : "LIVE";
  let end = preset === "yesterday" ? shiftDate(today, -1) : today;
  let days = ["today", "yesterday"].includes(preset)
    ? 1
    : preset === "all"
      ? 1
      : preset === "custom"
        ? 30
        : Number(preset);
  let start = shiftDate(end, 1 - days),
    warning: string | undefined;
  if (preset === "custom") {
    if (
      typeof query.start === "string" &&
      typeof query.end === "string" &&
      !customRangeError(query.start, query.end, today)
    ) {
      start = query.start;
      end = query.end;
      days = Math.round((Date.parse(end) - Date.parse(start)) / dayMs) + 1;
    } else
      warning =
        "Choose valid dates up to today, with a maximum of 366 days. Showing the last 30 days instead.";
  }
  if (preset === "all") {
    start =
      validDate(historyStart) && historyStart <= today ? historyStart : today;
    days = Math.round((Date.parse(end) - Date.parse(start)) / dayMs) + 1;
  }
  return {
    timeZone,
    preset: warning ? "30" : preset,
    source,
    start,
    end,
    days,
    previousStart: preset === "all" ? start : shiftDate(start, -days),
    previousEnd: shiftDate(start, -1),
    warning,
  };
}
// Convert calendar midnight without depending on MySQL's optional time-zone tables.
export function dayStartUtc(date: string, timeZone = STORE_TIME_ZONE): Date {
  const target = Date.parse(`${date}T00:00:00Z`);
  let candidate = target;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    candidate += target - represented;
  }
  return new Date(candidate);
}
export function changePercent(value: number, previous: number): number | null {
  return previous > 0
    ? ((value - previous) / previous) * 100
    : value === previous
      ? 0
      : null;
}
export function dashboardMoney(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
export function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
