import Link from "next/link";
import {
  getMetaOverview,
  type MetaOverview as MetaReport,
  type AdMetrics,
  type AdDay,
} from "@/lib/meta/insights";
import { getTrackingHealth } from "@/lib/admin/dashboard-reports";
import MetaMatchingCoverage from "./MetaMatchingCoverage";
import type { DashboardRange } from "@/lib/admin/dashboard-dates";
import { metricValue, type ValueFormat } from "@/lib/admin/dashboard-display";
import MetricCard from "./MetricCard";
import TimeSeriesPanel from "./TimeSeriesPanel";
import BreakdownChart from "./BreakdownChart";

type Definition = {
  key: keyof AdMetrics;
  label: string;
  color: string;
  note: string;
  format?: ValueFormat;
  direction?: "up" | "down" | "neutral";
};
const advertising: Definition[] = [
  {
    key: "spend",
    label: "Ad spend",
    color: "#ea580c",
    format: "money",
    direction: "neutral",
    note: "Amount spent in the ad account currency.",
  },
  {
    key: "purchaseValue",
    label: "Attributed purchase value",
    color: "#059669",
    format: "money",
    note: "Website purchase value attributed to ads; not all store sales.",
  },
  {
    key: "purchases",
    label: "Attributed purchases",
    color: "#2563eb",
    note: "Meta-attributed website purchases, reported on conversion date.",
  },
  {
    key: "roas",
    label: "Website purchase ROAS",
    color: "#7c3aed",
    format: "ratio",
    note: "Attributed purchase value divided by spend; not profit.",
  },
  {
    key: "costPerPurchase",
    label: "Cost per purchase",
    color: "#db2777",
    format: "money",
    direction: "down",
    note: "Spend divided by attributed website purchases.",
  },
  {
    key: "cpm",
    label: "Cost per 1,000 impressions",
    color: "#0891b2",
    format: "money",
    direction: "down",
    note: "Ad delivery cost per thousand impressions.",
  },
];
const traffic: Definition[] = [
  {
    key: "impressions",
    label: "Ad impressions",
    color: "#2563eb",
    note: "Times ads were displayed, including repeat impressions.",
  },
  {
    key: "reach",
    label: "People reached",
    color: "#7c3aed",
    note: "Meta’s period estimate; daily reach is not summed.",
  },
  {
    key: "linkClicks",
    label: "Ad link clicks",
    color: "#0891b2",
    note: "Link clicks reported by Meta; not website sessions.",
  },
  {
    key: "linkCtr",
    label: "Link click-through rate",
    color: "#059669",
    format: "percent",
    note: "Link clicks divided by impressions.",
  },
  {
    key: "landingPageViews",
    label: "Landing page views",
    color: "#db2777",
    note: "Landing page loads attributed to ads; not all website views.",
  },
  {
    key: "costPerClick",
    label: "Cost per link click",
    color: "#ea580c",
    format: "money",
    direction: "down",
    note: "Spend divided by link clicks.",
  },
];
function MetaState({ report }: { report: MetaReport }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-200 bg-amber-50 p-5"
    >
      <h2 className="font-semibold">
        {report.status === "paused"
          ? "Meta reporting paused"
          : report.status === "unconfigured"
            ? "Connect Meta reporting"
            : "Meta reports unavailable"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{report.message}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Unavailable data is not shown as zero. Pixel and Conversions API access
        are separate from reporting permissions.
      </p>
      <Link
        href="/admin/meta"
        className="mt-3 inline-block text-sm font-medium text-amber-800"
      >
        Open Meta settings
      </Link>
    </div>
  );
}
export default async function MetaOverview({
  range,
  mode = "meta",
}: {
  range: DashboardRange;
  mode?: "meta" | "traffic";
}) {
  const report: MetaReport = await getMetaOverview(range).catch(() => ({
    status: "error",
    message: "Meta settings could not be loaded. Please try refreshing.",
    pixelConfigured: false,
    serverConfigured: false,
    testMode: false,
  }));
  const current = report.current,
    previous = report.previous;
  const period = report.period ?? range;
  const definitions = mode === "traffic" ? traffic : advertising;
  const points = (days: AdDay[] | undefined, key: keyof AdMetrics) =>
    days?.map((day) => ({ date: day.date, value: day[key] }));
  const series = definitions.map((item) => ({
    ...item,
    currency: report.currency,
    points: points(report.details?.days, item.key) ?? [],
    previous: points(report.details?.previousDays, item.key),
  }));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-body text-lg font-semibold">
            {mode === "traffic" ? "Ad traffic & tracking" : "Meta advertising"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {report.accountName ?? "Meta ad account"}
            {report.currency
              ? ` · ${report.currency} · ${report.timezone}`
              : ""}
          </p>
        </div>
        <Link href="/admin/meta" className="text-sm font-medium text-amber-800">
          Connection settings
        </Link>
      </div>
      {report.testMode ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Conversions API is in test mode. Remove the test code in Meta settings
          when you are ready to send live events.
        </p>
      ) : null}
      {report.status === "ready" &&
      current &&
      (previous || range.preset === "all") ? (
        <>
          <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
            Fetched{" "}
            {new Intl.DateTimeFormat("en-GB", {
              dateStyle: "medium",
              timeStyle: "medium",
              timeZone: report.timezone ?? "Europe/London",
            }).format(new Date(report.fetchedAt!))}{" "}
            {report.timezone}. Automatic refresh checks every minute. Meta may report
            conversions later or revise attribution.
            <br />
            Period: {period.start} to {period.end} ({report.timezone}). Every card, chart and campaign report below uses this selection.
            <br />
            Attribution: each ad set’s settings, using conversion date. Store
            revenue and Meta attribution are never added together.
            {range.preset === "all" ? (
              <>
                <br />
                All time uses the maximum history available from Meta
                {report.coverage
                  ? ` (${report.coverage.start} to ${report.coverage.end})`
                  : ""}
                . Older activity may be outside Meta’s reporting limits. No
                previous-period comparison applies.
              </>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {definitions.map(({ key, ...item }, index) => (
              <MetricCard
                key={key}
                {...item}
                currency={report.currency}
                current={current[key]}
                previous={previous?.[key] ?? null}
                comparison={range.preset !== "all"}
                points={report.details?.days ? series[index].points : undefined}
                previousPoints={series[index].previous}
              />
            ))}
          </div>
          {report.details?.errors.length ? (
            <p
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            >
              Some detailed reports are unavailable (
              {report.details.errors
                .map(
                  (key) =>
                    ({
                      days: "daily results",
                      previousDays: "previous daily results",
                      campaigns: "campaigns",
                      platforms: "platforms",
                      devices: "devices",
                    })[key] ?? key,
                )
                .join(", ")}
              ). Account totals remain available. Refresh to retry.
            </p>
          ) : null}
          {report.details?.days ? (
            <TimeSeriesPanel
              title={
                mode === "traffic"
                  ? "Ad traffic over time"
                  : "Advertising performance over time"
              }
              description="Daily values use the ad account’s time zone. Ratios are recalculated for each day."
              series={series}
            />
          ) : null}
          {mode === "traffic" ? (
            <>
              <div className="grid gap-5 xl:grid-cols-2">
                {report.details?.platforms ? (
                  <BreakdownChart
                    title="Clicks by platform"
                    description="Meta delivery platforms; paid link clicks only."
                    rows={report.details.platforms.map((row) => ({
                      label: row.name,
                      value: row.linkClicks,
                    }))}
                    donut
                  />
                ) : null}
                {report.details?.devices ? (
                  <BreakdownChart
                    title="Clicks by ad device"
                    description="The device on which the ad was shown; not website session devices."
                    rows={report.details.devices.map((row) => ({
                      label: row.name,
                      value: row.linkClicks,
                    }))}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <>
              <BreakdownChart
                title="Ad-attributed website actions"
                description="Event counts, not a session funnel: people may repeat actions and stages need not decrease."
                rows={[
                  {
                    label: "Added to basket",
                    value: current.addsToCart,
                    color: "#2563eb",
                  },
                  {
                    label: "Started checkout",
                    value: current.checkouts,
                    color: "#7c3aed",
                  },
                  {
                    label: "Purchased",
                    value: current.purchases,
                    color: "#059669",
                  },
                ]}
              />
              {report.details?.campaigns ? (
                <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                  <div className="p-5">
                    <h2 className="font-body text-base font-semibold">
                      Campaign performance
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      Top 20 of {report.details.campaigns.length} campaigns by
                      spend. Account currency: {report.currency}.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-xs text-zinc-500">
                        <tr>
                          {[
                            "Campaign",
                            "Spend",
                            "Purchases",
                            "Purchase value",
                            "ROAS",
                            "Cost / purchase",
                          ].map((name) => (
                            <th
                              key={name}
                              className="whitespace-nowrap px-4 py-3 font-medium"
                            >
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.details.campaigns.slice(0, 20).map((row) => (
                          <tr key={row.id} className="border-t border-zinc-100">
                            <td className="min-w-48 px-4 py-3 font-medium">
                              {row.name}
                            </td>
                            {[
                              metricValue(row.spend, "money", report.currency),
                              metricValue(row.purchases),
                              metricValue(
                                row.purchaseValue,
                                "money",
                                report.currency,
                              ),
                              metricValue(row.roas, "ratio"),
                              metricValue(
                                row.costPerPurchase,
                                "money",
                                report.currency,
                              ),
                            ].map((value, index) => (
                              <td
                                key={index}
                                className="whitespace-nowrap px-4 py-3 tabular-nums"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {!report.details.campaigns.length ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-6 text-center text-zinc-500"
                            >
                              No campaign activity in this period.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </>
          )}
        </>
      ) : (
        <MetaState report={report} />
      )}
      {mode === "traffic" ? <TrackingHealth range={period} /> : null}
      <MetaMatchingCoverage range={period} />
    </div>
  );
}
async function TrackingHealth({ range }: { range: DashboardRange }) {
  const rows = await getTrackingHealth(range).catch(() => null);
  const received = rows
    ?.filter((row) => row.status === "SENT")
    .map((row) => ({ label: row.label, value: row.value }));
  const pending = rows
    ?.filter((row) => row.status === "PENDING" || row.status === "PROCESSING")
    .reduce((sum, row) => sum + row.value, 0);
  const failed = rows
    ?.filter((row) => row.status === "FAILED")
    .reduce((sum, row) => sum + row.value, 0);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs leading-5 text-zinc-500">
        Website sessions, bounce rate, landing-page rankings and store
        session-conversion rate are not collected by the current integration. Ad
        clicks and event deliveries cannot substitute for these metrics.
      </div>
      {received ? (
        <>
          <BreakdownChart
            title="Server events received by Meta"
            description={`${range.preset === "all" ? `All retained consented live events through ${range.end}` : `Consented live events from ${range.start} to ${range.end}`} acknowledged by Meta, using ${range.timeZone ?? "Europe/London"} dates. Delivery records are retained for 30 days; older ranges are incomplete. These are event deliveries, not visitor totals.`}
            rows={received}
            emptyMessage="No acknowledged live events in the retained records for this period."
          />
          <p className="text-xs text-zinc-500">
            In the retained records: {pending} pending or processing · {failed}{" "}
            failed. Receipt confirms delivery only, not attribution or
            event-match quality.
          </p>
        </>
      ) : (
        <p role="status" className="text-sm text-zinc-500">
          Server-event delivery data is unavailable.
        </p>
      )}
    </div>
  );
}
