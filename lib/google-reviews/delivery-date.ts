import { z } from "zod";
import { dispatchScheduleSchema, type DispatchSchedule } from "../commerce/dispatch";

const deliverySnapshot = z.object({ estimatedDaysMax: z.number().int().min(0).max(365).nullable().optional() });

// Use the paid order's selected service, not a subsequently edited shipping
// method. Count working days from dispatch; never move the estimate on refresh.
export function googleReviewDeliveryDate(paidAt: Date, snapshot: unknown, schedule: DispatchSchedule, fallbackDays: number): string | null {
  if (!Number.isFinite(paidAt.getTime()) || !dispatchScheduleSchema.safeParse(schedule).success) return null;
  if (typeof snapshot === "string") {
    try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; }
  }
  const days = deliverySnapshot.safeParse(snapshot).data?.estimatedDaysMax ?? fallbackDays;
  if (!Number.isInteger(days) || days < 0 || days > 365) return null;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: schedule.timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(paidAt);
  const value = (name: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === name)?.value);
  const date = new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  const [hour, minute] = schedule.cutoffAt.split(":").map(Number);
  const working = () => schedule.workingDays.includes(date.getUTCDay()) && !schedule.closedDates.includes(date.toISOString().slice(0, 10));
  const advance = () => date.setUTCDate(date.getUTCDate() + 1);
  if (value("hour") * 60 + value("minute") >= hour * 60 + minute) advance();
  let remaining = days, dispatched = false;
  for (let count = 0; count < 3000; count++, advance()) {
    if (!working()) continue;
    if (dispatched) remaining--;
    dispatched = true;
    if (!remaining) return date.toISOString().slice(0, 10);
  }
  return null;
}
