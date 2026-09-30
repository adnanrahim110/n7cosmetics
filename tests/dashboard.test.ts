import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarDate,
  customRangeError,
  changePercent,
  dashboardRange,
  dayStartUtc,
  shiftDate,
} from "../lib/admin/dashboard-dates";
import { emptyStoreDay, storeTotals } from "../lib/admin/dashboard";
import {
  detailInsightsPath,
  fetchInsightRows,
  insightsPath,
  parseAdDays,
  parseAdMetrics,
  parseAdCoverage,
} from "../lib/meta/insights";
import { reportDays } from "../lib/admin/dashboard-reports";
import { dashboardTab, metricValue } from "../lib/admin/dashboard-display";

test("Dashboard uses the UK date and an equal preceding calendar period", () => {
  const range = dashboardRange(
    { range: "7", source: "ALL" },
    new Date("2026-08-31T23:30:00Z"),
  );
  assert.equal(range.end, "2026-09-01");
  assert.equal(range.start, "2026-08-26");
  assert.equal(range.previousStart, "2026-08-19");
  assert.equal(range.previousEnd, "2026-08-25");
  assert.equal(range.days, 7);
  assert.equal(shiftDate("2024-03-01", -1), "2024-02-29");
});
test("All time uses actual history without a custom-date cap or previous-period buckets", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  const range = dashboardRange(
    { range: "all", source: "LEGACY" },
    now,
    "2020-01-01",
  );
  assert.equal(range.preset, "all");
  assert.equal(range.start, "2020-01-01");
  assert.equal(range.end, "2026-09-30");
  assert.ok(range.days > 366);
  assert.equal(range.previousStart, range.start);
  const days = reportDays(range, ["orders"]);
  assert.equal(days.length, range.days);
  assert.equal(days.at(-1)?.date, range.end);
  assert.equal(dashboardRange({ range: "all" }, now).days, 1);
});
test("Automatic custom dates wait for complete, ordered, valid input", () => {
  const today = "2026-09-30";
  for (const [start, end] of [
    ["", today],
    ["2026-02-30", today],
    [today, "2026-09-01"],
    [today, "2026-10-01"],
    ["2020-01-01", today],
  ])
    assert.ok(customRangeError(start, end, today));
  assert.equal(customRangeError("2024-01-01", "2024-12-31", today), undefined);
});
test("All-time Meta requests use maximum history and validate its returned coverage", () => {
  const params = new URL(
    insightsPath("123456789", "2026-09-01", "2026-09-30", true),
    "https://graph.facebook.com/",
  ).searchParams;
  assert.equal(params.get("date_preset"), "maximum");
  assert.equal(params.has("time_range"), false);
  assert.ok(params.get("fields")?.includes("date_start,date_stop"));
  assert.deepEqual(
    parseAdCoverage({
      data: [{ date_start: "2023-09-01", date_stop: "2026-09-30" }],
    }),
    { start: "2023-09-01", end: "2026-09-30" },
  );
  assert.equal(parseAdCoverage({ data: [] }), undefined);
  for (const row of [
    {},
    { date_start: "2026-02-30", date_stop: "2026-09-30" },
    { date_start: "2026-09-30", date_stop: "2026-09-01" },
  ])
    assert.throws(() => parseAdCoverage({ data: [row] }));
});
test("Dashboard boundaries include the 23/25-hour UK clock-change days", () => {
  assert.equal(
    dayStartUtc("2026-03-29").toISOString(),
    "2026-03-29T00:00:00.000Z",
  );
  assert.equal(
    dayStartUtc("2026-03-30").toISOString(),
    "2026-03-29T23:00:00.000Z",
  );
  assert.equal(
    (dayStartUtc("2026-03-30").getTime() -
      dayStartUtc("2026-03-29").getTime()) /
      3600000,
    23,
  );
  assert.equal(
    (dayStartUtc("2026-10-26").getTime() -
      dayStartUtc("2026-10-25").getTime()) /
      3600000,
    25,
  );
  assert.equal(calendarDate(new Date("2026-10-25T00:30:00Z")), "2026-10-25");
});
test("Invalid, reversed, future and oversized custom ranges fall back explicitly", () => {
  const now = new Date("2026-09-30T12:00:00Z");
  for (const [start, end] of [
    ["2026-02-30", "2026-03-05"],
    ["2026-09-20", "2026-09-01"],
    ["2026-09-01", "2026-10-01"],
    ["2020-01-01", "2026-01-01"],
  ]) {
    const range = dashboardRange(
      { range: "custom", start, end, source: "bad" },
      now,
    );
    assert.equal(range.preset, "30");
    assert.equal(range.source, "LIVE");
    assert.ok(range.warning);
    assert.equal(range.days, 30);
  }
  const leapYear = dashboardRange(
    { range: "custom", start: "2024-01-01", end: "2024-12-31" },
    now,
  );
  assert.equal(leapYear.days, 366);
  assert.equal(leapYear.warning, undefined);
});
test("Paid-order averages are weighted and refunds can make net receipts negative", () => {
  const totals = storeTotals([
    {
      ...emptyStoreDay("2026-09-01"),
      paidOrders: 2,
      orderValue: 10000,
      charges: 10000,
      netReceipts: 10000,
    },
    {
      ...emptyStoreDay("2026-09-02"),
      paidOrders: 1,
      orderValue: 2000,
      charges: 2000,
      refunds: 14000,
      netReceipts: -12000,
    },
  ]);
  assert.equal(totals.averageOrder, 4000);
  assert.equal(totals.paidOrders, 3);
  assert.equal(totals.netReceipts, -2000);
  assert.equal(storeTotals([]).averageOrder, 0);
  assert.equal(changePercent(20, 0), null);
  assert.equal(changePercent(0, 0), 0);
  assert.equal(changePercent(10, -10), null);
});
test("Meta purchase aliases are not double counted and reach stays a period estimate", () => {
  const metrics = parseAdMetrics({
    data: [
      {
        spend: "50.25",
        impressions: "1000",
        reach: "800",
        inline_link_clicks: "25",
        actions: [
          { action_type: "purchase", value: "6" },
          { action_type: "omni_purchase", value: "6" },
          { action_type: "offsite_conversion.fb_pixel_purchase", value: "2" },
        ],
        action_values: [
          { action_type: "purchase", value: "600" },
          {
            action_type: "offsite_conversion.fb_pixel_purchase",
            value: "150.75",
          },
        ],
      },
    ],
  });
  assert.equal(metrics.purchases, 2);
  assert.equal(metrics.purchaseValue, 150.75);
  assert.equal(metrics.roas, 3);
  assert.equal(metrics.reach, 800);
  assert.equal(metrics.linkCtr, 2.5);
  assert.equal(metrics.costPerPurchase, 25.125);
  assert.equal(metrics.costPerClick, 2.01);
  assert.equal(metrics.cpm, 50.25);
  assert.equal(metrics.frequency, 1.25);
});
test("A successful empty Meta report is zero; an invalid report is not", () => {
  const empty = parseAdMetrics({ data: [] });
  assert.equal(empty.spend, 0);
  assert.equal(empty.roas, null);
  assert.equal(empty.costPerPurchase, null);
  assert.equal(empty.costPerClick, null);
  assert.equal(empty.cpm, null);
  assert.equal(empty.frequency, null);
  assert.throws(() => parseAdMetrics({}));
  assert.throws(() => parseAdMetrics({ data: [{ spend: "invalid" }] }));
  assert.throws(() => parseAdMetrics({ data: [{ actions: {} }] }));
  assert.throws(() => parseAdMetrics({ data: [{}, {}] }));
});
test("Meta report dates and attribution are explicit; credentials are absent from URLs", () => {
  const url = new URL(
    insightsPath("123456789", "2026-09-01", "2026-09-30"),
    "https://graph.facebook.com/",
  );
  assert.equal(url.searchParams.get("level"), "account");
  assert.equal(url.searchParams.get("action_report_time"), "conversion");
  assert.deepEqual(JSON.parse(url.searchParams.get("time_range")!), {
    since: "2026-09-01",
    until: "2026-09-30",
  });
  assert.deepEqual(
    JSON.parse(url.searchParams.get("action_attribution_windows")!),
    ["7d_click", "1d_view"],
  );
  assert.equal(url.searchParams.has("access_token"), false);
  assert.equal(url.searchParams.has("time_increment"), false);
});

