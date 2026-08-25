"use client";

import type { StorefrontCollectionPageContent } from "@/lib/storefront-pages/config";
import { ArrowDown } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { CollectionPageContent } from "../../content/collections";
import { slugify } from "../../lib/admin/form";
import { collectionEase } from "./collection-config";

export type ProductHeroContent = Pick<
  CollectionPageContent,
  "eyebrow" | "title" | "intro" | "products"
> &
  Partial<Pick<CollectionPageContent, "statement" | "highlights">> &
  Pick<StorefrontCollectionPageContent, "pageConfiguration" | "heroProducts">;

export interface ProductHeroDesign {
  accent: string;
  heroBase: string;
  heroSurface: string;
  heroInk?: string;
  code?: string;
  ghost?: string;
  heroProductIndexes?: readonly number[];
}

export interface ProductHeroProps {
  content: ProductHeroContent;
  design: ProductHeroDesign;
  shouldReduceMotion?: boolean | null;
  ctaHref?: string;
  ctaLabel?: string;
  itemLabel?: string;
}

export default function ProductHero({
  content,
  design,
  shouldReduceMotion: shouldReduceMotionOverride,
  ctaHref = "#collection-index",
  ctaLabel = "Explore products",
  itemLabel = "products",
}: ProductHeroProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion =
    shouldReduceMotionOverride ?? prefersReducedMotion ?? false;
  const heroContent = content.pageConfiguration.hero;
  const heroProducts = content.heroProducts?.length
    ? content.heroProducts
    : content.products;
  const selectedProducts = (
    content.heroProducts?.length
      ? content.heroProducts.map((_, index) => index)
      : design.heroProductIndexes?.length
        ? design.heroProductIndexes
        : heroProducts.map((_, index) => index)
  ).reduce<(typeof heroProducts)[number][]>((selected, index) => {
    const product = heroProducts[index];

    if (
      product &&
      !selected.some(
        (selectedProduct) =>
          selectedProduct.name === product.name &&
          selectedProduct.image === product.image,
      )
    ) {
      selected.push(product);
    }

    return selected;
  }, []);

  for (const product of heroProducts) {
    if (selectedProducts.length >= 3) break;

    if (
      !selectedProducts.some(
        (selectedProduct) =>
          selectedProduct.name === product.name &&
          selectedProduct.image === product.image,
      )
    ) {
      selectedProducts.push(product);
    }
  }

  const featuredProduct = selectedProducts[0];
  const supportingProducts = selectedProducts.slice(1, 3);
  const productCount = selectedProducts.length;
  const highlights = heroContent.highlights?.slice(0, 3) ?? [];
  const heroInk = design.heroInk ?? "#17130f";
  const collectionCode = design.code ?? "N7 / COLLECTION";
  const collectionMark = collectionCode.match(/\d+/)?.[0] ?? "N7";
  const resolvedItemLabel =
    content.products.length === 1 ? itemLabel.replace(/s$/i, "") : itemLabel;
  const countLabel = `${content.products.length} ${resolvedItemLabel}`;

  return (
    <section
      className="relative isolate min-h-[80svh] overflow-hidden pt-40 text-[#f7f0e8] sm:pt-44"
      style={{ backgroundColor: design.heroBase }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background: `radial-gradient(circle at 78% 35%, ${design.accent}1f 0%, transparent 31%), linear-gradient(118deg, ${design.heroBase} 0%, ${design.heroBase} 64%, #090a0a 145%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[14%] -z-10 w-px bg-white/[0.035]"
      />

      <div className="relative mx-auto flex min-h-[calc(80svh-6rem)] max-w-360 flex-col px-5 pb-7 sm:min-h-[calc(80svh-7rem)] sm:px-8 lg:min-h-[calc(80svh-7.5rem)] lg:px-12">
        <div className="grid grow items-center gap-9 py-9 lg:grid-cols-[minmax(0,0.92fr)_minmax(30rem,1.08fr)] lg:gap-14 lg:py-8">
          <div className="relative z-10 max-w-xl lg:pr-4">
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
                ease: collectionEase,
              }}
              className="flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.3em]"
              style={{ color: design.accent }}
            >
              <span
                aria-hidden="true"
                className="h-px w-8"
                style={{ backgroundColor: design.accent }}
              />
              {heroContent.eyebrow}
            </motion.div>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.9,
                delay: shouldReduceMotion ? 0 : 0.05,
                ease: collectionEase,
              }}
              className="mt-6 font-heading text-[clamp(2.6rem,13vw,4.4rem)] uppercase leading-[0.9] tracking-[-0.03em] text-[#f7f0e8] sm:text-[clamp(3.25rem,4.6vw,5.2rem)]"
            >
              <span className="block">{heroContent.title.lead}</span>
              <span
                className="mt-2 block font-light italic lowercase leading-none tracking-[-0.04em]"
                style={{ color: design.accent }}
              >
                {heroContent.title.accent}
              </span>
            </motion.h1>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.8,
                delay: shouldReduceMotion ? 0 : 0.12,
                ease: collectionEase,
              }}
              className="mt-7 max-w-lg border-t border-white/12 pt-6"
            >
              {heroContent.statement ? (
                <p className="font-heading text-base italic leading-7 text-white/68 sm:text-lg">
                  &ldquo;{heroContent.statement}&rdquo;
                </p>
              ) : null}
              <p
                className={`${heroContent.statement ? "mt-4" : ""} max-w-md text-[11px] font-light leading-6 text-white/46 sm:text-xs`}
              >
                {heroContent.intro}
              </p>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.7,
                delay: shouldReduceMotion ? 0 : 0.18,
              }}
              className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4"
            >
              <a
                href={ctaHref}
                className="group inline-flex items-center gap-3 text-[9px] font-semibold uppercase tracking-[0.23em] text-white/78 transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {ctaLabel}
                <span
                  className="grid size-9 place-items-center rounded-full border transition-transform duration-300 group-hover:translate-y-1"
                  style={{ borderColor: `${design.accent}88` }}
                >
                  <ArrowDown className="size-3.5" strokeWidth={1.4} />
                </span>
              </a>

              {highlights.length ? (
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex items-center gap-2 text-[7px] font-semibold uppercase tracking-[0.17em] text-white/38 sm:text-[8px]"
                    >
                      <span
                        aria-hidden="true"
                        className="size-1 rounded-full"
                        style={{ backgroundColor: design.accent }}
                      />
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          </div>

          <motion.figure
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.9,
              delay: shouldReduceMotion ? 0 : 0.08,
              ease: collectionEase,
            }}
            className="relative min-h-96 sm:min-h-120 lg:min-h-116"
            style={{ color: heroInk }}
          >
            {productCount === 1 && featuredProduct ? (
              <div
                className="absolute inset-x-[4%] inset-y-[2%] overflow-hidden border border-white/12 sm:inset-x-[8%] lg:inset-x-[10%]"
                style={{
                  background: `linear-gradient(138deg, ${design.heroSurface} 0%, ${design.heroSurface}e8 68%, ${design.accent}a8 148%)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 70px ${design.heroBase}52`,
                }}
              >
                <Link
                  aria-label={`View ${featuredProduct.name}`}
                  className="absolute inset-0 z-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  href={`/products/${featuredProduct.slug ?? slugify(featuredProduct.name)}`}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-[16%] w-px bg-current/8"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 right-[16%] w-px bg-current/8"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-[13%] left-1/2 h-8 w-[55%] -translate-x-1/2 rounded-full bg-current/14 blur-2xl"
                />
                <motion.div
                  initial={false}
                  animate={{ opacity: 1 }}
                  whileHover={
                    shouldReduceMotion ? undefined : { y: -6, scale: 1.01 }
                  }
                  transition={{ duration: 0.45, ease: collectionEase }}
                  className="absolute inset-x-[15%] inset-y-[3%] z-20 sm:inset-x-[19%]"
                >
                  <div className="relative size-full">
                    <Image
                      src={featuredProduct.image}
                      alt={featuredProduct.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 70vw, 30vw"
                      className="object-contain drop-shadow-[0_34px_26px_rgba(20,14,10,0.28)]"
                    />
                  </div>
                </motion.div>
                <div className="absolute inset-x-3 bottom-2 z-30 flex items-end justify-between gap-5 pt-3">
                  <span className="max-w-[72%] truncate text-[8px] font-semibold uppercase tracking-[0.2em] text-current/72 sm:text-[9px]">
                    {featuredProduct.name}
                  </span>
                </div>
              </div>
            ) : productCount === 2 ? (
              <div className="absolute inset-x-0 inset-y-[2%] grid grid-cols-2 gap-3 sm:gap-5">
                {selectedProducts.map((product, index) => (
                  <motion.div
                    key={`${product.name}-${product.image}`}
                    initial={false}
                    animate={{ opacity: 1 }}
                    whileHover={
                      shouldReduceMotion ? undefined : { y: index ? -4 : -6 }
                    }
                    transition={{ duration: 0.4, ease: collectionEase }}
                    className={`group relative min-h-0 overflow-hidden border border-white/12 ${index === 0 ? "mb-[8%]" : "mt-[8%]"}`}
                    style={{
                      background: `linear-gradient(${index ? "218deg" : "138deg"}, ${design.heroSurface} 0%, ${design.heroSurface}dd 70%, ${design.accent}96 145%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 24px 55px ${design.heroBase}48`,
                    }}
                  >
                    <Link
                      aria-label={`View ${product.name}`}
                      className="absolute inset-0 z-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      href={`/products/${product.slug ?? slugify(product.name)}`}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-y-0 left-[22%] w-px bg-current/8"
                    />
                    <div className="absolute inset-x-[7%] bottom-[12%] top-[3%] sm:inset-x-[10%] sm:bottom-[14%]">
                      <div className="relative size-full">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          priority
                          sizes="(max-width: 1024px) 43vw, 19vw"
                          className="object-contain drop-shadow-[0_28px_22px_rgba(20,14,10,0.26)] transition-transform duration-500 group-hover:scale-[1.025]"
                        />
                      </div>
                    </div>
                    <div className="absolute inset-x-1 bottom-1 z-30 pt-2.5">
                      <span className="block truncate text-[7px] font-semibold uppercase tracking-[0.18em] text-current/70 sm:text-[8px]">
                        {product.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <>
                <div
                  className={`absolute inset-y-[2%] left-0 overflow-hidden border border-white/12 ${supportingProducts.length ? "right-[31%]" : "right-0"}`}
                  style={{
                    background: `linear-gradient(138deg, ${design.heroSurface} 0%, ${design.heroSurface}e8 74%, ${design.accent}a8 148%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 70px ${design.heroBase}52`,
                  }}
                >
                  {featuredProduct ? (
                    <Link
                      aria-label={`View ${featuredProduct.name}`}
                      className="absolute inset-0 z-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      href={`/products/${slugify(featuredProduct.name)}`}
                    />
                  ) : null}
                  <div
                    aria-hidden="true"
                    className="absolute right-[-12%] top-[-28%] h-[165%] w-[46%] -rotate-12 border-x border-current/8 bg-white/[0.035]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-[17%] w-px bg-current/8"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute bottom-[13%] left-[48%] h-7 w-[50%] -translate-x-1/2 rounded-full bg-current/12 blur-2xl"
                  />

                  {featuredProduct ? (
                    <motion.div
                      initial={false}
                      animate={{ opacity: 1 }}
                      whileHover={
                        shouldReduceMotion ? undefined : { y: -6, scale: 1.01 }
                      }
                      transition={{ duration: 0.45, ease: collectionEase }}
                      className="absolute top-1/2 left-[48%] z-20 h-full w-[70%] -translate-1/2"
                    >
                      <div className="relative size-full">
                        <Image
                          src={featuredProduct.image}
                          alt={featuredProduct.name}
                          fill
                          priority
                          sizes="(max-width: 1024px) 42vw, 21vw"
                          className="object-contain drop-shadow-[0_34px_26px_rgba(20,14,10,0.28)]"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 grid place-items-center px-10 text-center text-[9px] font-semibold uppercase tracking-[0.24em] text-current/42">
                      The next edit is being prepared
                    </div>
                  )}
                </div>

                {supportingProducts.length ? (
                  <div
                    className="absolute inset-y-[8%] right-0 grid w-[27%] border-y border-white/12"
                    style={{
                      gridTemplateRows: `repeat(${supportingProducts.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {supportingProducts.map((product, index) => (
                      <motion.div
                        key={`${product.name}-${product.image}`}
                        initial={false}
                        animate={{ opacity: 1 }}
                        whileHover={shouldReduceMotion ? undefined : { x: -4 }}
                        transition={{ duration: 0.35, ease: collectionEase }}
                        className="group relative min-h-0 overflow-hidden border-b border-white/10 last:border-b-0"
                        style={{
                          background: `linear-gradient(115deg, ${design.heroSurface}1f 0%, transparent 78%)`,
                        }}
                      >
                        <Link
                          aria-label={`View ${product.name}`}
                          className="absolute inset-0 z-30 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                          href={`/products/${slugify(product.name)}`}
                        />
                        <div className="absolute inset-y-[5%] right-[4%] w-[82%]">
                          <div className="relative size-full">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              priority
                              sizes="(max-width: 1024px) 22vw, 10vw"
                              className="object-contain drop-shadow-[0_18px_15px_rgba(0,0,0,0.22)] transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          </div>
                        </div>
                        <span className="absolute bottom-1 left-1 z-20 max-w-[72%] truncate text-[6px] font-semibold uppercase tracking-[0.16em] text-white/42 sm:text-[7px]">
                          {product.name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
