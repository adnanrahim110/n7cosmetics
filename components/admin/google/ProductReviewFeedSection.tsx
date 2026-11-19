import { getProductReviewFeedSnapshot } from "@/lib/google-product-reviews/data";
import { reviewOriginLabels } from "@/lib/google-product-reviews/provenance";
import Link from "next/link";
import AdminMetricCard from "../MetaCatalogMetricCard";

export default async function ProductReviewFeedSection() {
  const report = await getProductReviewFeedSnapshot().catch(() => null);
  const held = report
    ? Object.values(report.held).reduce((sum, count) => sum + count, 0)
    : 0;
  const ready =
    report &&
    !report.configurationError &&
    !report.issues.length &&
    report.items.length > 0;
  return (
    <section
      aria-labelledby="product-review-feed-heading"
      className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6"
    >
      <h2 id="product-review-feed-heading" className="text-lg font-semibold">
        Product Ratings XML feed
      </h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        A complete feed of eligible published product reviews, including low
        ratings and historical reviews. This is separate from Google’s
        purchase-experience survey and product catalogue feed.
      </p>
      {report ? (
        <>
          <p className="mt-4 break-all rounded-lg bg-zinc-50 p-4 font-mono text-sm">
            {report.origin || "Your public HTTPS domain"}
            /feeds/google-product-reviews.xml
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Reviews ready", value: report.items.length },
              { label: "Source not confirmed", value: held },
              {
                label: "Records needing attention",
                value: report.issues.length,
              },
            ].map((metric) => (
              <AdminMetricCard key={metric.label} {...metric} tone="neutral" />
            ))}
          </div>
          {!ready ? (
            <p className="mt-4 text-sm text-amber-900" role="status">
              {report.configurationError ||
                (report.issues.length
                  ? "Fix the records below before Google fetches a complete replacement. The endpoint returns a temporary error until they are resolved."
                  : "No eligible reviews are available yet. Confirm genuine customer sources or collect new customer reviews.")}
            </p>
          ) : (
            <p className="mt-4 text-sm text-emerald-800" role="status">
              The XML endpoint is ready.{" "}
              {report.items.length < 50
                ? "Google’s 50-review minimum has not been met yet."
                : "The feed meets Google’s minimum review count; Google still controls approval and matching."}
            </p>
          )}
          <ul className="mt-4 space-y-2 text-sm text-zinc-600">
            {Object.entries(reviewOriginLabels).flatMap(([origin, label]) =>
              report.held[origin]
                ? [
                    <li key={origin}>
                      {label}: {report.held[origin]}
                    </li>,
                  ]
                : [],
            )}
          </ul>
          {report.issues.length ? (
            <ul className="mt-4 space-y-2 text-sm text-red-800">
              {report.issues.slice(0, 10).map((issue) => (
                <li key={issue.reviewId}>
                  Review #{issue.reviewId}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          {ready ? (
            <a
              href="/feeds/google-product-reviews.xml"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-12 items-center text-sm font-medium text-amber-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            >
              Open review XML feed
            </a>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-sm text-amber-900" role="status">
          Review feed status is unavailable. Check database access and migration
          043, then refresh this page.
        </p>
      )}
      <p className="mt-4 text-sm leading-6 text-zinc-600">
        The feed updates on every request. Submit it under Merchant Center →
        Reviews → Product Ratings and arrange regular full-feed fetches, at
        least monthly. Unknown incentive status is omitted; confirmed incentives
        are disclosed. “Verified purchase” requires a stored verification flag
        and a matching paid product order before the review date.
      </p>
      <Link
        href="/admin/reviews"
        className="mt-4 inline-flex min-h-12 items-center text-sm font-medium text-amber-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
      >
        Review customer sources
      </Link>
    </section>
  );
}
