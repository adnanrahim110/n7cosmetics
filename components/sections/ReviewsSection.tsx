"use client";

import Title from "@/components/ui/Title";
import type { ReviewContent, ReviewsContent } from "@/lib/homepage/types";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import "swiper/css";
import { A11y, Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const ease = [0.22, 1, 0.36, 1] as const;

function getRating(review: ReviewContent): number {
  const rating = Number(review.rating ?? 5);
  return Number.isFinite(rating)
    ? Math.min(5, Math.max(1, Math.round(rating)))
    : 5;
}

function ReviewCard({ review }: { review: ReviewContent }) {
  const rating = getRating(review);

  return (
    <article className="group flex h-full w-full flex-col justify-between rounded-xl border border-[#967C55]/20 bg-white p-3.5 shadow-[0_4px_20px_rgba(28,24,20,0.03)] transition-all duration-300 hover:border-[#967C55]/45 hover:shadow-[0_8px_30px_rgba(150,124,85,0.08)] sm:p-5 md:p-6 lg:p-7">
      <div>
        <div className="flex items-center justify-between gap-1">
          <div
            aria-label={`${rating} out of 5 stars`}
            className="flex items-center gap-0.5 text-[#967C55]"
            role="img"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                aria-hidden="true"
                className={`size-3 sm:size-3.5 md:size-4 ${
                  index < rating
                    ? "fill-[#967C55] text-[#967C55]"
                    : "text-[#967C55]/25"
                }`}
                key={index}
                size={16}
                strokeWidth={1.5}
              />
            ))}
          </div>
          <Quote
            aria-hidden="true"
            className="size-3.5 shrink-0 text-[#967C55]/30 transition-colors duration-300 group-hover:text-[#967C55]/60 sm:size-4 md:size-5"
            strokeWidth={1.2}
          />
        </div>

        <blockquote className="mt-3 font-heading text-xs font-normal italic leading-snug text-[#1C1814] sm:mt-4 sm:text-sm sm:leading-relaxed md:text-base lg:text-[17px]">
          &ldquo;{review.text}&rdquo;
        </blockquote>
      </div>

      <footer className="mt-3 border-t border-[#967C55]/15 pt-2.5 sm:mt-5 sm:pt-3 md:pt-4">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <cite className="truncate font-heading text-[10px] font-semibold uppercase not-italic tracking-wider text-[#1C1814] sm:text-xs sm:tracking-[0.16em]">
            {review.author}
          </cite>
          <span className="shrink-0 text-[8px] font-medium uppercase tracking-wider text-[#967C55] sm:text-[9px] sm:tracking-widest md:text-[10px]">
            Client review
          </span>
        </div>
      </footer>
    </article>
  );
}

export default function ReviewsSection({
  content,
}: {
  content: ReviewsContent;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const originalCount = content.reviews.length;

  if (!originalCount) return null;

  const displayReviews =
    originalCount > 0 && originalCount < 6
      ? [...content.reviews, ...content.reviews]
      : content.reviews;

  const currentReviewIndex = (activeIndex % originalCount) + 1;

  return (
    <section
      aria-label="Customer reviews"
      className="relative isolate overflow-hidden bg-primary-50 py-14 text-[#1C1814] sm:py-18 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(150,124,85,0.07),transparent)]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 border-b border-[#967C55]/20 pb-8 sm:gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end lg:pb-10">
          <div>
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.24em] text-[#967C55]"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {content.eyebrow}
            </motion.p>
            <Title
              className="mt-3 uppercase"
              highlight={content.titleAccent}
              highlightClassName="lowercase"
              text={`${content.titleLead} ${content.titleAccent}`}
              tone="charcoal"
            />
          </div>

          <motion.p
            className="max-w-xl text-sm font-light text-black/65 sm:text-base lg:justify-self-end lg:text-right"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.08,
              duration: shouldReduceMotion ? 0 : 0.65,
              ease,
            }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {content.description}
          </motion.p>
        </div>

        <motion.div
          className="mt-8 sm:mt-10 lg:mt-12"
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.1,
            duration: shouldReduceMotion ? 0 : 0.75,
            ease,
          }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Swiper
            aria-label="Customer reviews"
            autoplay={
              shouldReduceMotion || originalCount <= 1
                ? false
                : {
                    delay: 6000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
            }
            breakpoints={{
              480: { slidesPerView: 2.1, spaceBetween: 12 },
              640: { slidesPerView: 2.3, spaceBetween: 16 },
              768: { slidesPerView: 2.6, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
              1280: { slidesPerView: 3, spaceBetween: 28 },
            }}
            className="overflow-visible!"
            grabCursor={originalCount > 1}
            keyboard={{ enabled: true }}
            modules={[A11y, Autoplay, Keyboard]}
            onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
            onSwiper={setSwiper}
            rewind={originalCount > 1}
            slidesPerView={2}
            spaceBetween={10}
            watchOverflow={false}
          >
            {displayReviews.map((review, index) => (
              <SwiperSlide
                className="flex h-auto!"
                key={`${review.author}-${index}`}
              >
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-7 flex items-center gap-4 sm:mt-9 sm:gap-6">
            <span
              aria-live="polite"
              className="shrink-0 font-mono text-xs font-medium tracking-[0.2em] text-[#1C1814]/60"
            >
              {String(currentReviewIndex).padStart(2, "0")} /{" "}
              {String(originalCount).padStart(2, "0")}
            </span>

            <div
              aria-hidden="true"
              className="h-0.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#1C1814]/10"
            >
              <motion.span
                animate={{
                  width: `${(currentReviewIndex / originalCount) * 100}%`,
                }}
                className="block h-full rounded-full bg-[#967C55]"
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease }}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                aria-label="Previous review"
                className="grid size-11 place-items-center rounded-full border border-[#1C1814]/15 bg-white text-[#1C1814] shadow-xs transition-colors duration-200 hover:border-[#1C1814] hover:bg-[#1C1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none sm:size-10"
                disabled={originalCount <= 1}
                onClick={() => swiper?.slidePrev()}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.5} />
              </button>
              <button
                aria-label="Next review"
                className="grid size-11 place-items-center rounded-full border border-[#1C1814]/15 bg-white text-[#1C1814] shadow-xs transition-colors duration-200 hover:border-[#1C1814] hover:bg-[#1C1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none sm:size-10"
                disabled={originalCount <= 1}
                onClick={() => swiper?.slideNext()}
                type="button"
              >
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
