"use client";

import { ArrowDown } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { CollectionPageContent } from "../../content/collections";
import {
  collectionEase,
  type CollectionDesign,
} from "./collection-config";

interface CollectionHeroProps {
  collection: CollectionPageContent;
  design: CollectionDesign;
  shouldReduceMotion: boolean | null;
}

export default function CollectionHero({
  collection,
  design,
  shouldReduceMotion,
}: CollectionHeroProps) {
  const heroProducts = design.heroProductIndexes.map(
    (index) => collection.products[index] ?? collection.products[0],
  );
  const edition = design.code.slice(0, 2);

  return (
    <section
      className="relative isolate min-h-[92svh] overflow-hidden pt-31 text-[#f7f0e8]"
      style={{ backgroundColor: design.heroBase }}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-30 opacity-90"
        style={{
          background: `radial-gradient(circle at 18% 62%, ${design.accent}32, transparent 34%), linear-gradient(112deg, ${design.heroBase} 0%, ${design.heroBase} 62%, #070707 145%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-y-0 left-[8%] -z-20 w-px bg-white/[0.045] sm:left-[12%]" />
      <div className="relative mx-auto flex min-h-[calc(92svh-7.75rem)] max-w-360 flex-col px-4 pb-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          className="flex items-center justify-between border-t border-white/16 py-4 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/44"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="transition-colors duration-300 hover:text-white"
            >
              Home
            </Link>
            <span className="h-px w-6 bg-white/18" />
            <span style={{ color: design.accent }}>{design.code}</span>
          </div>
          <div className="hidden items-center gap-8 sm:flex">
            <span>Dubai atelier</span>
            <span
              className="size-1 rounded-full"
              style={{ backgroundColor: design.accent }}
            />
            <span>Est. MMXVIII</span>
          </div>
        </motion.div>

        <div className="grid grow lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative z-20 flex flex-col justify-between py-9 pr-0 sm:py-11 lg:pr-14">
            <div>
              <motion.span
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.8,
                  delay: shouldReduceMotion ? 0 : 0.05,
                  ease: collectionEase,
                }}
                className="mb-7 flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: design.accent }}
              >
                <span
                  className="h-px w-10"
                  style={{ backgroundColor: design.accent }}
                />
                {collection.eyebrow}
              </motion.span>

              <motion.h1
                initial={{
                  clipPath: shouldReduceMotion
                    ? "inset(0)"
                    : "inset(0 100% 0 0)",
                }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.3,
                  delay: shouldReduceMotion ? 0 : 0.08,
                  ease: collectionEase,
                }}
                className="max-w-2xl font-heading text-[clamp(3.4rem,4.9vw,5.7rem)] uppercase leading-[0.96] tracking-[0.015em] text-[#f5eee6]"
              >
                {collection.title.lead}
                <span
                  className="mt-2 block font-light italic lowercase leading-[0.9] tracking-[-0.02em]"
                  style={{ color: design.accent }}
                >
                  {collection.title.accent}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.9,
                  delay: shouldReduceMotion ? 0 : 0.28,
                  ease: collectionEase,
                }}
                className="mt-7 max-w-sm font-heading text-lg italic leading-relaxed text-white/62 sm:text-xl"
              >
                &ldquo;{collection.statement}&rdquo;
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.9,
                delay: shouldReduceMotion ? 0 : 0.42,
                ease: collectionEase,
              }}
              className="mt-10 flex items-end justify-between gap-8 lg:mt-12"
            >
              <p className="max-w-xs text-[11px] font-light leading-6 text-white/46 sm:text-xs sm:leading-6">
                {collection.intro}
              </p>
              <a
                href="#collection-index"
                aria-label={`Explore ${collection.title.accent}`}
                className="group relative isolate flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 text-white transition-all duration-500 hover:border-transparent hover:text-[#17110d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:size-16"
              >
                <span
                  className="absolute inset-0 -z-10 scale-0 rounded-full transition-transform duration-500 ease-[0.22,1,0.36,1] group-hover:scale-100 group-focus-visible:scale-100"
                  style={{ backgroundColor: design.accent }}
                />
                <ArrowDown
                  className="size-5 transition-transform duration-500 group-hover:translate-y-1"
                  strokeWidth={1.3}
                />
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 46 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 1.15,
              delay: shouldReduceMotion ? 0 : 0.12,
              ease: collectionEase,
            }}
            className="relative min-h-135 overflow-hidden sm:min-h-155 lg:min-h-0"
            style={{ color: design.heroInk }}
          >
            <div
              className="pointer-events-none absolute -inset-x-[5%] inset-y-0"
              style={{
                background: `radial-gradient(ellipse 64% 82% at 50% 49%, ${design.heroSurface} 0%, ${design.heroSurface}f2 54%, ${design.heroSurface}a8 70%, transparent 100%)`,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(31,22,15,0.09)_1px,transparent_1px)] [background-size:84px_84px]"
              style={{
                maskImage:
                  "radial-gradient(ellipse 62% 78% at 50% 49%, black 38%, transparent 88%)",
              }}
            />
            <motion.div
              initial={{
                scale: shouldReduceMotion ? 1 : 0.72,
                opacity: 0,
              }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 1.5,
                delay: shouldReduceMotion ? 0 : 0.22,
                ease: collectionEase,
              }}
              className="pointer-events-none absolute left-[55%] top-[46%] aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-current/12"
            >
              <div className="absolute inset-[12%] rounded-full border border-current/10" />
              <div className="absolute inset-[27%] rounded-full border border-current/10" />
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current/10" />
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current/10" />
            </motion.div>

            <div className="absolute left-[16%] top-6 z-30 flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.28em] sm:top-8">
              <span>Olfactory archive</span>
              <span className="h-px w-9 bg-current/34" />
              <span>{edition}</span>
            </div>
            <div className="absolute inset-x-[10%] bottom-16 top-16 sm:inset-x-[12%] sm:bottom-18 sm:top-18">
              <motion.div
                initial={{
                  opacity: 0,
                  x: shouldReduceMotion ? 0 : -54,
                  y: shouldReduceMotion ? 0 : 52,
                }}
                animate={{ opacity: 0.72, x: 0, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.15,
                  delay: shouldReduceMotion ? 0 : 0.38,
                  ease: collectionEase,
                }}
                className="absolute bottom-[2%] left-[14%] z-10 h-[64%] w-[32%]"
              >
                <div className="relative size-full -rotate-2">
                  <Image
                    src={heroProducts[1].image}
                    alt={heroProducts[1].name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 28vw, 18vw"
                    className="object-contain drop-shadow-[0_28px_22px_rgba(33,22,15,0.28)]"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                  y: shouldReduceMotion ? 0 : 110,
                  scale: shouldReduceMotion ? 1 : 0.92,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.35,
                  delay: shouldReduceMotion ? 0 : 0.24,
                  ease: collectionEase,
                }}
                className="absolute inset-y-[3%] left-[27%] z-20 w-[46%]"
              >
                <div className="relative size-full">
                  <Image
                    src={heroProducts[0].image}
                    alt={heroProducts[0].name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 58vw, 34vw"
                    className="object-contain drop-shadow-[0_42px_30px_rgba(33,22,15,0.36)]"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                  x: shouldReduceMotion ? 0 : 54,
                  y: shouldReduceMotion ? 0 : 58,
                }}
                animate={{ opacity: 0.78, x: 0, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 1.15,
                  delay: shouldReduceMotion ? 0 : 0.44,
                  ease: collectionEase,
                }}
                className="absolute bottom-[2%] right-[14%] z-30 h-[61%] w-[31%]"
              >
                <div className="relative size-full rotate-2">
                  <Image
                    src={heroProducts[2].image}
                    alt={heroProducts[2].name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 26vw, 17vw"
                    className="object-contain drop-shadow-[0_28px_22px_rgba(33,22,15,0.3)]"
                  />
                </div>
              </motion.div>

              <div className="pointer-events-none absolute bottom-[1%] left-1/2 z-0 h-7 w-[70%] -translate-x-1/2 rounded-full bg-current/20 blur-2xl" />
            </div>

            <div className="absolute inset-x-[8%] bottom-0 z-40 grid grid-cols-3 border-x border-t border-current/14 bg-white/[0.07] backdrop-blur-sm">
              {collection.highlights.map((highlight, index) => (
                <div
                  key={highlight}
                  className="flex min-h-16 items-center gap-3 border-r border-current/14 px-4 last:border-r-0 sm:px-6"
                >
                  <span className="font-kindred text-xl text-current/24 sm:text-2xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[7px] font-semibold uppercase leading-4 tracking-[0.18em] text-current/66 sm:text-[8px]">
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex items-center justify-between border-t border-white/12 py-3 text-[7px] font-semibold uppercase tracking-[0.25em] text-white/30">
          <span>{collection.products.length} compositions in the archive</span>
          <span className="hidden sm:block">{design.ghost} / N7</span>
          <span>Scroll to discover</span>
        </div>
      </div>
    </section>
  );
}
