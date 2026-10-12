import Link from "next/link";
import type { MetaTimingReport } from "@/lib/meta/timing";
import TimePatternPanel from "./TimePatternPanel";

export default function CustomerMetaTiming({ report, start, end }: { report: MetaTimingReport; start: string; end: string }) {
  if (report.status === "ready" && report.timing) {
    return <TimePatternPanel
      title="Meta ad traffic by time"
      description={`Average hourly link clicks and impressions from ${start} through ${end} in the ad account's time zone. Link clicks are ad interactions; confirmed website visits are not recorded here. Order-origin filters apply to store purchases only.`}
      timing={report.timing}
      metrics={[{ key: "linkClicks", label: "Link clicks" }, { key: "impressions", label: "Impressions" }]}
    />;
  }
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="font-body text-base font-semibold text-zinc-950">Meta ad traffic by time</h2>
      <p role="status" className="mt-3 text-sm leading-6 text-zinc-600">{report.message}</p>
      <Link href="/admin/meta" className="mt-4 inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">Meta connection settings</Link>
    </section>
  );
}
