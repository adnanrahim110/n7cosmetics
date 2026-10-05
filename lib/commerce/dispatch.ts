import { z } from "zod";

const clockTime = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Use a time between 00:00 and 23:59.");
const closedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid date.");

export const dispatchScheduleSchema = z.object({
  enabled: z.boolean(),
  timeZone: z.string().trim().min(1).max(100).refine((value) => {
    try { new Intl.DateTimeFormat("en-GB", { timeZone: value }); return true; } catch { return false; }
  }, "Enter a valid IANA time zone, such as Europe/London."),
  workingDays: z.array(z.number().int().min(0).max(6)).min(1, "Select at least one working day.").max(7).transform((days) => [...new Set(days)].sort()),
  opensAt: clockTime,
  cutoffAt: clockTime,
  closedDates: z.array(closedDate).max(366).default([]),
}).refine((value) => value.opensAt < value.cutoffAt, { message: "The cutoff must be after opening time.", path: ["cutoffAt"] });

export type DispatchSchedule = z.infer<typeof dispatchScheduleSchema>;

export const defaultDispatchSchedule: DispatchSchedule = {
  enabled: true,
  timeZone: "Europe/London",
  workingDays: [1, 2, 3, 4, 5],
  opensAt: "09:00",
  cutoffAt: "17:00",
  closedDates: [],
};

export function readDispatchSchedule(value: unknown): DispatchSchedule | null {
  if (value === undefined || value === null) return defaultDispatchSchedule;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return null; }
  }
  const result = dispatchScheduleSchema.safeParse(value);
  return result.success ? result.data : null;
}

export interface DispatchStatus {
  title: "Dispatch Today" | "Dispatch Next Day";
  description: string;
  remainingMinutes: number | null;
}

export function formatDispatchTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, "0")}` : ""}${hour >= 12 ? "pm" : "am"}`;
}

export function getDispatchStatus(schedule: DispatchSchedule, now: Date): DispatchStatus | null {
  if (!schedule.enabled) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: schedule.timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const read = (name: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === name)?.value);
  const localDate = new Date(Date.UTC(read("year"), read("month") - 1, read("day")));
  const secondsNow = read("hour") * 3600 + read("minute") * 60 + read("second");
  const secondsAt = (time: string) => { const [hours, minutes] = time.split(":").map(Number); return hours * 3600 + minutes * 60; };
  const isWorkingDate = (date: Date) => schedule.workingDays.includes(date.getUTCDay()) && !schedule.closedDates.includes(date.toISOString().slice(0, 10));

  if (isWorkingDate(localDate) && secondsNow < secondsAt(schedule.cutoffAt)) {
    const remainingMinutes = Math.floor((secondsAt(schedule.cutoffAt) - secondsNow) / 60);
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    const remaining = remainingMinutes > 0 ? `${hours}h ${minutes}m` : "less than a minute";
    return { title: "Dispatch Today", description: `Order within ${remaining} for same-day dispatch.`, remainingMinutes };
  }

  for (let offset = 1; offset <= 373; offset += 1) {
    const next = new Date(localDate);
    next.setUTCDate(next.getUTCDate() + offset);
    if (!isWorkingDate(next)) continue;
    const label = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(next);
    return { title: "Dispatch Next Day", description: offset === 1 ? "Order now for dispatch tomorrow." : `Order now for dispatch on ${label}.`, remainingMinutes: null };
  }
  return { title: "Dispatch Next Day", description: "Contact us to confirm the next dispatch day.", remainingMinutes: null };
}
