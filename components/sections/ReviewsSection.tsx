"use client";

import Title from "@/components/ui/Title";
import type { ReviewsContent } from "@/lib/homepage/types";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-m";
import { useMemo, useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import type { SwiperOptions } from "swiper/types";
import "swiper/css";
import ViewportSwiper from "@/components/ui/ViewportSwiper";
import HomepageReviewCard from "./HomepageReviewCard";

const ease = [0.22, 1, 0.36, 1] as const;
const loadReviewModules = () => import("@/components/ui/swiper-review-features").then(module => module.default);

export default function ReviewsSection({
  content,
}: {
  content: ReviewsContent;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canNavigate, setCanNavigate] = useState(false);
  const originalCount = content.reviews.length;
  const swiperOptions = useMemo<SwiperOptions>(() => ({
    autoplay: shouldReduceMotion || originalCount <= 1 ? false : { delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true },
    breakpoints: {
      480: { slidesPerView: Math.min(2.1, originalCount), spaceBetween: 12 },
      640: { slidesPerView: Math.min(2.3, originalCount), spaceBetween: 16 },
      768: { slidesPerView: Math.min(2.6, originalCount), spaceBetween: 20 },
      1024: { slidesPerView: Math.min(3, originalCount), spaceBetween: 24 },
      1280: { slidesPerView: Math.min(3, originalCount), spaceBetween: 28 },
    },
    grabCursor: originalCount > 1,
    keyboard: { enabled: true },
    rewind: originalCount > 1,
    slidesPerView: Math.min(2, originalCount),
    spaceBetween: 10,
    watchOverflow: true,
    on: {
      init: instance => { setSwiper(instance); setCanNavigate(!instance.isLocked); },
      slideChange: instance => setActiveIndex(instance.realIndex),
      lock: () => setCanNavigate(false),
      unlock: () => setCanNavigate(true),
      resize: instance => setCanNavigate(!instance.isLocked),
      beforeDestroy: () => { setSwiper(null); setCanNavigate(false); },
    },
  }), [shouldReduceMotion, originalCount]);

  if (!originalCount) return null;

  const currentReviewIndex = Math.min(activeIndex + 1, originalCount);

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
          <ViewportSwiper
            label="Customer reviews"
            loadModules={loadReviewModules}
            options={swiperOptions}
            className="overflow-visible!"
          >
            {content.reviews.map((review, index) => (
              <div
                className="swiper-slide flex h-auto!"
                key={`${review.author}-${index}`}
              >
                <HomepageReviewCard review={review} />
              </div>
            ))}
          </ViewportSwiper>

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
                className="grid size-11 place-items-center rounded-full border border-[#1C1814]/15 bg-white text-[#1C1814] shadow-xs transition-colors duration-200 hover:border-[#1C1814] hover:bg-[#1C1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
                disabled={!swiper || !canNavigate || originalCount <= 1}
                onClick={() => swiper?.slidePrev()}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.5} />
              </button>
              <button
                aria-label="Next review"
                className="grid size-11 place-items-center rounded-full border border-[#1C1814]/15 bg-white text-[#1C1814] shadow-xs transition-colors duration-200 hover:border-[#1C1814] hover:bg-[#1C1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#967C55] disabled:cursor-not-allowed disabled:opacity-30 motion-reduce:transition-none"
                disabled={!swiper || !canNavigate || originalCount <= 1}
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
