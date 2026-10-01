import { createHash } from "node:crypto";
import { MetaApiError, metaRequest } from "./api";
import {
  capiReady,
  getMetaSettings,
  metaToken,
  pixelReady,
  reportingReady,
  type MetaSettings,
} from "./settings";
import {
  shiftDate,
  validDate,
  dashboardRange,
  type DashboardQuery,
  type DashboardRange,
} from "../admin/dashboard-dates";

export interface AdMetrics {
  spend: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  purchases: number;
  purchaseValue: number;
  roas: number | null;
  linkCtr: number | null;
  costPerPurchase: number | null;
  costPerClick: number | null;
  cpm: number | null;
  frequency: number | null;
  landingPageViews: number;
  addsToCart: number;
  checkouts: number;
}
export interface AdDay extends AdMetrics {
  date: string;
}
export interface AdBreakdown extends AdMetrics {
  id: string;
  name: string;
}
export interface MetaDetails {
  days?: AdDay[];
  previousDays?: AdDay[];
  campaigns?: AdBreakdown[];
  platforms?: AdBreakdown[];
  devices?: AdBreakdown[];
  errors: string[];
}
export type MetaOverview = {
  status: "ready" | "unconfigured" | "paused" | "error";
  message?: string;
  accountName?: string;
  currency?: string;
  timezone?: string;
  current?: AdMetrics;
  previous?: AdMetrics;
  fetchedAt?: string;
  pixelConfigured: boolean;
  serverConfigured: boolean;
  testMode: boolean;
  details?: MetaDetails;
  coverage?: { start: string; end: string };
  period?: DashboardRange;
};
function numeric(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    value === "" ||
    !Number.isFinite(Number(value)) ||
    Number(value) < 0
  )
    throw new Error("Invalid Meta metric");
  return Number(value);
}
function validateReportDates(payload: Record<string, unknown>, start: string, end: string): void {
  if (!Array.isArray(payload.data)) throw new Error("Invalid Meta report");
  for (const row of payload.data) {
    if ((row.date_start !== undefined && (!validDate(row.date_start) || row.date_start < start || row.date_start > end)) ||
        (row.date_stop !== undefined && (!validDate(row.date_stop) || row.date_stop < start || row.date_stop > end)) ||
        (row.date_start && row.date_stop && row.date_start > row.date_stop)) throw new Error("Meta returned dates outside the applied filter");
  }
}
function actionValue(values: unknown, name: string): number {
  if (values === undefined) return 0;
  if (!Array.isArray(values)) throw new Error("Invalid Meta actions");
  // 'purchase', 'omni_purchase' and this website action overlap. Never add them together.
  const action = values.find((item) => item?.action_type === name);
  return numeric(action?.value);
}
export function parseAdMetrics(payload: Record<string, unknown>): AdMetrics {
  if (
    !Array.isArray(payload.data) ||
    payload.data.length > 1 ||
    (payload.data[0] !== undefined &&
      (!payload.data[0] || typeof payload.data[0] !== "object"))
  )
    throw new Error("Invalid Meta overview response");
  const row = payload.data[0] ?? {};
  const spend = numeric(row.spend),
    impressions = numeric(row.impressions),
    linkClicks = numeric(row.inline_link_clicks);
  const purchases = actionValue(
      row.actions,
      "offsite_conversion.fb_pixel_purchase",
    ),
    purchaseValue = actionValue(
      row.action_values,
      "offsite_conversion.fb_pixel_purchase",
    );
  const reach = numeric(row.reach);
  return {
    spend,
    impressions,
    linkClicks,
    reach,
    purchases,
    purchaseValue,
    roas: spend > 0 ? purchaseValue / spend : null,
    linkCtr: impressions > 0 ? (linkClicks / impressions) * 100 : null,
    costPerPurchase: purchases > 0 ? spend / purchases : null,
    costPerClick: linkClicks > 0 ? spend / linkClicks : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    frequency: reach > 0 ? impressions / reach : null,
    landingPageViews: actionValue(row.actions, "landing_page_view"),
    addsToCart: actionValue(
      row.actions,
      "offsite_conversion.fb_pixel_add_to_cart",
    ),
    checkouts: actionValue(
      row.actions,
      "offsite_conversion.fb_pixel_initiate_checkout",
    ),
  };
}
export function insightsPath(
  accountId: string,
  start: string,
  end: string,
  allTime = false,
): string {
  const query = new URLSearchParams({
    fields: "spend,impressions,reach,inline_link_clicks,actions,action_values",
    level: "account",
    time_range: JSON.stringify({ since: start, until: end }),
    action_report_time: "conversion",
    use_unified_attribution_setting: "true",
    limit: "1",
  });
  if (allTime) {
    query.delete("time_range");
    query.set("date_preset", "maximum");
    query.set("fields", `${query.get("fields")},date_start,date_stop`);
  }
  return `act_${accountId}/insights?${query}`;
}
// Every widget uses the same applied period and the account's calendar, including presets.
export function metaReportingRange(range: DashboardRange, timeZone: string, now = new Date()): DashboardRange {
  // Keep the exact period already applied by the controls, even if midnight passes during fetch.
  if (range.timeZone === timeZone) return range;
  return dashboardRange({ range: range.preset, source: range.source, start: range.start, end: range.end }, now, range.preset === "all" ? range.start : undefined, timeZone);
}
const accounts = new Map<string, { expires: number; value: Promise<Record<string, unknown>> }>();
async function metaAccount(settings: MetaSettings): Promise<Record<string, unknown>> {
  const key = createHash("sha256").update(`${settings.adAccountId}:${settings.reportingTokenEncrypted}`).digest("hex");
  const cached = accounts.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  if (accounts.size >= 32) accounts.delete(accounts.keys().next().value!);
  const value = metaRequest(`act_${settings.adAccountId}?fields=name,currency,timezone_name`, metaToken(settings, "reporting"));
  accounts.set(key, { expires: Date.now() + 60000, value });
  try { return await value; } catch (error) { accounts.delete(key); throw error; }
}
export async function getMetaDashboardRange(query: DashboardQuery, now = new Date()): Promise<DashboardRange> {
  const fallback = dashboardRange(query, now);
  try {
    const settings = await getMetaSettings();
    if (!reportingReady(settings)) return fallback;
    const account = await metaAccount(settings);
    if (typeof account.timezone_name !== "string") throw new Error("Missing account time zone");
    return dashboardRange(query, now, undefined, account.timezone_name);
  } catch {
    return { ...fallback, warning: "Meta's account time zone could not be loaded. Refresh to retry; date controls currently use UK time." };
  }
}
export function parseAdCoverage(payload: Record<string, unknown>) {
  if (!Array.isArray(payload.data) || payload.data.length > 1)
    throw new Error("Invalid Meta coverage");
  if (!payload.data.length) return undefined;
  const row = payload.data[0];
  if (
    !row ||
    !validDate(row.date_start) ||
    !validDate(row.date_stop) ||
    row.date_start > row.date_stop ||
    row.date_start < "2000-01-01" ||
    Date.parse(row.date_stop) - Date.parse(row.date_start) > 50 * 366 * 86400000
  )
    throw new Error("Invalid Meta coverage");
  return { start: row.date_start as string, end: row.date_stop as string };
}
type DetailKind = "daily" | "campaigns" | "platforms" | "devices";
export function detailInsightsPath(
  account: string,
  start: string,
  end: string,
  kind: DetailKind,
): string {
  const [path, search] = insightsPath(account, start, end).split("?");
  const query = new URLSearchParams(search);
  query.set("limit", "500");
  if (kind === "daily") query.set("time_increment", "1");
  if (kind === "campaigns") {
    query.set("level", "campaign");
    query.set("fields", `${query.get("fields")},campaign_id,campaign_name`);
  }
  if (kind === "platforms" || kind === "devices") {
    query.set(
      "breakdowns",
      kind === "platforms" ? "publisher_platform" : "impression_device",
    );
    // Delivery-only breakdowns avoid unsupported combinations with conversion attribution.
    query.set("fields", "spend,impressions,reach,inline_link_clicks");
  }
  return `${path}?${query}`;
}
export async function fetchInsightRows(
  path: string,
  token: string,
  request = metaRequest,
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let next = path;
  for (let page = 0; page < 10; page++) {
    const response = await request(next, token);
    if (
      !Array.isArray(response.data) ||
      response.data.some(
        (row) => !row || typeof row !== "object" || Array.isArray(row),
      )
    )
      throw new Error("Invalid Meta detail response");
    rows.push(...response.data);
    const paging = response.paging as
      | { next?: unknown; cursors?: { after?: unknown } }
      | undefined;
    if (!paging?.next) return rows;
    const after = paging.cursors?.after;
    if (
      typeof after !== "string" ||
      !after ||
      after.length > 2048 ||
      seen.has(after)
    )
      throw new Error("Incomplete Meta pagination");
    seen.add(after);
    const [base, search] = path.split("?");
    const query = new URLSearchParams(search);
    query.set("after", after);
    // Never follow an upstream URL carrying a token or pointing to another host.
    next = `${base}?${query}`;
  }
  throw new Error("Meta report exceeds the supported detail size");
}
export function parseAdDays(
  rows: Record<string, unknown>[],
  start: string,
  end: string,
): AdDay[] {
  const map = new Map<string, AdMetrics>();
  for (const row of rows) {
    const date = row.date_start;
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date < start ||
      date > end ||
      map.has(date) ||
      (row.date_stop && row.date_stop !== date)
    )
      throw new Error("Invalid Meta daily dates");
    map.set(date, parseAdMetrics({ data: [row] }));
  }
  const result: AdDay[] = [];
  for (let date = start; date <= end; date = shiftDate(date, 1))
    result.push({ date, ...(map.get(date) ?? parseAdMetrics({ data: [] })) });
  return result;
}
async function fetchDetails(
  account: string,
  token: string,
  range: DashboardRange,
  request: typeof metaRequest,
): Promise<MetaDetails> {
  const jobs = (
    [
      ["days", "daily", range.start, range.end],
      ["previousDays", "daily", range.previousStart, range.previousEnd],
      ["campaigns", "campaigns", range.start, range.end],
      ["platforms", "platforms", range.start, range.end],
      ["devices", "devices", range.start, range.end],
    ] as const
  ).filter(([key]) => range.preset !== "all" || key !== "previousDays");
  const result: MetaDetails = { errors: [] };
  const responses = await Promise.allSettled(
    jobs.map(async ([key, kind, start, end]) => {
      const rows = await fetchInsightRows(
        detailInsightsPath(account, start, end, kind),
        token,
        request,
      );
      validateReportDates({ data: rows }, start, end);
      if (kind === "daily") return { key, days: parseAdDays(rows, start, end) };
      const field =
        kind === "campaigns"
          ? "campaign_id"
          : kind === "platforms"
            ? "publisher_platform"
            : "impression_device";
      const identifiers = new Set<string>();
      const data = rows.map((row) => {
        const id = row[field];
        if (typeof id !== "string" || !id || identifiers.has(id))
          throw new Error("Invalid Meta breakdown");
        identifiers.add(id);
        return {
          id,
          name:
            kind === "campaigns" && typeof row.campaign_name === "string"
              ? row.campaign_name
              : id.replaceAll("_", " "),
          ...parseAdMetrics({ data: [row] }),
        };
      });
      return { key, data: data.sort((a, b) => b.spend - a.spend) };
    }),
  );
  responses.forEach((response, index) => {
    const key = jobs[index][0];
    if (response.status === "rejected") {
      result.errors.push(key);
      return;
    }
    if (key === "days" || key === "previousDays")
      result[key] = response.value.days;
    else result[key] = response.value.data;
  });
  return result;
}
export async function fetchMetaOverview(
  settings: MetaSettings,
  range: DashboardRange,
  request = metaRequest,
  now = new Date(),
): Promise<MetaOverview> {
  const state = {
    pixelConfigured: pixelReady(settings),
    serverConfigured: capiReady(settings),
    testMode: Boolean(settings.testEventCode),
  };
  if (!settings.reportingEnabled)
    return {
      ...state,
      status: "paused",
      message: "Advertising reporting is paused in Meta settings.",
    };
  if (!reportingReady(settings))
    return {
      ...state,
      status: "unconfigured",
      message:
        "Add an ad account ID and reporting token in Meta settings to see advertising performance.",
    };
  try {
    const token = metaToken(settings, "reporting");
    const account = request === metaRequest ? await metaAccount(settings) : await request(`act_${settings.adAccountId}?fields=name,currency,timezone_name`, token);
    if (typeof account.timezone_name !== "string") throw new Error("Missing account time zone");
    const period = metaReportingRange(range, account.timezone_name, now);
    const allTime = period.preset === "all";
    const [current, previous] = await Promise.all([
      request(
        insightsPath(settings.adAccountId, period.start, period.end, allTime),
        token,
      ),
      allTime
        ? Promise.resolve(undefined)
        : request(
            insightsPath(
              settings.adAccountId,
              period.previousStart,
              period.previousEnd,
            ),
            token,
          ),
    ]);
    if (
      typeof account.currency !== "string" ||
      !/^[A-Z]{3}$/.test(account.currency) ||
      typeof account.timezone_name !== "string" ||
      !account.timezone_name
    )
      throw new Error("Incomplete Meta account details");
    new Intl.DateTimeFormat("en-GB", { timeZone: account.timezone_name });
    if (!allTime) validateReportDates(current, period.start, period.end);
    if (previous) validateReportDates(previous, period.previousStart, period.previousEnd);
    const currentMetrics = parseAdMetrics(current),
      previousMetrics = previous ? parseAdMetrics(previous) : undefined;
    const coverage = allTime ? parseAdCoverage(current) : undefined;
    if (coverage && coverage.end > period.end) throw new Error("Meta returned future report dates");
    const reportedPeriod = coverage ? { ...period, ...coverage, days: Math.round((Date.parse(coverage.end) - Date.parse(coverage.start)) / 86400000) + 1 } : period;
    const details: MetaDetails =
      allTime && !coverage
        ? { days: [], campaigns: [], platforms: [], devices: [], errors: [] }
        : await fetchDetails(
            settings.adAccountId,
            token,
            reportedPeriod,
            request,
          );
    return {
      ...state,
      status: "ready",
      accountName:
        typeof account.name === "string" ? account.name : "Meta ad account",
      currency: account.currency,
      timezone: account.timezone_name,
      current: currentMetrics,
      previous: previousMetrics,
      details,
      coverage,
      period: reportedPeriod,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...state,
      status: "error",
      message:
        error instanceof MetaApiError
          ? error.retryable
            ? "Meta reporting is temporarily unavailable. Try again in a few minutes."
            : error.message
          : "Meta reporting could not be loaded. Check the saved connection and try again.",
    };
  }
}
// Process-local, bounded and keyed by configuration revision. Only aggregated reports
// are cached; tokens, customer identifiers and public responses are never cached here.
const reports = new Map<
  string,
  { expires: number; result: Promise<MetaOverview> }
>();
export async function getMetaOverview(
  range: DashboardRange,
): Promise<MetaOverview> {
  const settings = await getMetaSettings();
  const key = createHash("sha256")
    .update(
      [
        settings.revision,
        range.preset,
        range.start,
        range.end,
        range.previousStart,
        range.previousEnd,
        range.timeZone ?? "Europe/London",
      ].join(":"),
    )
    .digest("hex");
  const existing = reports.get(key);
  if (existing && existing.expires > Date.now()) return existing.result;
  if (reports.size >= 32) reports.delete(reports.keys().next().value!);
  const entry = {
    expires: Date.now() + 60000,
    result: fetchMetaOverview(settings, range),
  };
  reports.set(key, entry);
  const result = await entry.result;
  if (result.status === "error") entry.expires = Date.now() + 60000;
  return result;
}
