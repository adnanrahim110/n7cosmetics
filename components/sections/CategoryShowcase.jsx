"use client";

import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { homeContent } from "../../content/home";

const ease = [0.22, 1, 0.36, 1];
const bgImages = [
  "/imgs/categories/cat_exotic.png",
  "/imgs/categories/cat_royal.png",
  "/imgs/categories/cat_unforgettable.png",
  "/imgs/categories/cat_masculine.png",
];

export default function CategoryShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const activeFeature = homeContent.features[activeIndex];

  return (
    <section className="relative isolate overflow-hidden bg-[#efe7d9] py-24 text-[#211c16] md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_84%_20%,rgba(255,252,244,0.9),transparent_36%),linear-gradient(130deg,#f2eadc_0%,#e9decc_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(94,72,47,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(94,72,47,0.12)_1px,transparent_1px)] [background-size:96px_96px]" />

      <div className="mx-auto max-w-360 px-4 sm:px-8 lg:px-12">
        <div className="mb-16 grid gap-8 border-b border-[#2d251d]/15 pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.75, ease }}
              className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8b6840]"
            >
              Curated collections
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.9, delay: shouldReduceMotion ? 0 : 0.08, ease }}
              className="font-heading text-5xl uppercase leading-[0.95] tracking-[0.07em] text-[#211c16] md:text-7xl"
            >
              The scent
              <span className="ml-3 font-light italic lowercase tracking-normal text-[#9b7446]">index</span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.15, ease }}
            className="max-w-sm font-light leading-7 text-[#30271e]/58 lg:text-right"
          >
            Navigate by mood, character and the impression you want to leave behind.
          </motion.p>
        </div>

        <div className="grid items-stretch gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:gap-14">
          <div className="flex flex-col justify-center">
            {homeContent.features.map((feature, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={feature.title}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={isActive}
                  className="group relative grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-[#30271e]/14 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8b6840] sm:grid-cols-[3.5rem_1fr_auto] sm:py-7"
                >
                  <span className={`text-[10px] font-semibold tracking-[0.2em] transition-colors duration-500 ${isActive ? "text-[#936e43]" : "text-[#30271e]/30"}`}>
                    0{index + 1}
                  </span>
                  <span>
                    <span className={`block font-heading text-2xl leading-tight transition-all duration-500 sm:text-3xl ${isActive ? "translate-x-2 text-[#211c16]" : "text-[#30271e]/42 group-hover:text-[#30271e]/70"}`}>
                      {feature.title}
                    </span>
                    <span className={`mt-2 block overflow-hidden text-sm font-light leading-6 text-[#30271e]/52 transition-all duration-500 ${isActive ? "max-h-16 translate-x-2 opacity-100" : "max-h-0 opacity-0"}`}>
                      {feature.description}
                    </span>
                  </span>
                  <span className={`flex size-10 items-center justify-center rounded-full border transition-all duration-500 ${isActive ? "rotate-45 border-[#936e43] bg-[#936e43] text-[#fff8ec]" : "border-[#30271e]/18 text-[#30271e]/35 group-hover:border-[#30271e]/35"}`}>
                    <ArrowUpRight className="size-4" />
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="category-active-line"
                      className="absolute bottom-0 left-0 h-px w-1/3 bg-[#936e43]"
                      transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative min-h-160 border border-[#392e23]/13 bg-[#e2d7c5] p-3 shadow-[0_30px_70px_rgba(90,67,42,0.12)] sm:min-h-180 sm:p-4 lg:min-h-190">
            <div className="relative h-[64%] min-h-92 overflow-hidden bg-[#c8baa5] sm:h-[68%]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 1.045 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.85, ease }}
                  className="absolute inset-0"
                >
                  <Image
                    src={bgImages[activeIndex]}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#241d16]/35 via-transparent to-white/12" />
                </motion.div>
              </AnimatePresence>

              <div className="absolute left-5 top-5 z-10 flex items-center gap-3 rounded-full border border-white/35 bg-[#f5ead8]/15 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.26em] text-white backdrop-blur-md sm:left-7 sm:top-7">
                <span className="size-1.5 rounded-full bg-[#ead0a9]" />
                Collection 0{activeIndex + 1}
              </div>
              <span className="absolute bottom-5 right-5 z-10 text-[9px] uppercase tracking-[0.3em] text-white/70 sm:bottom-7 sm:right-7">
                N7 / Selection
              </span>
            </div>

            <div className="absolute inset-x-3 bottom-3 top-[64%] bg-[#f5edde] px-6 py-7 sm:inset-x-4 sm:bottom-4 sm:top-[68%] sm:px-9 sm:py-8 md:px-11">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.title}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.58, delay: shouldReduceMotion ? 0 : 0.08, ease }}
                  className="flex h-full flex-col justify-between"
                >
                  <div>
                    <span className="mb-2 block text-[9px] font-semibold uppercase tracking-[0.28em] text-[#936e43]">
                      Selected by character
                    </span>
                    <h3 className="font-heading text-3xl leading-tight text-[#211c16] sm:text-4xl md:text-5xl">
                      {activeFeature.title}
                    </h3>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-5 border-t border-[#30271e]/14 pt-5">
                    <p className="max-w-md text-sm font-light leading-6 text-[#30271e]/55">
                      {activeFeature.description}
                    </p>
                    <button
                      type="button"
                      aria-label={`Explore ${activeFeature.title}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#30271e]/22 text-[#30271e] transition-all duration-500 hover:border-[#936e43] hover:bg-[#936e43] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#936e43]"
                    >
                      <ArrowUpRight className="size-4" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