test("Dashboard tab selection enforces the fulfilment role and rejects unknown tabs", () => {
  assert.equal(dashboardTab("meta", false), "operations");
  assert.equal(dashboardTab("customers", true), "customers");
  assert.equal(dashboardTab("unknown", true), "sales");
  assert.equal(dashboardTab(["meta"], true), "sales");
  assert.equal(metricValue(null, "pence"), "—");
  assert.equal(metricValue(NaN), "—");
  assert.equal(metricValue(1200, "pence"), "£12.00");
});

test("Daily Meta data fills absent dates only after a complete valid response", () => {
  const days = parseAdDays(
    [
      {
        date_start: "2026-09-02",
        date_stop: "2026-09-02",
        spend: "20",
        actions: [
          { action_type: "offsite_conversion.fb_pixel_purchase", value: "2" },
        ],
      },
    ],
    "2026-09-01",
    "2026-09-03",
  );
  assert.equal(days.length, 3);
  assert.equal(days[0].spend, 0);
  assert.equal(days[0].costPerPurchase, null);
  assert.equal(days[1].costPerPurchase, 10);
  assert.equal(days[2].date, "2026-09-03");
  assert.throws(() =>
    parseAdDays(
      [{ date_start: "2026-09-02" }, { date_start: "2026-09-02" }],
      "2026-09-01",
      "2026-09-03",
    ),
  );
  assert.throws(() =>
    parseAdDays([{ date_start: "2026-02-30" }], "2026-02-01", "2026-03-03"),
  );
  assert.throws(() =>
    parseAdDays(
      [{ date_start: "2026-09-02", date_stop: "2026-09-03" }],
      "2026-09-01",
      "2026-09-03",
    ),
  );
  assert.throws(() =>
    parseAdDays([{ date_start: "2026-08-31" }], "2026-09-01", "2026-09-03"),
  );
});

