import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ReviewContent } from "@/lib/homepage/types";

export default function HomepageReviewCard({ review }: { review: ReviewContent }) {
  const value = Number(review.rating ?? 5);
  const rating = Number.isFinite(value) ? Math.min(5, Math.max(1, Math.round(value))) : 5;
  const product = review.product?.trim();

  return (
    <article className="group flex h-full w-full flex-col justify-between rounded-xl border border-[#967C55]/20 bg-white p-4 shadow-[0_4px_20px_rgba(28,24,20,0.03)] transition-all duration-300 hover:border-[#967C55]/45 hover:shadow-[0_8px_30px_rgba(150,124,85,0.08)] motion-reduce:transition-none sm:p-5 md:p-6 lg:p-7">
      <div>
        <div className="flex items-center justify-between gap-1">
          <div aria-label={`${rating} out of 5 stars`} className="flex items-center gap-1 text-[#967C55]" role="img">
            {Array.from({ length: 5 }, (_, index) => (
              <Star aria-hidden="true" className={cn("size-3 sm:size-4", index < rating ? "fill-[#967C55] text-[#967C55]" : "text-[#967C55]/25")} key={index} size={16} strokeWidth={1.5} />
            ))}
          </div>
          <Quote aria-hidden="true" className="size-4 shrink-0 text-[#967C55]/30 transition-colors duration-300 group-hover:text-[#967C55]/60 motion-reduce:transition-none md:size-5" strokeWidth={1.2} />
        </div>
        <blockquote className="mt-3 font-heading text-xs font-normal italic leading-snug text-[#1C1814] wrap-anywhere sm:mt-4 sm:text-sm sm:leading-relaxed md:text-base lg:text-[17px]">
          &ldquo;{review.text}&rdquo;
        </blockquote>
      </div>
      <footer className="mt-3 border-t border-[#967C55]/15 pt-3 sm:mt-5 md:pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <cite className="min-w-0 font-heading text-[10px] font-semibold uppercase not-italic tracking-wider text-[#1C1814] wrap-anywhere sm:text-xs sm:tracking-[0.16em]">
            {review.author}
          </cite>
          <span className={cn("max-w-full text-[10px] font-medium uppercase tracking-wider text-[#7A5D38] wrap-anywhere", product && "rounded-full border border-[#967C55]/25 bg-primary-50 px-2 py-1")}>
            {product || "Client review"}
          </span>
        </div>
      </footer>
    </article>
  );
}
