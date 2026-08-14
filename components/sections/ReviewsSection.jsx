"use client";

import { motion, useReducedMotion } from "motion/react";
import { FaQuoteLeft } from "react-icons/fa";

import { homeContent } from "../../content/home";

const ease = [0.22, 1, 0.36, 1];

export default function ReviewsSection() {
  const shouldReduceMotion = useReducedMotion();
  const content = homeContent.reviewsSection;
  const [featuredReview, ...supportingReviews] = homeContent.reviews;

  return (
    <section className="relative isolate overflow-hidden bg-[#c9b1a7] py-24 text-[#211917] md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_8%,rgba(247,228,216,0.62),transparent_35%),linear-gradient(135deg,#d1bbb1_0%,#bea096_100%)]" />
      <div className="pointer-events-none absolute -right-10 top-1/2 -z-10 -translate-y-1/2 font-kindred text-[clamp(10rem,25vw,28rem)] uppercase leading-none text-[#37231f]/[0.035]">
        Notes
      </div>

      <div className="mx-auto max-w-360 px-4 sm:px-8 lg:px-12">
        <div className="mb-14 grid gap-8 border-b border-[#3d2924]/18 pb-9 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.75, ease }}
              className="mb-5 block text-[10px] font-semibold uppercase tracking-[0.34em] text-[#755346]"
            >
              {content.eyebrow}
            </motion.span>
            <motion.h2
              initial={{ clipPath: shouldReduceMotion ? "inset(0)" : "inset(100% 0 0 0)", y: shouldReduceMotion ? 0 : 28 }}
              whileInView={{ clipPath: "inset(0% 0 0 0)", y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 1.05, delay: shouldReduceMotion ? 0 : 0.05, ease }}
              className="font-heading text-5xl uppercase leading-[0.9] tracking-[0.06em] text-[#241a17] sm:text-6xl lg:text-7xl"
            >
              {content.title.lead}
              <span className="ml-3 font-light italic lowercase tracking-normal text-[#815b4c]">{content.title.accent}</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.85, delay: shouldReduceMotion ? 0 : 0.14, ease }}
            className="max-w-lg font-light leading-7 text-[#382723]/62 lg:justify-self-end lg:text-right"
          >
            {content.description}
          </motion.p>
        </div>

        <div className="grid border-y border-[#3d2924]/18 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.article
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-70px" }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.95, ease }}
            className="relative flex min-h-105 flex-col justify-between border-b border-[#3d2924]/18 py-10 lg:min-h-130 lg:border-b-0 lg:border-r lg:py-14 lg:pr-14"
          >
            <div className="flex items-center justify-between">
              <FaQuoteLeft className="text-2xl text-[#7f5849]" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#3d2924]/40">Entry / 01</span>
            </div>
            <p className="my-12 max-w-4xl font-heading text-3xl italic leading-[1.35] text-[#2b1e1a]/82 sm:text-4xl lg:text-5xl">
              &ldquo;{featuredReview.text}&rdquo;
            </p>
            <div className="flex items-center justify-between gap-6 border-t border-[#3d2924]/16 pt-6">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2f211d]/72">{featuredReview.author}</span>
                <span className="mt-2 block text-[9px] uppercase tracking-[0.22em] text-[#765246]">Verified client</span>
              </div>
              <span className="font-heading text-4xl italic text-[#725044]/36">N7</span>
            </div>
          </motion.article>

          <div className="lg:pl-12">
            {supportingReviews.map((review, index) => (
              <motion.article
                key={review.author}
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.82, delay: shouldReduceMotion ? 0 : index * 0.1, ease }}
                className="group flex min-h-64 flex-col justify-between border-b border-[#3d2924]/18 py-9 last:border-b-0 lg:min-h-65 lg:py-10"
              >
                <div className="flex items-center justify-between gap-5">
                  <FaQuoteLeft className="text-sm text-[#7f5849]" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#3d2924]/38">0{index + 2}</span>
                </div>
                <p className="my-7 font-heading text-2xl italic leading-relaxed text-[#2b1e1a]/76 sm:text-3xl">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center justify-between gap-4 text-[9px] font-semibold uppercase tracking-[0.24em]">
                  <span className="text-[#2f211d]/68">{review.author}</span>
                  <span className="text-[#765246]">Verified client</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
