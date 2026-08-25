"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import CartAction from "@/components/commerce/CartAction";
import { useCommerce } from "@/components/commerce/CommerceProvider";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useCommerce();

  return (
    <div className="min-h-screen bg-[#f3eee5] pb-16 pt-40 text-[#1c1814] sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
          Saved for later
        </p>
        <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Wishlist</h1>

        {wishlist.length ? (
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:mt-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            {wishlist.map((item) => (
              <article className="group relative mx-auto w-full max-w-sm cursor-pointer sm:max-w-none" key={item.slug}>
                <Link
                  aria-label={`View ${item.name}`}
                  className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8d6745]"
                  href={`/products/${item.slug}`}
                />
                <div className="pointer-events-none relative block aspect-3/4 bg-[#e8dfd1]">
                  <Image
                    alt={item.name}
                    className="object-contain p-5 sm:p-6"
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    src={item.image}
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words font-heading text-xl transition-colors group-hover:text-[#8d6745]">{item.name}</h2>
                    <p className="mt-1 text-sm text-black/45">{money(item.pricePence)}</p>
                  </div>
                  <button
                    aria-label={`Remove ${item.name} from wishlist`}
                    className="relative z-20 grid size-10 shrink-0 place-items-center"
                    onClick={() => toggleWishlist(item)}
                    type="button"
                  >
                    <Heart className="fill-current" size={18} />
                  </button>
                </div>
                <CartAction
                  className="relative z-20 mt-4 flex w-full items-center justify-center gap-2 border border-black px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.17em] hover:bg-black hover:text-white"
                  inCartClassName="relative z-20 mt-4 flex w-full items-center justify-center gap-2 border border-[#9a7048]/50 bg-[#e9dfd1] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#704e31] transition-colors hover:border-[#704e31] hover:bg-[#e2d4c1]"
                  product={item}
                  inCartChildren={
                    <>
                      <ArrowRight size={14} />
                      View in cart
                    </>
                  }
                >
                  <ShoppingBag size={14} />
                  Add to cart
                </CartAction>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 border-y border-black/10 py-16 text-center sm:mt-12 sm:py-20">
            <p className="font-heading text-2xl text-black/40 sm:text-3xl">Nothing saved yet</p>
            <Link
              className="mt-6 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
              href="/recreations"
            >
              Explore fragrances
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
