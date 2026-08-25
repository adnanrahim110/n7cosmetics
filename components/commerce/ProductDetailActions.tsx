"use client";

import { Check, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import CartAction from "./CartAction";
import type { CommerceProduct } from "./CommerceProvider";
import { useCommerce } from "./CommerceProvider";

export default function ProductDetailActions({ product, soldOut }: { product: CommerceProduct; soldOut: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const { isWishlisted, toggleWishlist } = useCommerce();
  const wishlisted = isWishlisted(product.slug);
  return (
    <div className="mt-8">
      <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] gap-3 sm:flex sm:items-center">
        <label className="flex min-h-11 items-center justify-between border border-black/20 px-3 py-2 text-sm sm:block sm:min-h-0">
          Qty
          <input
            aria-label="Quantity"
            className="ml-2 w-12 bg-transparent text-center outline-none"
            max={99}
            min={1}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            type="number"
            value={quantity}
          />
        </label>
        <CartAction
          className="order-3 col-span-2 flex min-h-11 items-center justify-center gap-3 bg-[#1c1814] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-40 sm:order-none sm:min-h-0 sm:flex-1 sm:px-6 sm:tracking-[0.18em]"
          inCartClassName="order-3 col-span-2 flex min-h-11 items-center justify-center gap-3 border border-[#9a7048]/55 bg-[#eee5d8] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#704e31] transition-colors hover:border-[#704e31] hover:bg-[#e6d8c6] sm:order-none sm:min-h-0 sm:flex-1 sm:px-6 sm:tracking-[0.18em]"
          disabled={soldOut}
          product={product}
          quantity={quantity}
          inCartChildren={
            <>
              <Check size={16} strokeWidth={1.7} />
              View in cart
            </>
          }
        >
          <ShoppingBag size={16} />
          {soldOut ? "Sold out" : "Add to cart"}
        </CartAction>
        <button
          aria-label="Toggle wishlist"
          aria-pressed={wishlisted}
          className="grid size-11 place-items-center border border-black/20"
          onClick={() => toggleWishlist(product)}
          type="button"
        >
          <Heart className={wishlisted ? "fill-current" : ""} size={18} />
        </button>
      </div>
    </div>
  );
}
