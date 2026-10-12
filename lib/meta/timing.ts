import { createHash } from "node:crypto";
import { MetaApiError, metaRequest } from "./api";
import { fetchInsightRows } from "./insights";
import { getMetaSettings, metaToken, reportingReady, type MetaSettings } from "./settings";
import { validDate, type DashboardRange } from "../admin/dashboard-dates";
import { timingCutoff, timingPattern, timingWeekday, type TimingPattern } from "../admin/dashboard-timing";

export interface MetaTimingReport {
  status: "ready" | "unconfigured" | "paused" | "error";
  message?: string;
  timing?: TimingPattern;
}
const hourlyBreakdown = "hourly_stats_aggregated_by_advertiser_time_zone";

export function hourlyInsightsPath(account: string, start: string, end: string): string {
  return `act_${account}/insights?${new URLSearchParams({
    fields: "date_start,date_stop,impressions,inline_link_clicks",
    level: "account", time_range: JSON.stringify({ since: start, until: end }),
    time_increment: "1", breakdowns: hourlyBreakdown, limit: "1000",
  })}`;
}
function metric(value: unknown): number {
  if ((typeof value !== "string" && typeof value !== "number") || value === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
    throw new Error("Invalid Meta hourly metric");
  }
  return Number(value);
}
export function parseMetaTiming(rows: Record<string, unknown>[], range: DashboardRange, timeZone: string, now = new Date()): TimingPattern {
  const timing = timingPattern({ ...range, timeZone }, ["linkClicks", "impressions"], now);
  const { today, currentHour } = timingCutoff(timeZone, now);
  const seen = new Set<string>();
  for (const row of rows) {
    const date = row.date_start;
    const window = row[hourlyBreakdown];
    if (!validDate(date) || date < range.start || date > range.end || row.date_stop !== date || typeof window !== "string") {
      throw new Error("Invalid Meta hourly dates");
    }
    const match = /^(\d{2}):00:00 - (\d{2}):59:59$/.exec(window);
    if (!match || match[1] !== match[2] || Number(match[1]) > 23 || seen.has(`${date}:${match[1]}`)) {
      throw new Error("Invalid Meta hourly breakdown");
    }
    seen.add(`${date}:${match[1]}`);
    const clicks = metric(row.inline_link_clicks ?? "0");
    const impressions = metric(row.impressions);
    const hour = Number(match[1]);
    if (!(date < today || (date === today && hour < currentHour))) continue;
    const cell = timing.cells[timingWeekday(date) * 24 + hour];
    if (!cell.samples) throw new Error("Meta returned an unavailable clock hour");
    cell.values.linkClicks += clicks;
    cell.values.impressions += impressions;
  }
  return timing;
}
export async function fetchMetaTiming(settings: MetaSettings, range: DashboardRange, request = metaRequest, now = new Date()): Promise<MetaTimingReport> {
  if (!settings.reportingEnabled) return { status: "paused", message: "Meta reporting is paused in connection settings." };
  if (!reportingReady(settings)) return { status: "unconfigured", message: "Connect a Meta ad account and reporting token to see average hourly ad traffic." };
  try {
    const token = metaToken(settings, "reporting");
    const account = await request(`act_${settings.adAccountId}?fields=timezone_name`, token);
    if (typeof account.timezone_name !== "string") throw new Error("Missing account time zone");
    const rows = await fetchInsightRows(hourlyInsightsPath(settings.adAccountId, range.start, range.end), token, request);
    return { status: "ready", timing: parseMetaTiming(rows, range, account.timezone_name, now) };
  } catch (error) {
    return { status: "error", message: error instanceof MetaApiError ? error.message : "Meta's hourly report is unavailable for this period. Refresh to retry, or choose a shorter date range." };
  }
}
const reports = new Map<string, { expires: number; result: Promise<MetaTimingReport> }>();
export async function getMetaTiming(range: DashboardRange): Promise<MetaTimingReport> {
  try {
    const settings = await getMetaSettings();
    const key = createHash("sha256").update(`${settings.revision}:${range.start}:${range.end}`).digest("hex");
    const existing = reports.get(key);
    if (existing && existing.expires > Date.now()) return existing.result;
    if (reports.size >= 32) reports.delete(reports.keys().next().value!);
    const result = fetchMetaTiming(settings, range);
    reports.set(key, { expires: Date.now() + 60000, result });
    return await result;
  } catch {
    return { status: "error", message: "Meta connection settings could not be loaded. Refresh to retry." };
  }
}
