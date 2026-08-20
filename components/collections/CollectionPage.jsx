"use client";

import {
  ArrowDown,
  ArrowRight,
  Eye,
  Heart,
  Search,
  ShoppingBag,
  Star,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const ease = [0.22, 1, 0.36, 1];
const productBatchSize = 12;

const collectionDesign = {
  "yusuf-bhai-originals": {
    accent: "#b88755",
    code: "01 / ORIGINALS",
    ghost: "ORIGINAL",
    indexTitle: "House signatures",
    nextHref: "/recreations",
    nextLabel: "The art of recreation",
  },
  recreations: {
    accent: "#809fa6",
    code: "02 / RECREATIONS",
    ghost: "RECREATE",
    indexTitle: "The scent index",
    nextHref: "/bundles",
    nextLabel: "Curated fragrance trios",
  },
  bundles: {
    accent: "#a9725f",
    code: "03 / BUNDLES",
    ghost: "THREE",
    indexTitle: "The complete wardrobe",
    nextHref: "/yusuf-bhai-originals",
    nextLabel: "Return to the originals",
  },
};

const formatPrice = (price) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);

function useProductDepth(shouldReduceMotion) {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [4, -4]), {
    stiffness: 180,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 180,
    damping: 24,
  });
  const imageX = useSpring(useTransform(pointerX, [-0.5, 0.5], [-11, 11]), {
    stiffness: 180,
    damping: 24,
  });
  const imageY = useSpring(useTransform(pointerY, [-0.5, 0.5], [-9, 9]), {
    stiffness: 180,
    damping: 24,
  });

  const onPointerMove = (event) => {
    if (shouldReduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return { rotateX, rotateY, imageX, imageY, onPointerMove, onPointerLeave };
}

function ProductActions({ product }) {
  return (
    <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 overflow-hidden py-2">
      <button
        type="button"
        aria-label={`Add ${product.name} to wishlist`}
        className="flex size-10 translate-x-14 items-center justify-center rounded-full border border-black/8 bg-white/88 text-[#211b16] opacity-0 backdrop-blur-md transition-all duration-500 ease-[0.22,1,0.36,1] group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 hover:bg-[#1c1814] hover:text-white focus-visible:translate-x-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b16]"
      >
        <Heart className="size-4" strokeWidth={1.4} />
      </button>
      <button
        type="button"
        aria-label={`Quick view ${product.name}`}
        className="flex size-10 translate-x-14 items-center justify-center rounded-full border border-black/8 bg-white/88 text-[#211b16] opacity-0 backdrop-blur-md transition-all delay-75 duration-500 ease-[0.22,1,0.36,1] group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 hover:bg-[#1c1814] hover:text-white focus-visible:translate-x-0 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b16]"
      >
        <Eye className="size-4" strokeWidth={1.4} />
      </button>
    </div>
  );
}

function Rating({ rating }) {
  return rating ? (
    <span className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <Star key={index} className="size-4 fill-[#997044] text-[#997044]" />
      ))}
      ({rating.toFixed(2)})
    </span>
  ) : (
    <span>New composition</span>
  );
}