test("Meta detail requests retain attribution while delivery breakdowns avoid conversion fields", () => {
  const query = (kind: "daily" | "campaigns" | "platforms" | "devices") =>
    new URL(
      detailInsightsPath("123", "2026-09-01", "2026-09-30", kind),
      "https://graph.facebook.com/",
    ).searchParams;
  assert.equal(query("daily").get("time_increment"), "1");
  assert.equal(query("campaigns").get("level"), "campaign");
  assert.ok(query("campaigns").get("fields")?.includes("campaign_name"));
  assert.equal(query("devices").get("breakdowns"), "impression_device");
  assert.equal(query("platforms").get("breakdowns"), "publisher_platform");
  assert.equal(query("devices").get("fields")?.includes("actions"), false);
  assert.equal(query("daily").get("action_report_time"), "conversion");
});

test("Meta pagination uses an opaque cursor and never follows an upstream token URL", async () => {
  const path = detailInsightsPath(
    "123",
    "2026-09-01",
    "2026-09-30",
    "campaigns",
  );
  const paths: string[] = [];
  const rows = await fetchInsightRows(
    path,
    "secret",
    async (requestedPath, token) => {
      paths.push(requestedPath);
      assert.equal(token, "secret");
      return paths.length === 1
        ? {
            data: [{ campaign_id: "a" }],
            paging: {
              next: "https://untrusted.example/?access_token=secret",
              cursors: { after: "next/page+1" },
            },
          }
        : { data: [{ campaign_id: "b" }] };
    },
  );
  assert.equal(rows.length, 2);
  assert.equal(
    new URL(paths[1], "https://graph.facebook.com/").searchParams.get("after"),
    "next/page+1",
  );
  assert.ok(paths.every((value) => value.startsWith("act_123/insights?")));
  assert.ok(paths.every((value) => !value.includes("secret")));
  await assert.rejects(
    () =>
      fetchInsightRows(path, "secret", async () => ({
        data: [],
        paging: { next: "more" },
      })),
    /pagination/,
  );
  await assert.rejects(
    () =>
      fetchInsightRows(path, "secret", async () => ({
        data: [],
        paging: { next: "more", cursors: { after: "repeat" } },
      })),
    /pagination/,
  );
  await assert.rejects(
    () => fetchInsightRows(path, "secret", async () => ({ data: {} })),
    /detail response/,
  );
});
