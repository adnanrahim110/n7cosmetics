import Image from "next/image";
import { BadgeCheck, Check, Play, Star } from "lucide-react";
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
    <section className="border-t border-black/10 bg-[#e9dfd1] py-16 text-[#1c1814] sm:py-24" id="reviews">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 border-b border-black/12 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#8d6745]">Customer notes</p>
            <Title
              className="mt-4"
              highlight="remembered."
              text="Worn, loved, remembered."
              tone="ink"
            />
            <p className="mt-5 max-w-xl text-sm font-light leading-7 text-black/55">Real impressions from customers who have made {productName} part of their ritual.</p>
          </div>

          <div className="grid gap-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10 lg:justify-self-end">
            <div>
              <p className="font-heading text-6xl leading-none sm:text-7xl">{summary.totalReviews ? summary.averageRating.toFixed(1) : "—"}</p>
              <RatingStars className="mt-3" rating={summary.averageRating} size={16} />
              <p className="mt-2 text-xs text-black/45">Based on {summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"}</p>
            </div>
            <div className="w-full min-w-56 space-y-2">
              {summary.distribution.map((entry) => {
                const width = summary.totalReviews ? (entry.count / summary.totalReviews) * 100 : 0;
                return (
                  <div className="grid grid-cols-[1.2rem_1fr_1.5rem] items-center gap-2 text-[11px] text-black/45" key={entry.rating}>
                    <span>{entry.rating}</span>
                    <span className="h-px bg-black/12"><span className="block h-px bg-[#8d6745]" style={{ width: `${width}%` }} /></span>
                    <span className="text-right">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {summary.reviews.length ? (
          <div className="divide-y divide-black/10">
            {summary.reviews.map((review, index) => (
              <article className="grid gap-6 py-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12 lg:py-12" key={review.id}>
                <div>
                  <p className="text-sm font-semibold text-[#1c1814]">{review.reviewerName}</p>
                  {review.verifiedPurchase ? <p className="mt-2 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#6e7451]"><BadgeCheck size={13} />Verified purchase</p> : null}
                  <p className="mt-2 text-xs text-black/38">{reviewDate(review.publishedAt)}</p>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <RatingStars rating={review.rating} size={15} />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/28">Review {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-4 font-heading text-2xl font-normal text-[#1c1814] sm:text-3xl">{review.title}</h3>
                  <p className="mt-3 max-w-3xl whitespace-pre-line text-sm font-light leading-7 text-black/60 sm:text-base sm:leading-8">{review.body}</p>
                  {review.recommendsProduct ? <p className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66704b]"><span className="grid size-5 place-items-center rounded-full border border-current"><Check size={12} /></span>Recommends this fragrance</p> : null}
                  {review.media.length ? (
                    <div className="mt-6 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
                      {review.media.map((media, mediaIndex) => (
                        <div className="relative aspect-square overflow-hidden bg-[#ddd0be]" key={`${media.url}-${mediaIndex}`}>
                          {media.type === "image" ? <Image alt={media.alt} className="object-cover" fill sizes="(max-width: 640px) 50vw, 180px" src={media.url} /> : <><video aria-label="Customer review video" className="size-full object-cover" controls playsInline preload="metadata" src={media.url} /><Play aria-hidden="true" className="pointer-events-none absolute left-2 top-2 fill-white text-white drop-shadow" size={15} /></>}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center border-b border-black/12 text-center">
            <div>
              <Star className="mx-auto text-[#ad8b62]" size={24} strokeWidth={1.3} />
              <h3 className="mt-4 font-heading text-2xl font-normal text-[#1c1814]">Be the first to leave a note</h3>
              <p className="mt-2 text-sm text-black/45">Share how this fragrance wears for you.</p>
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-black/12 pt-12 sm:mt-8 sm:pt-16">
          <ReviewForm productId={productId} productName={productName} productSlug={productSlug} />
        </div>
      </div>
    </section>
  );
}