function ProductStudy({
  product,
  index,
  design,
  shouldReduceMotion,
  isBundle,
}) {
  const depth = useProductDepth(shouldReduceMotion);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-65px" }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.9,
        delay: shouldReduceMotion ? 0 : (index % 4) * 0.07,
        ease,
      }}
      className={`group relative min-w-0 ${index % 4 === 1 ? "xl:translate-y-16" : index % 4 === 3 ? "xl:translate-y-8" : ""}`}
    >
      <div
        onPointerMove={depth.onPointerMove}
        onPointerLeave={depth.onPointerLeave}
        className={`relative aspect-3/4 w-full overflow-hidden ${isBundle ? "sm:aspect-[4/4.3]" : ""}`}
        style={{ perspective: 1100 }}
      >
        <div className="pointer-events-none absolute left-1/2 top-[47%] aspect-square w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#6e563f]/10" />
        <div className="pointer-events-none absolute left-1/2 top-[47%] aspect-square w-[48%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/42 blur-2xl" />
        <div className="pointer-events-none absolute bottom-[12%] left-1/2 h-5 w-[54%] -translate-x-1/2 rounded-full bg-[#3b2b20]/13 blur-xl" />

        <motion.div
          style={{
            rotateX: depth.rotateX,
            rotateY: depth.rotateY,
            x: depth.imageX,
            y: depth.imageY,
            transformStyle: "preserve-3d",
          }}
          className={`absolute z-20 ${isBundle ? "inset-[7%]" : "inset-[9%]"}`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain"
          />
        </motion.div>

        <ProductActions product={product} />
        <div className="absolute inset-x-0 bottom-px z-30 flex items-center justify-between gap-4 border-t border-black/8 bg-[#eee6da]/88 px-4 py-3 backdrop-blur-xl">
          <span className="truncate text-[8px] font-semibold uppercase tracking-[0.24em] text-black/46">
            {product.category}
          </span>
          <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.2em] text-black/52">
            <Rating rating={product.rating} />
          </span>
        </div>
        <div className="absolute bottom-0 left-0 h-px w-full bg-black/12">
          <span
            className="block h-full w-0 transition-all duration-700 ease-[0.22,1,0.36,1] group-hover:w-full"
            style={{ backgroundColor: design.accent }}
          />
        </div>
      </div>

      <div className="relative pt-2.5 text-center">
        <h2 className="mx-auto max-w-xs font-heading text-[1.45rem] leading-tight text-[#1c1814]">
          {product.name}
        </h2>
        <div className="mt-2.5 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
          <span className="font-heading text-[1.7rem] font-medium leading-none text-[#1c1814]">
            {formatPrice(product.price)}
          </span>
          <button
            type="button"
            className="group/bag flex h-11 shrink-0 items-stretch overflow-hidden border border-[#1c1814] bg-[#1c1814] text-white shadow-[0_9px_22px_rgba(28,24,20,0.13)] transition-shadow duration-500 hover:shadow-[0_13px_28px_rgba(28,24,20,0.2)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-black"
          >
            <span className="flex items-center px-4 text-[9px] font-semibold uppercase tracking-[0.2em]">
              Add to bag
            </span>
            <span
              className="flex w-10 items-center justify-center text-[#18130f] transition-[width] duration-500 group-hover/bag:w-12"
              style={{ backgroundColor: design.accent }}
            >
              <ShoppingBag
                className="size-3.5 transition-transform duration-500 group-hover/bag:-translate-y-0.5"
                strokeWidth={1.6}
              />
            </span>
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedStudy({
  product,
  index,
  design,
  shouldReduceMotion,
  isBundle,
}) {
  const depth = useProductDepth(shouldReduceMotion);
  const titleParts = product.name.split(", ");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 46 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 1, ease }}
      className="group relative min-h-155 overflow-hidden bg-[#e6dccd] sm:min-h-152 xl:col-span-2"
      onPointerMove={depth.onPointerMove}
      onPointerLeave={depth.onPointerLeave}
    >
      <div className="pointer-events-none absolute inset-4 border border-black/5.5" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-5 top-0 font-kindred text-[clamp(7rem,13vw,12rem)] uppercase leading-none text-transparent opacity-[0.17]"
        style={{ WebkitTextStroke: `1px ${design.accent}` }}
      >
        {product.name.split(/[ ,]/)[0]}
      </span>

      <div className="absolute inset-x-0 bottom-0 top-[31%] sm:left-[42%] sm:top-[5%]">
        <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/8" />
        <div className="pointer-events-none absolute bottom-[11%] left-1/2 h-7 w-[60%] -translate-x-1/2 rounded-full bg-black/13 blur-2xl" />
        <motion.div
          style={{
            x: depth.imageX,
            y: depth.imageY,
            rotateX: depth.rotateX,
            rotateY: depth.rotateY,
          }}
          className={`absolute ${isBundle ? "inset-[4%]" : "inset-[8%]"}`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 55vw"
            className="object-contain drop-shadow-[0_38px_30px_rgba(59,39,23,0.23)]"
          />
        </motion.div>
      </div>

      <div className="relative z-20 flex h-full min-h-80 flex-col justify-between p-8 sm:min-h-152 sm:w-[48%] sm:p-12 sm:pr-0">
        <div className="mt-24 sm:mt-auto">
          <span
            className="mb-4 block text-[9px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: design.accent }}
          >
            {product.category}
          </span>
          <h2 className="font-heading text-4xl leading-[0.98] text-[#201914] sm:text-5xl">
            {titleParts.map((part, partIndex) => (
              <span
                key={part}
                className={
                  partIndex ? "block font-light italic text-[#8d6744]" : "block"
                }
              >
                {part}
              </span>
            ))}
          </h2>
          <div className="mt-4 flex items-center gap-5 border-t border-black/14 pt-3">
            <span className="font-heading text-3xl tracking-wider text-[#201914]">
              {formatPrice(product.price)}
            </span>
            <Rating rating={product.rating} />
          </div>
          <button
            type="button"
            className="group/button relative mt-5 overflow-hidden bg-[#1b1714] px-7 py-4 text-[9px] font-semibold uppercase tracking-[0.23em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1714]"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Add to bag
              <ShoppingBag className="size-4" strokeWidth={1.4} />
            </span>
            <span
              className="absolute inset-0 translate-y-full transition-transform duration-500 ease-[0.65,0,0.35,1] group-hover/button:translate-y-0"
              style={{ backgroundColor: design.accent }}
            />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function CollectionHero({ collection, design, shouldReduceMotion }) {
  const heroProducts = collection.products.slice(0, 3);
  const isBundle = collection.slug === "bundles";

  return (
    <section className="relative isolate min-h-[94svh] overflow-hidden bg-[#090b0d] pt-31 text-[#f5eee6]">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_78%_37%,rgba(178,135,84,0.16),transparent_34%),linear-gradient(118deg,#090b0d_0%,#11100e_54%,#090b0d_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-[8%] -z-20 w-px bg-white/5.5 sm:left-[12%]" />
      <div className="pointer-events-none absolute inset-y-0 right-[8%] -z-20 w-px bg-white/5.5 sm:right-[12%]" />
      <span className="pointer-events-none absolute right-[2%] top-[15%] -z-10 font-kindred text-[clamp(8rem,21vw,24rem)] uppercase leading-none text-white/[0.018]">
        {design.ghost}
      </span>

      <div className="relative mx-auto flex min-h-[calc(94svh-7.75rem)] max-w-360 flex-col px-4 pb-10 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          className="flex items-center justify-between border-t border-white/16 pt-5 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/38"
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="transition-colors hover:text-white">
              Home
            </Link>
            <span className="h-px w-6 bg-white/18" />
            <span style={{ color: design.accent }}>{design.code}</span>
          </div>
          <span className="hidden sm:block">N7 / The fragrance house</span>
        </motion.div>

        <div className="relative flex grow flex-col pt-10 sm:pt-12">
          <motion.span
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.8,
              delay: shouldReduceMotion ? 0 : 0.05,
              ease,
            }}
            className="relative z-30 mb-5 flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.34em]"
            style={{ color: design.accent }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: design.accent }}
            />
            {collection.eyebrow}
          </motion.span>

          <motion.h1
            initial={{
              clipPath: shouldReduceMotion ? "inset(0)" : "inset(100% 0 0 0)",
              y: shouldReduceMotion ? 0 : 42,
            }}
            animate={{ clipPath: "inset(0% 0 0 0)", y: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 1.25,
              delay: shouldReduceMotion ? 0 : 0.08,
              ease,
            }}
            className="relative z-10 max-w-full font-heading text-[clamp(3.8rem,9.4vw,10rem)] uppercase leading-[0.76] tracking-[0.02em] text-[#f3ebe2]"
          >
            {collection.title.lead}
            <span
              className="block pl-[8%] font-light italic lowercase tracking-normal"
              style={{ color: design.accent }}
            >
              {collection.title.accent}
            </span>
          </motion.h1>

          <div className="relative mt-3 grid grow items-end gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.95,
                delay: shouldReduceMotion ? 0 : 0.22,
                ease,
              }}
              className="relative z-30 max-w-lg self-end pb-8 lg:pb-12"
            >
              <p className="border-l border-white/18 pl-5 text-sm font-light leading-7 text-white/54 sm:pl-7 sm:text-base">
                {collection.intro}
              </p>
              <div className="mt-7 flex items-center gap-5 text-[8px] font-semibold uppercase tracking-[0.24em] text-white/34">
                <span>{collection.products.length} compositions</span>
                <span
                  className="h-px w-10"
                  style={{ backgroundColor: design.accent }}
                />
                <span>Scroll to explore</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 1.35,
                delay: shouldReduceMotion ? 0 : 0.13,
                ease,
              }}
              className="relative z-20 h-100 sm:h-125 lg:absolute lg:right-[-2%] lg:top-[-34%] lg:h-[138%] lg:w-[62%]"
            >
              <div className="absolute left-1/2 top-[48%] aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/9" />
              <div className="absolute bottom-[4%] left-1/2 h-8 w-[62%] -translate-x-1/2 rounded-full bg-black/55 blur-2xl" />

              <div
                className={`absolute z-20 ${isBundle ? "inset-[3%]" : "bottom-[2%] left-[24%] top-0 w-[53%]"}`}
              >
                <Image
                  src={heroProducts[0].image}
                  alt={heroProducts[0].name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 70vw, 38vw"
                  className="object-contain drop-shadow-[0_44px_32px_rgba(0,0,0,0.58)]"
                />
              </div>

              {!isBundle && (
                <>
                  <div className="absolute bottom-[4%] left-[2%] z-10 h-[53%] w-[34%] opacity-62">
                    <Image
                      src={heroProducts[1].image}
                      alt={heroProducts[1].name}
                      fill
                      priority
                      sizes="22vw"
                      className="object-contain drop-shadow-[0_30px_24px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                  <div className="absolute bottom-[1%] right-0 z-30 h-[48%] w-[31%] opacity-72">
                    <Image
                      src={heroProducts[2].image}
                      alt={heroProducts[2].name}
                      fill
                      priority
                      sizes="20vw"
                      className="object-contain drop-shadow-[0_30px_24px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollectionIndex({
  collection,
  design,
  categories,
  activeCategory,
  setActiveCategory,
  query,
  setQuery,
  sortBy,
  setSortBy,
  resultCount,
}) {
  return (
    <div className="mb-18 border-y border-black/14">
      <div className="grid gap-7 py-7 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-7 overflow-x-auto pb-2 lg:pb-0">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
                className={`group/filter relative shrink-0 py-2 text-[9px] font-semibold uppercase tracking-[0.25em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${isActive ? "text-[#211a15]" : "text-black/34 hover:text-black/65"}`}
              >
                {category}
                <span
                  className={`absolute inset-x-0 bottom-0 h-px origin-left transition-transform duration-500 ${isActive ? "scale-x-100" : "scale-x-0 group-hover/filter:scale-x-100"}`}
                  style={{ backgroundColor: design.accent }}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-5 sm:gap-8">
          <label className="group/search relative flex min-w-0 items-center border-b border-black/18 pb-2 transition-colors focus-within:border-black/50 sm:min-w-60">
            <Search className="mr-3 size-3.5 shrink-0 text-black/36" />
            <span className="sr-only">Search collection</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or house"
              className="min-w-0 flex-1 bg-transparent text-[10px] uppercase tracking-[0.16em] text-black outline-none placeholder:text-black/30"
            />
          </label>
          <label className="relative shrink-0 border-b border-black/18 pb-2">
            <span className="sr-only">Sort collection</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="appearance-none bg-transparent pr-6 text-[9px] font-semibold uppercase tracking-[0.18em] text-black/48 outline-none"
            >
              <option value="featured">Curated order</option>
              <option value="rating">Highest rated</option>
              <option value="price-low">Price ascending</option>
              <option value="price-high">Price descending</option>
              <option value="name">Name A–Z</option>
            </select>
            <ArrowDown className="pointer-events-none absolute right-0 top-0.5 size-3 text-black/35" />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-black/9 py-4 text-[8px] font-semibold uppercase tracking-[0.25em] text-black/32">
        <span>{resultCount} compositions in view</span>
        <span>{collection.title.accent} / N7</span>
      </div>
    </div>
  );
}

export default function CollectionPage({ collection }) {
  const design = collectionDesign[collection.slug];
  const shouldReduceMotion = useReducedMotion();
  const infiniteScrollTriggerRef = useRef(null);
  const [activeCategory, setActiveCategoryState] = useState("All");
  const [query, setQueryState] = useState("");
  const [sortBy, setSortByState] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(productBatchSize);
  const isBundle = collection.slug === "bundles";
  const usesInfiniteScroll = collection.slug === "recreations";

  const categories = useMemo(
    () => [
      "All",
      ...new Set(collection.products.map((product) => product.category)),
    ],
    [collection.products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const products = collection.products.filter((product) => {
      const categoryMatches =
        activeCategory === "All" || product.category === activeCategory;
      const queryMatches =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });

    return [...products].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return collection.products.indexOf(a) - collection.products.indexOf(b);
    });
  }, [activeCategory, collection.products, query, sortBy]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const isCuratedView =
    activeCategory === "All" && !query && sortBy === "featured";

  useEffect(() => {
    const trigger = infiniteScrollTriggerRef.current;

    if (
      !usesInfiniteScroll ||
      !trigger ||
      visibleCount >= filteredProducts.length
    )
      return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setVisibleCount((count) =>
          Math.min(count + productBatchSize, filteredProducts.length),
        );
      },
      { rootMargin: "420px 0px", threshold: 0.01 },
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, [filteredProducts.length, usesInfiniteScroll, visibleCount]);

  const setActiveCategory = (category) => {
    setActiveCategoryState(category);
    setVisibleCount(productBatchSize);
  };
  const setQuery = (value) => {
    setQueryState(value);
    setVisibleCount(productBatchSize);
  };
  const setSortBy = (value) => {
    setSortByState(value);
    setVisibleCount(productBatchSize);
  };

  return (
    <>
      <CollectionHero
        collection={collection}
        design={design}
        shouldReduceMotion={shouldReduceMotion}
      />

      <section className="relative isolate overflow-hidden bg-[#f3eee5] py-24 text-[#1c1814] md:py-32">
        <div className="pointer-events-none absolute inset-y-0 left-[12%] -z-10 w-px bg-black/[0.035]" />
        <div className="pointer-events-none absolute inset-y-0 right-[12%] -z-10 w-px bg-black/[0.035]" />
        <span className="pointer-events-none absolute -right-7 top-18 -z-10 font-kindred text-[clamp(9rem,22vw,25rem)] uppercase leading-none text-[#2a2018]/2.5">
          INDEX
        </span>

        <div className="mx-auto max-w-360 px-4 sm:px-8 lg:px-12">
          <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.85, ease }}
            >
              <span className="mb-5 flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8d6745]">
                <span
                  className="h-px w-10"
                  style={{ backgroundColor: design.accent }}
                />
                Complete collection / {design.code}
              </span>
              <h2 className="font-heading text-5xl uppercase leading-[0.88] tracking-wider text-[#1d1814] sm:text-6xl lg:text-7xl">
                {design.indexTitle}
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.85,
                delay: shouldReduceMotion ? 0 : 0.1,
                ease,
              }}
              className="lg:justify-self-end lg:text-right"
            >
              <p className="max-w-xl font-heading text-xl italic text-[#3b2e24]/66 sm:text-2xl">
                &ldquo;{collection.statement}&rdquo;
              </p>
              <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.26em] text-black/32">
                A collection composed by Yusuf Bhai
              </p>
            </motion.div>
          </div>

          <CollectionIndex
            collection={collection}
            design={design}
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            query={query}
            setQuery={setQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            resultCount={filteredProducts.length}
          />

          <AnimatePresence mode="popLayout">
            {visibleProducts.length ? (
              <motion.div
                key={`${activeCategory}-${query}-${sortBy}`}
                layout
                className={`grid grid-cols-1 gap-x-10 gap-y-22 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isBundle ? "xl:grid-cols-3" : ""}`}
              >
                {visibleProducts.map((product, index) => {
                  const isFeatured =
                    isCuratedView &&
                    (index === 0 || (!isBundle && index === 9));
                  return isFeatured ? (
                    <FeaturedStudy
                      key={`${product.name}-${product.category}`}
                      product={product}
                      index={index}
                      design={design}
                      shouldReduceMotion={shouldReduceMotion}
                      isBundle={isBundle}
                    />
                  ) : (
                    <ProductStudy
                      key={`${product.name}-${product.category}`}
                      product={product}
                      index={index}
                      design={design}
                      shouldReduceMotion={shouldReduceMotion}
                      isBundle={isBundle}
                    />
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-90 flex-col items-center justify-center border-y border-black/12 text-center"
              >
                <span className="font-kindred text-7xl text-black/5.5">00</span>
                <span className="mt-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-black/38">
                  No composition matches this edit
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-6 border-b border-black/35 pb-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-black"
                >
                  Return to the complete collection
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {usesInfiniteScroll && visibleCount < filteredProducts.length && (
            <div
              ref={infiniteScrollTriggerRef}
              role="status"
              aria-live="polite"
              className="mt-24 flex min-h-20 flex-col items-center justify-center"
            >
              <div className="mb-6 h-px w-36 overflow-hidden bg-black/12">
                <motion.div
                  className="h-full origin-left"
                  initial={false}
                  animate={{
                    width: `${Math.min(100, (visibleCount / filteredProducts.length) * 100)}%`,
                  }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease }}
                  style={{ backgroundColor: design.accent }}
                />
              </div>
              <div className="flex items-center gap-4 text-[8px] font-semibold uppercase tracking-[0.28em] text-black/38">
                <motion.span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }
                  }
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{ backgroundColor: design.accent }}
                />
                Revealing the next compositions
                <span className="text-black/24">
                  {Math.min(visibleCount, filteredProducts.length)} /{" "}
                  {filteredProducts.length}
                </span>
              </div>
            </div>
          )}

          {!usesInfiniteScroll && visibleCount < filteredProducts.length && (
            <div className="mt-24 flex flex-col items-center">
              <div className="mb-6 h-px w-36 overflow-hidden bg-black/12">
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(100, (visibleCount / filteredProducts.length) * 100)}%`,
                    backgroundColor: design.accent,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setVisibleCount((count) => count + productBatchSize)
                }
                className="group flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.28em] text-black/52 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-5 focus-visible:outline-black"
              >
                Continue the index
                <ArrowDown className="size-4 transition-transform duration-300 group-hover:translate-y-1" />
              </button>
            </div>
          )}

          <div className="mt-28 border-t border-black/14 pt-12 md:mt-36 md:pt-16">
            {collection.disclaimer && (
              <div className="mb-14 grid gap-6 border-b border-black/10 pb-10 md:grid-cols-[0.3fr_1fr]">
                <span className="text-[8px] font-semibold uppercase tracking-[0.28em] text-black/35">
                  A note on recreations
                </span>
                <p className="max-w-4xl text-xs font-light leading-6 text-black/46">
                  {collection.disclaimer}
                </p>
              </div>
            )}

            <Link href={design.nextHref} className="group/next block">
              <div className="flex items-center justify-between text-[8px] font-semibold uppercase tracking-[0.28em] text-black/36">
                <span>Continue your discovery</span>
                <span>Next collection</span>
              </div>
              <div className="mt-7 flex items-end justify-between gap-6 border-b border-black/16 pb-7 transition-colors duration-500 group-hover/next:border-black/48">
                <h2 className="max-w-5xl font-heading text-4xl uppercase leading-[0.92] tracking-[0.04em] text-[#1c1814] sm:text-6xl lg:text-8xl">
                  {design.nextLabel}
                </h2>
                <span className="flex size-13 shrink-0 items-center justify-center rounded-full border border-black/20 text-black transition-all duration-500 group-hover/next:-rotate-45 group-hover/next:border-black group-hover/next:bg-black group-hover/next:text-white sm:size-16">
                  <ArrowRight className="size-5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
