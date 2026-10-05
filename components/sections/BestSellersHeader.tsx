"use client";

import { useReducedMotion } from "motion/react";
import * as motion from "motion/react-m";
import Title from "@/components/ui/Title";

const customEase = [0.65, 0, 0.35, 1] as const;

export default function BestSellersHeader() {
  const reducedMotion = useReducedMotion();
  return (
    <div className="mb-14 flex flex-col items-start justify-between gap-2 md:mb-24 md:flex-row md:items-end md:gap-8">
      <div className="max-w-2xl">
        <Title id="home-bestsellers-title" className="uppercase" highlight="Best sellers" text="Best sellers" tone="charcoal" />
      </div>
      <motion.p
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reducedMotion ? 0 : 0.6, ease: customEase, delay: reducedMotion ? 0 : 0.2 }}
        className="max-w-md font-light text-[#5A5A5A] md:text-right"
      >
        Most purchased individual fragrances over the past 90 days.
      </motion.p>
    </div>
  );
}
