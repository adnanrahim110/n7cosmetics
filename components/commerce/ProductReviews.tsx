import Image from "next/image";
import { BadgeCheck, Check, ChevronDown, Play, Star } from "lucide-react";
import type { ProductReviewSummary } from "@/lib/commerce/reviews";
import RatingStars from "./RatingStars";
import ReviewForm from "./ReviewForm";
import Title from "@/components/ui/Title";

function reviewDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(value);
}

export default function ProductReviews({
  productId,
  productSlug,
  productName,
  summary,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  summary: ProductReviewSummary;
}) {
  return (
    <section aria-labelledby="reviews-heading" className="scroll-mt-24 border-t border-black/10 bg-white py-8 text-[#1c1814] sm:py-12" id="reviews">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-5 border-b border-black/10 pb-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8">
          <div className="min-w-0">
            <Title
              id="reviews-heading"
              text="Customer reviews"
              tone="ink"
              variant="compact"
            />
            <p className="mt-2 text-sm leading-6 text-black/55">Customer experiences with {productName}.</p>
          </div>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-5 sm:gap-6 md:w-80">
            <div>
              <p className="font-heading text-4xl leading-none">{summary.totalReviews ? summary.averageRating.toFixed(1) : "—"}<span className="ml-1 font-body text-sm text-black/45">/ 5</span></p>
              <RatingStars className="mt-2" rating={summary.averageRating} size={14} />
              <p className="mt-1 text-xs text-black/50">{summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"}</p>
            </div>
            <div className="min-w-0 space-y-1.5">
              {summary.distribution.map((entry) => {
                const width = summary.totalReviews ? (entry.count / summary.totalReviews) * 100 : 0;
                return (
                  <div className="grid grid-cols-[1.2rem_minmax(0,1fr)_2rem] items-center gap-2 text-[11px] leading-4 text-black/50" key={entry.rating}>
                    <span>{entry.rating}<span className="sr-only"> stars</span></span>
                    <span className="h-1 overflow-hidden rounded-full bg-black/8"><span className="block h-full rounded-full bg-[#8d6745]" style={{ width: `${width}%` }} /></span>
                    <span className="text-right">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {summary.reviews.length ? (
          <div className="divide-y divide-black/10">
            {summary.reviews.map((review) => (
              <article className="grid gap-3 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6" key={review.id}>
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 sm:block">
                  <p className="wrap-anywhere text-sm font-semibold text-[#1c1814]">{review.reviewerName}</p>
                  {review.verifiedPurchase ? <p className="flex items-center gap-1 text-[11px] text-[#66704b] sm:mt-1"><BadgeCheck className="shrink-0" size={13} />Verified purchase</p> : null}
                  <time className="text-xs text-black/50 sm:mt-2 sm:block" dateTime={review.publishedAt.toISOString()}>{reviewDate(review.publishedAt)}</time>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <RatingStars className="shrink-0" rating={review.rating} size={13} />
                    <h3 className="wrap-anywhere font-body text-base font-semibold leading-6 tracking-normal text-[#1c1814]">{review.title}</h3>
                  </div>
                  <p className="mt-2 max-w-3xl whitespace-pre-line wrap-anywhere text-sm leading-6 text-black/65">{review.body}</p>
                  {review.recommendsProduct ? <p className="mt-2 flex items-center gap-1.5 text-xs text-[#66704b]"><Check className="shrink-0" size={14} />Recommends this fragrance</p> : null}
                  {review.media.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.media.map((media, mediaIndex) => (
                        <div className={`relative shrink-0 overflow-hidden rounded-sm bg-black/5 ${media.type === "image" ? "size-20" : "h-24 w-44 max-w-full"}`} key={`${media.url}-${mediaIndex}`}>
                          {media.type === "image" ? <a aria-label={`View review photo ${mediaIndex + 1} by ${review.reviewerName}`} className="block size-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#8d6745]" href={media.url} rel="noopener noreferrer" target="_blank"><Image alt={media.alt} className="object-cover" fill sizes="80px" src={media.url} /></a> : <><video aria-label="Customer review video" className="size-full object-cover" controls playsInline preload="metadata" src={media.url} /><Play aria-hidden="true" className="pointer-events-none absolute left-2 top-2 fill-white text-white drop-shadow" size={15} /></>}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-8 text-left">
            <Star className="shrink-0 text-[#ad8b62]" size={22} strokeWidth={1.3} />
            <div>
              <h3 className="font-body text-base font-medium tracking-normal text-[#1c1814]">Be the first to review</h3>
              <p className="mt-1 text-sm text-black/55">Share how this fragrance wears for you.</p>
            </div>
          </div>
        )}

        <details className="group border-y border-black/10" open>
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold transition hover:text-[#8d6745] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d6745] [&::-webkit-details-marker]:hidden">
            Write a review
            <ChevronDown aria-hidden="true" className="shrink-0 transition-transform group-open:rotate-180" size={18} />
          </summary>
          <div className="border-t border-black/10 py-5 sm:py-6">
            <ReviewForm productId={productId} productName={productName} productSlug={productSlug} />
          </div>
        </details>
      </div>
    </section>
  );
}
