"use client";

import type { StorefrontPageComingSoonContent } from "../../lib/storefront-pages/config";
import { motion } from "motion/react";
import Image from "next/image";
import Title from "@/components/ui/Title";
import {
  collectionEase,
  type CollectionDesign,
} from "./collection-config";

interface ComingSoonPresentationProps {
  content: StorefrontPageComingSoonContent;
  design: CollectionDesign;
  shouldReduceMotion: boolean | null;
}

export function CollectionComingSoonCard({
  content,
  design,
  shouldReduceMotion,
}: ComingSoonPresentationProps) {
  return (
    <motion.article
      layout
      aria-labelledby="collection-coming-soon-title"
      className="relative min-h-150 overflow-hidden text-[#f6efe6] shadow-[0_35px_80px_-48px_rgba(18,11,7,0.88)] sm:col-span-2 sm:min-h-152 xl:col-span-2"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 46 }}
      style={{ backgroundColor: design.heroBase }}
      transition={{ duration: shouldReduceMotion ? 0 : 1, ease: collectionEase }}
      viewport={{ once: true, margin: "-70px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <span className="pointer-events-none absolute inset-4 border border-white/[0.07]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-40 size-96 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: design.heroSurface }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-44 right-[8%] size-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: design.accent }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 top-2 font-kindred text-[clamp(8rem,16vw,14rem)] uppercase leading-none text-transparent opacity-20"
        style={{ WebkitTextStroke: `1px ${design.accent}` }}
      >
        Soon
      </span>

      <div className="absolute inset-x-0 bottom-0 top-[46%] sm:bottom-[3%] sm:left-[48%] sm:right-[2%] sm:top-[8%]">
        {content.image ? (
          <>
            <span className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <span className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[52%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] blur-2xl" />
            <span className="pointer-events-none absolute bottom-[10%] left-1/2 h-7 w-[58%] -translate-x-1/2 rounded-full bg-black/35 blur-2xl" />
            <motion.div
              className="absolute inset-[8%]"
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.94 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.12, duration: shouldReduceMotion ? 0 : 1.1, ease: collectionEase }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
              <Image
                alt={content.title}
                className="object-contain drop-shadow-[0_42px_32px_rgba(0,0,0,0.36)]"
                fill
                sizes="(max-width: 640px) 100vw, 55vw"
                src={content.image}
              />
            </motion.div>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
            <span className="grid aspect-square w-[62%] place-items-center rounded-full border border-white/10 bg-white/[0.025] font-kindred text-[clamp(4.5rem,10vw,8rem)] uppercase text-white/[0.055]">
              N7
            </span>
          </div>
        )}
      </div>

      <div className="relative z-10 flex min-h-150 flex-col justify-between p-7 sm:min-h-152 sm:w-[54%] sm:p-12 sm:pr-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.045] px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/58 backdrop-blur-sm">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: design.accent }} />
            Coming soon
          </span>
          <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-white/28">Private preview</span>
        </div>

        <div className="mb-[44%] mt-12 sm:mb-0 sm:mt-auto">
          <span
            className="mb-4 block text-[9px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: design.accent }}
          >
            {content.eyebrow}
          </span>
          <Title
            className="text-[#f6efe6]"
            id="collection-coming-soon-title"
            text={content.title}
            tone="custom"
          />
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/52 sm:text-[15px]">
            {content.description}
          </p>
          <div className="mt-7 flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/32">
            <span className="h-px w-12" style={{ backgroundColor: design.accent }} />
            The next chapter
          </div>
        </div>
      </div>
    </motion.article>
  );
}
