"use client";

import { Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { CommerceProduct } from "./CommerceProvider";
import { useCommerce } from "./CommerceProvider";

export default function ProductDetailActions({ product, soldOut }: { product: CommerceProduct; soldOut: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isWishlisted, toggleWishlist } = useCommerce();
  const wishlisted = isWishlisted(product.slug);
  return <div className="mt-8"><div className="flex items-center gap-3"><label className="border border-black/20 px-3 py-2 text-sm">Qty <input aria-label="Quantity" className="ml-2 w-12 bg-transparent text-center outline-none" max={99} min={1} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} type="number" value={quantity} /></label><button className="flex flex-1 items-center justify-center gap-3 bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={soldOut} onClick={() => addToCart(product, quantity)} type="button"><ShoppingBag size={16} />{soldOut ? "Sold out" : "Add to cart"}</button><button aria-label="Toggle wishlist" aria-pressed={wishlisted} className="grid size-11 place-items-center border border-black/20" onClick={() => toggleWishlist(product)} type="button"><Heart className={wishlisted ? "fill-current" : ""} size={18} /></button></div></div>;
}
