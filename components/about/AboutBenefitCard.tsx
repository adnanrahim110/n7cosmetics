"use client";

import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export interface AboutBenefit {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
}

interface AboutBenefitCardProps {
  benefit: AboutBenefit;
  index: number;
  total: number;
}

export default function AboutBenefitCard({
  benefit,
  index,
  total,
}: AboutBenefitCardProps) {
  const reduceMotion = useReducedMotion();
  const Icon = benefit.icon;

  return (
    <motion.article
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: reduceMotion ? 0 : 0.9,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative min-h-68 px-2 py-10 sm:px-5 lg:px-7 lg:py-12 lg:first:pl-0 lg:last:pr-0",
        index < total - 1 && "border-b border-white/10",
        index % 2 === 0 && "sm:border-r sm:border-white/10",
        index < 2 ? "sm:border-b sm:border-white/10" : "sm:border-b-0",
        index < total - 1
          ? "lg:border-r lg:border-white/10"
          : "lg:border-r-0",
        "lg:border-b-0",
      )}
    >
      <div className="flex items-center justify-between text-[#c99b69]">
        <Icon aria-hidden="true" className="size-8" strokeWidth={0.9} />
        <span className="text-[8px] font-semibold tracking-[0.26em] text-white/50">
          {benefit.number}
        </span>
      </div>
      <h3 className="mt-12 font-heading text-2xl leading-tight tracking-normal text-[#f4eadf] sm:text-3xl">
        {benefit.title}
      </h3>
      <p className="mt-4 max-w-xs text-xs font-light leading-6 text-white/70 sm:text-sm">
        {benefit.description}
      </p>
      <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[#c99b69] transition-transform duration-700 group-hover:scale-x-100 motion-reduce:transition-none" />
    </motion.article>
  );
}
