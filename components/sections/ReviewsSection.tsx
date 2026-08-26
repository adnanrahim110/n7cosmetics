"use client";

import type { ReviewContent, ReviewsContent } from "@/lib/homepage/types";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
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
    <article className="flex h-full min-h-80 flex-col border border-[#2f211d]/12 bg-[#f8f3eb] p-6 shadow-[0_0px_30px_rgba(47,33,29,0.05)] sm:min-h-88 sm:p-8 lg:min-h-96 lg:p-10">
      <div
        aria-label={`${rating} out of 5 stars`}
        className="flex items-center gap-1 text-[#a66d2d]"
        role="img"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            aria-hidden="true"
            className={index < rating ? "fill-current" : "opacity-25"}
            key={index}
            size={17}
            strokeWidth={1.5}
          />
        ))}
      </div>

      <p className="my-8 grow font-heading text-[1.55rem] font-light italic leading-[1.45] tracking-normal text-[#2b1e1a] sm:my-10 sm:text-[1.8rem] lg:text-[2rem]">
        &ldquo;{review.text}&rdquo;
      </p>

      <p className="border-t border-[#2f211d]/12 pt-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6f4e41]">
        {review.author}
      </p>
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
  const reviewCount = content.reviews.length;

  if (!reviewCount) return null;

  return (
    <section className="relative isolate overflow-hidden bg-[#c9b1a7] py-16 text-[#211917] sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_8%,rgba(247,228,216,0.62),transparent_35%),linear-gradient(135deg,#d1bbb1_0%,#bea096_100%)]" />

      <div className="mx-auto max-w-360 px-4 sm:px-8 lg:px-12">
        <div className="grid gap-7 border-b border-[#3d2924]/18 pb-8 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:pb-10">
          <div>
            <motion.p
              className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#755346]"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {content.eyebrow}
            </motion.p>
            <motion.h2
              className="mt-5 font-heading text-4xl uppercase leading-[0.92] tracking-wide text-[#241a17] sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.85, ease }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              {content.titleLead}{" "}
              <span className="font-light italic lowercase tracking-normal text-[#815b4c]">
                {content.titleAccent}
              </span>
            </motion.h2>
          </div>

          <motion.p
            className="max-w-xl font-light leading-7 text-[#382723]/65 lg:justify-self-end lg:text-right"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.08,
              duration: shouldReduceMotion ? 0 : 0.75,
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
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 28 }}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.12,
            duration: shouldReduceMotion ? 0 : 0.85,
            ease,
          }}
          viewport={{ once: true, margin: "-60px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <Swiper
            aria-label="Customer reviews"
            autoplay={
              shouldReduceMotion || reviewCount <= 1
                ? false
                : {
                    delay: 6000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
            }
            breakpoints={{
              520: { slidesPerView: 1.35, spaceBetween: 20 },
              768: { slidesPerView: 1.8, spaceBetween: 24 },
              1024: { slidesPerView: 2.2, spaceBetween: 28 },
              1440: { slidesPerView: 2.55, spaceBetween: 32 },
            }}
            className="overflow-visible!"
            grabCursor={reviewCount > 1}
            keyboard={{ enabled: true }}
            modules={[A11y, Autoplay, Keyboard]}
            onSlideChange={(instance) => setActiveIndex(instance.realIndex)}
            onSwiper={setSwiper}
            rewind={reviewCount > 1}
            slidesPerView={1.08}
            spaceBetween={14}
            watchOverflow
          >
            {content.reviews.map((review, index) => (
              <SwiperSlide
                className="h-auto!"
                key={`${review.author}-${index}`}
              >
                <ReviewCard review={review} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-7 flex items-center gap-4 sm:mt-9 sm:gap-6">
            <p
              aria-live="polite"
              className="shrink-0 text-[10px] font-semibold tracking-[0.2em] text-[#4b342d]/65"
            >
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(reviewCount).padStart(2, "0")}
            </p>

            <div
              aria-hidden="true"
              className="h-px min-w-0 flex-1 overflow-hidden bg-[#3d2924]/16"
            >
              <motion.span
                animate={{
                  width: `${((activeIndex + 1) / reviewCount) * 100}%`,
                }}
                className="block h-full bg-[#7f5849]"
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease }}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                aria-label="Previous review"
                className="grid size-11 place-items-center rounded-full border border-[#3d2924]/22 text-[#34231f] transition-colors hover:border-[#34231f] hover:bg-[#34231f] hover:text-[#f8f3eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34231f] disabled:cursor-not-allowed disabled:opacity-30"
                disabled={reviewCount <= 1}
                onClick={() => swiper?.slidePrev()}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.5} />
              </button>
              <button
                aria-label="Next review"
                className="grid size-11 place-items-center rounded-full border border-[#3d2924]/22 text-[#34231f] transition-colors hover:border-[#34231f] hover:bg-[#34231f] hover:text-[#f8f3eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34231f] disabled:cursor-not-allowed disabled:opacity-30"
                disabled={reviewCount <= 1}
                onClick={() => swiper?.slideNext()}
                type="button"
              >
                <ArrowRight aria-hidden="true" size={17} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
