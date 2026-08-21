"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import type { AudienceContent } from "@/lib/homepage/types";

const ease = [0.22, 1, 0.36, 1] as const;

export default function AudienceCollections({ content }: { content: AudienceContent }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#dfe1db] py-24 text-[#17201d] md:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_84%_10%,rgba(247,245,237,0.76),transparent_34%),linear-gradient(135deg,#e5e6e0_0%,#d4d8d1_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(rgba(35,52,46,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(35,52,46,0.09)_1px,transparent_1px)] [background-size:112px_112px]" />

      <div className="mx-auto max-w-360 px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col justify-between gap-7 border-b border-[#24332e]/16 pb-8 md:flex-row md:items-end">
          <div>
            <motion.span
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.75, ease }}
              className="mb-4 block text-xs font-semibold uppercase tracking-[0.3em] text-[#756449]"
            >
              Find your expression
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.9, delay: shouldReduceMotion ? 0 : 0.08, ease }}
              className="font-heading text-4xl uppercase tracking-[0.08em] text-[#17201d] md:text-6xl"
            >
              {content.title}
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : 0.14, ease }}
            className="max-w-md font-light leading-7 text-[#263630]/58 md:text-right"
          >
            {content.description}
          </motion.p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {content.cards.map((collection, index) => (
            <motion.article
              key={collection.title}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: shouldReduceMotion ? 0 : 1, delay: shouldReduceMotion ? 0 : index * 0.12, ease }}
              className="group relative isolate min-h-165 overflow-hidden border border-[#22312c]/12 bg-[#100d0b] shadow-[0_24px_60px_rgba(40,55,49,0.12)] sm:min-h-187.5"
            >
              <Image
                src={collection.background}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="-z-20 object-cover transition-transform duration-1200 ease-[0.22,1,0.36,1] group-hover:scale-105"
              />
              <div className={`absolute inset-0 -z-10 ${index === 0 ? "bg-linear-to-t from-black via-black/45 to-black/10" : "bg-linear-to-t from-[#16080b] via-[#16080b]/45 to-transparent"}`} />
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_46%,rgba(209,162,100,0.16),transparent_38%)]" />

              <div className="absolute right-[3%] top-[7%] h-[68%] w-[58%] transition-transform duration-1000 ease-[0.22,1,0.36,1] group-hover:-translate-y-3 group-hover:scale-[1.035] sm:right-[6%] sm:w-[52%]">
                <Image
                  src={collection.image}
                  alt={`${collection.title} fragrance collection`}
                  fill
                  sizes="(max-width: 1024px) 70vw, 30vw"
                  className="object-contain drop-shadow-[0_35px_26px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-full border border-white/25 text-[10px] tracking-[0.15em] text-white/65 sm:left-9 sm:top-9">
                0{index + 1}
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 p-7 sm:p-10 md:p-12">
                <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d8b27e]">
                  {collection.eyebrow}
                </span>
                <h3 className="font-heading text-5xl uppercase tracking-[0.08em] text-[#f5eee4] sm:text-7xl">
                  {collection.title}
                </h3>
                <div className="mt-6 flex flex-col gap-6 border-t border-white/20 pt-6 sm:flex-row sm:items-end sm:justify-between">
                  <p className="max-w-sm font-light leading-6 text-white/62">
                    {collection.description}
                  </p>
                  <Link
                    href={collection.ctaUrl}
                    className="group/button flex shrink-0 items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f5eee4] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8b27e]"
                  >
                    {collection.ctaLabel}
                    <span className="flex size-10 items-center justify-center rounded-full border border-white/30 transition-all duration-500 group-hover/button:border-[#d8b27e] group-hover/button:bg-[#d8b27e] group-hover/button:text-[#17110c]">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
