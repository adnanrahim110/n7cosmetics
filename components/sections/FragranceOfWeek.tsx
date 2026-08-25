"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import type { HomepageProduct, WeeklyContent } from "@/lib/homepage/types";
import { homeContent } from "../../content/home";

const ease = [0.22, 1, 0.36, 1] as const;

export default function FragranceOfWeek({
  product: selectedProduct,
  content,
}: {
  product: HomepageProduct | null;
  content: WeeklyContent;
}) {
  const shouldReduceMotion = useReducedMotion();
  const fallback = homeContent.weeklyPick;
  const detailHref = selectedProduct
    ? `/products/${selectedProduct.slug}`
    : content.ctaUrl;
  const product = selectedProduct
    ? {
        eyebrow: content.eyebrow,
        name: selectedProduct.name,
        description: content.description || selectedProduct.description,
        image: selectedProduct.image,
        price: selectedProduct.price,
        size: selectedProduct.size,
        notes: selectedProduct.notes,
        cta: content.ctaLabel,
      }
    : {
        ...fallback,
        eyebrow: content.eyebrow,
        description: content.description || fallback.description,
        cta: content.ctaLabel,
      };
  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.9,
      delay: shouldReduceMotion ? 0 : delay,
      ease,
    },
  });

  return (
    <section className="relative isolate overflow-hidden bg-[#eee7da] py-12 text-[#1a1713] sm:py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(circle_at_75%_50%,rgba(191,145,82,0.22),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-black/10 lg:block" />
      <div className="pointer-events-none absolute -left-8 top-1/2 -translate-y-1/2 font-kindred text-[clamp(9rem,21vw,22rem)] leading-none text-black/[0.035]">
        01
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-6">
          <div className="relative z-10 lg:pr-8">
            <motion.h2
              {...reveal(0.08)}
              className="max-w-xl font-heading text-4xl uppercase leading-[0.95] tracking-[0.06em] text-[#1a1713] sm:text-5xl md:text-6xl lg:text-[4.75rem]"
            >
              Fragrance
              <span className="mt-2 block font-light italic lowercase tracking-normal text-[#a67c49]">
                of the week
              </span>
            </motion.h2>

            <motion.div
              {...reveal(0.16)}
              className="mt-7 border-l border-[#a67c49]/60 pl-6"
            >
              <h3 className="font-heading text-2xl uppercase tracking-[0.14em] text-[#1a1713] md:text-3xl">
                <Link
                  className="transition-colors hover:text-[#a67c49]"
                  href={detailHref}
                >
                  {product.name}
                </Link>
              </h3>
              <p className="mt-4 max-w-md font-light leading-7 text-black/65">
                {product.description}
              </p>
            </motion.div>

            <motion.div
              {...reveal(0.32)}
              className="mt-7 flex flex-wrap items-center gap-7"
            >
              <Link
                href={detailHref}
                className="group relative overflow-hidden bg-[#1a1713] px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a67c49]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {product.cta}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 translate-y-full bg-[#a67c49] transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover:translate-y-0" />
              </Link>
              <div>
                <span className="block text-2xl text-[#1a1713]">
                  {product.price}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-black/45">
                  {product.size}
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{
              opacity: 0,
              scale: shouldReduceMotion ? 1 : 0.92,
              y: shouldReduceMotion ? 0 : 50,
            }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: shouldReduceMotion ? 0 : 1.25,
              delay: shouldReduceMotion ? 0 : 0.12,
              ease,
            }}
            className="group relative min-h-105 cursor-pointer sm:min-h-115 lg:min-h-120"
          >
            <Link
              aria-label={`View ${product.name}`}
              className="absolute inset-0 z-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a67c49]"
              href={detailHref}
            />
            <div className="absolute left-1/2 top-1/2 aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#a67c49]/20" />
            <div className="absolute left-1/2 top-1/2 aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(208,165,104,0.34),rgba(208,165,104,0.06)_55%,transparent_72%)]" />
            <div className="absolute -inset-12 z-10">
              <Image
                src={product.image}
                alt={`${product.name} fragrance bottle`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain drop-shadow-[0_38px_28px_rgba(75,48,22,0.24)] transition-transform duration-700 group-hover:-translate-y-2 group-hover:scale-[1.025]"
              />
            </div>
            <div className="absolute bottom-0 left-1/2 h-8 w-2/3 -translate-x-1/2 rounded-full bg-black/20 blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
