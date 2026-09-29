"use client";

import ProductCard from "@/components/ui/ProductCard";
import type { HomepageProduct } from "@/lib/homepage/types";
import { motion } from "motion/react";
import Title from "../ui/Title";

const customEase = [0.65, 0, 0.35, 1] as const;

export default function BestSellers({
  products,
}: {
  products: HomepageProduct[];
}) {
  if (!products.length) return null;
  return (
    <section
      id="home-bestsellers"
      className="scroll-mt-28 bg-[#f3eee5] py-12 text-[#1c1814] sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <h2 className="font-heading text-3xl sm:text-4xl"></h2>
        <p className="mt-2 text-sm text-black/55"></p>
        <div className="mb-14 flex flex-col items-start justify-between gap-7 md:mb-24 md:flex-row md:items-end md:gap-8">
          <div className="max-w-2xl">
            <Title
              className="uppercase"
              highlight="Best sellers"
              text="Best sellers"
              tone="charcoal"
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: customEase, delay: 0.2 }}
            className="text-[#5A5A5A] font-light max-w-md md:text-right"
          >
            Most purchased individual fragrances over the past 90 days.
          </motion.p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
