"use client";

import ProductCard from "@/components/ui/ProductCard";
import { slugify } from "@/lib/admin/form";
import type { StorefrontCollectionPageContent } from "@/lib/storefront-pages/config";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  collectionEase,
  formatCollectionPrice,
  productBatchSize,
  productMatchesPriceBand,
  type CollectionDesign,
  type PriceBand,
  type SortOption,
} from "./collection-config";
import { CollectionComingSoonCard } from "./CollectionComingSoonCard";
import CollectionControls from "./CollectionControls";
import CollectionLoadingControls from "./CollectionLoadingControls";

interface CollectionCatalogProps {
  collection: StorefrontCollectionPageContent;
  design: CollectionDesign;
  shouldReduceMotion?: boolean | null;
}

export default function CollectionCatalog({
  collection,
  design,
  shouldReduceMotion: shouldReduceMotionOverride,
}: CollectionCatalogProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion =
    shouldReduceMotionOverride ?? prefersReducedMotion ?? false;
  const infiniteScrollTriggerRef = useRef<HTMLDivElement>(null);
  const [selectedCategories, setSelectedCategoriesState] = useState<string[]>(
    [],
  );
  const [selectedPriceBands, setSelectedPriceBandsState] = useState<
    PriceBand[]
  >([]);
  const [query, setQueryState] = useState("");
  const [sortBy, setSortByState] = useState<SortOption>("featured");
  const [visibleCount, setVisibleCount] = useState(productBatchSize);
  const isBundle = collection.slug === "bundles";
  const usesInfiniteScroll = collection.products.length > productBatchSize;
  const detail = collection.pageConfiguration.detail;

  const categories = useMemo(
    () => [...new Set(collection.products.map((product) => product.category))],
    [collection.products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const products = collection.products.filter((product) => {
      const categoryMatches =
        !selectedCategories.length ||
        selectedCategories.includes(product.category);
      const priceMatches =
        !selectedPriceBands.length ||
        selectedPriceBands.some((priceBand) =>
          productMatchesPriceBand(product.price, priceBand),
        );
      const queryMatches =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery);
      return categoryMatches && priceMatches && queryMatches;
    });

    return [...products].sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return collection.products.indexOf(a) - collection.products.indexOf(b);
    });
  }, [
    collection.products,
    query,
    selectedCategories,
    selectedPriceBands,
    sortBy,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

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

  const resetVisibleProducts = () => setVisibleCount(productBatchSize);
  const setSelectedCategories = (categories: string[]) => {
    setSelectedCategoriesState(categories);
    resetVisibleProducts();
  };
  const setSelectedPriceBands = (priceBands: PriceBand[]) => {
    setSelectedPriceBandsState(priceBands);
    resetVisibleProducts();
  };
  const setQuery = (value: string) => {
    setQueryState(value);
    resetVisibleProducts();
  };
  const setSortBy = (value: SortOption) => {
    setSortByState(value);
    resetVisibleProducts();
  };
  const resetControls = () => {
    setSelectedCategoriesState([]);
    setSelectedPriceBandsState([]);
    setQueryState("");
    setSortByState("featured");
    resetVisibleProducts();
  };

  return (
    <section
      id="collection-index"
      className="relative isolate scroll-mt-20 overflow-hidden bg-[#f3eee5] py-16 text-[#1c1814] sm:py-24 lg:py-32"
    >
      <span className="pointer-events-none absolute -right-7 top-18 -z-10 font-kindred text-[clamp(9rem,22vw,25rem)] uppercase leading-none text-[#2a2018]/2.5">
        INDEX
      </span>

      <div className="mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <div className="mb-10 grid gap-7 sm:mb-14 sm:gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.85,
              ease: collectionEase,
            }}
          >
            <span className="mb-5 flex items-center gap-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8d6745]">
              <span
                className="h-px w-10"
                style={{ backgroundColor: design.accent }}
              />
              {detail.eyebrow}
            </span>
            <h2 className="font-heading text-4xl uppercase leading-[0.88] tracking-wider text-[#1d1814] sm:text-5xl md:text-6xl lg:text-7xl">
              {detail.title}
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.85,
              delay: shouldReduceMotion ? 0 : 0.1,
              ease: collectionEase,
            }}
            className="lg:justify-self-end lg:text-right"
          >
            <p className="max-w-xl font-heading text-xl italic text-[#3b2e24]/66 sm:text-2xl">
              &ldquo;{detail.description}&rdquo;
            </p>
            <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.26em] text-black/32">
              {detail.credit}
            </p>
          </motion.div>
        </div>

        {collection.products.length ? (
          <CollectionControls
            collection={collection}
            design={design}
            categories={categories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedPriceBands={selectedPriceBands}
            setSelectedPriceBands={setSelectedPriceBands}
            query={query}
            setQuery={setQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onReset={resetControls}
          />
        ) : null}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${selectedCategories.join(".")}-${selectedPriceBands.join(".")}-${query}-${sortBy}`}
            layout
            className={`grid grid-cols-2 gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-18 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-22 xl:grid-cols-4 ${isBundle ? "xl:grid-cols-3" : ""}`}
          >
            {detail.comingSoon.enabled ? (
              <CollectionComingSoonCard
                content={detail.comingSoon}
                design={design}
                shouldReduceMotion={shouldReduceMotion}
              />
            ) : null}

            {visibleProducts.map((product, index) => (
              <motion.div
                key={`${product.name}-${product.category}`}
                layout
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 42 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-65px" }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.9,
                  delay: shouldReduceMotion ? 0 : (index % 4) * 0.07,
                  ease: collectionEase,
                }}
                className="min-w-0"
              >
                <ProductCard
                  product={{
                    slug: product.slug ?? slugify(product.name),
                    name: product.name,
                    image: product.image,
                    price: formatCollectionPrice(product.price),
                    pricePence: Math.round(product.price * 100),
                    rating: product.rating ?? 0,
                  }}
                />
              </motion.div>
            ))}

            {!visibleProducts.length &&
            !(detail.comingSoon.enabled && !collection.products.length) ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full flex min-h-90 flex-col items-center justify-center border-y border-black/12 text-center"
              >
                <span className="font-kindred text-7xl text-black/5.5">00</span>
                <span className="mt-4 text-[9px] font-semibold uppercase tracking-[0.3em] text-black/38">
                  {collection.products.length
                    ? "No composition matches this edit"
                    : "This edit is being prepared"}
                </span>
                {collection.products.length ? (
                  <button
                    type="button"
                    onClick={resetControls}
                    className="mt-6 border-b border-black/35 pb-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-black"
                  >
                    Return to the complete collection
                  </button>
                ) : (
                  <p className="mt-5 max-w-md text-sm leading-7 text-black/48">
                    New additions will appear here as soon as they become
                    available.
                  </p>
                )}
              </motion.div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <CollectionLoadingControls
          usesInfiniteScroll={usesInfiniteScroll}
          visibleCount={visibleCount}
          totalCount={filteredProducts.length}
          design={design}
          shouldReduceMotion={shouldReduceMotion}
          triggerRef={infiniteScrollTriggerRef}
          onLoadMore={() =>
            setVisibleCount((count) => count + productBatchSize)
          }
        />
      </div>
    </section>
  );
}
