import { calendarDate, dayStartUtc, shiftDate, type DashboardRange } from "./dashboard-dates";

export const timingWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export interface TimingCell {
  weekday: number;
  hour: number;
  samples: number;
  values: Record<string, number>;
}
export interface TimingPattern {
  timeZone: string;
  cells: TimingCell[];
}
export interface TimingHour {
  hour: number;
  total: number;
  samples: number;
  average: number | null;
}
export function timingHours(pattern: TimingPattern, weekday: number | null, metric: string): TimingHour[] {
  return Array.from({ length: 24 }, (_, hour) => {
    const cells = pattern.cells.filter((cell) => cell.hour === hour && (weekday === null || cell.weekday === weekday));
    const total = cells.reduce((sum, cell) => sum + (cell.values[metric] ?? 0), 0);
    const samples = cells.reduce((sum, cell) => sum + cell.samples, 0);
    return { hour, total, samples, average: samples ? total / samples : null };
  });
}
export function timingWeekday(date: string): number {
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
}
export function timingCutoff(timeZone: string, now: Date) {
  return {
    today: calendarDate(now, timeZone),
    currentHour: Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(now)),
  };
}
export function timingPattern(range: DashboardRange, keys: string[], now = new Date()): TimingPattern {
  const timeZone = range.timeZone ?? "Europe/London";
  const cells = Array.from({ length: 7 * 24 }, (_, index) => ({
    weekday: Math.floor(index / 24), hour: index % 24, samples: 0,
    values: Object.fromEntries(keys.map((key) => [key, 0])),
  }));
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const { today, currentHour } = timingCutoff(timeZone, now);
  const until = Math.min(dayStartUtc(shiftDate(range.end, 1), timeZone).getTime(), now.getTime());
  for (let instant = dayStartUtc(range.start, timeZone).getTime(); instant + 3600000 <= until; instant += 3600000) {
    const parts = Object.fromEntries(format.formatToParts(new Date(instant)).map((part) => [part.type, part.value]));
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    const hour = Number(parts.hour);
    // Omit the entire current clock hour, including its repeated occurrence at autumn DST.
    if (date === today && hour >= currentHour) continue;
    cells[timingWeekday(date) * 24 + hour].samples++;
  }
  return { timeZone, cells };
}
