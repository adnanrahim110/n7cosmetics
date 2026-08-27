"use client";

import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import CartAction from "@/components/commerce/CartAction";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import Title from "@/components/ui/Title";
import type { HomepageProduct } from "@/lib/homepage/types";

export default function AboutFeaturedCollection({
  products,
}: {
  products: HomepageProduct[];
}) {
  const { isWishlisted, toggleWishlist } = useCommerce();

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

        <div className="grid gap-px bg-[#2a211b]/12 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => {
            const commerceProduct = {
              slug: product.slug,
              name: product.name,
              image: product.image,
              pricePence: product.pricePence,
            };
            const wishlisted = isWishlisted(product.slug);

            return (
              <article
                key={product.id}
                className="group relative flex min-h-140 cursor-pointer flex-col bg-[#f8f5ee] px-5 py-7 sm:min-h-152 sm:px-6 sm:py-8"
              >
                <Link
                  aria-label={`View ${product.name}`}
                  className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9b6a35]"
                  href={`/products/${product.slug}`}
                />

                <div className="pointer-events-none relative mt-3 block grow">
                  <div className="absolute inset-x-[12%] top-[18%] h-[58%] rounded-full bg-[radial-gradient(circle,rgba(169,119,67,0.16),transparent_68%)] opacity-60 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
                  <div className="absolute inset-x-[7%] inset-y-[5%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2 group-hover:scale-[1.035]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 23vw"
                      className="object-contain drop-shadow-[0_28px_24px_rgba(52,34,20,0.18)]"
                    />
                  </div>
                </div>

                <div className="border-t border-[#2a211b]/12 pt-5">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-[#9b6a35]">
                        {product.type}
                      </span>
                      <h3 className="mt-2 font-heading text-2xl tracking-normal text-[#1f1915]">
                        {product.name}
                      </h3>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[#1f1915]">
                      {product.price}
                    </span>
                  </div>

                  <div className="relative z-20 mt-5 flex items-center gap-2">
                    <CartAction
                      product={commerceProduct}
                      className="group/button inline-flex min-h-12 grow items-center justify-center gap-3 bg-[#a6733e] px-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-500 hover:bg-[#1f1915] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#9b6a35]"
                      inCartClassName="inline-flex min-h-12 grow items-center justify-center gap-3 border border-[#a6733e]/55 bg-[#eee5d8] px-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#78532f] transition-colors duration-500 hover:border-[#78532f] hover:bg-[#e7dac8] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#9b6a35]"
                      inCartChildren={
                        <>
                          <ArrowRight
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={1.5}
                          />
                          View in cart
                        </>
                      }
                    >
                      <ShoppingBag
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={1.5}
                      />
                      Add to bag
                    </CartAction>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(commerceProduct)}
                      aria-label={`${wishlisted ? "Remove" : "Add"} ${product.name} ${wishlisted ? "from" : "to"} wishlist`}
                      aria-pressed={wishlisted}
                      className="grid size-12 shrink-0 place-items-center border border-[#2a211b]/18 text-[#1f1915] transition-colors hover:border-[#9b6a35] hover:text-[#9b6a35] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#9b6a35]"
                    >
                      <Heart
                        aria-hidden="true"
                        className="size-4"
                        fill={wishlisted ? "currentColor" : "none"}
                        strokeWidth={1.4}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
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
