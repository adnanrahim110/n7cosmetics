"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import ProductCard from "@/components/ui/ProductCard";
import Title from "@/components/ui/Title";
import type { HomepageProduct } from "@/lib/homepage/types";

export default function AboutFeaturedCollection({
  products,
}: {
  products: HomepageProduct[];
}) {
  return (
    <section className="relative overflow-hidden bg-[#f8f5ee] py-20 text-[#1f1915] sm:py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-b from-[#eee8dc] to-transparent opacity-70" />
      <div className="relative mx-auto max-w-360 px-5 sm:px-8 lg:px-12">
        <div className="grid items-end gap-8 border-b border-[#2a211b]/14 pb-10 md:grid-cols-[1.15fr_0.85fr] md:pb-13">
          <div>
            <span className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#9b6a35]">
              Featured collection
            </span>
            <Title
              className="mt-6 text-[#1f1915]"
              highlight="signature scent."
              highlightClassName="text-[#a47442]"
              text="Find your signature scent."
              tone="custom"
            />
          </div>
          <p className="max-w-xl text-sm font-light leading-7 text-[#342a22]/58 sm:text-base sm:leading-8 md:justify-self-end">
            Explore a considered edit of fragrances chosen for depth,
            distinction and an unforgettable presence.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 pt-10 sm:gap-x-6 sm:gap-y-14 sm:pt-13 lg:grid-cols-4 lg:gap-x-10">
          {products.map((product) => (
            <div className="min-w-0" key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center sm:mt-13">
          <Link
            href="/yusuf-bhai-originals"
            className="group inline-flex items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#1f1915] transition-colors hover:text-[#9b6a35] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b6a35]"
          >
            Explore all fragrances
            <span className="grid size-10 place-items-center rounded-full border border-[#9b6a35]/45 transition-transform duration-500 group-hover:translate-x-1">
              <ArrowRight
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.4}
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
