"use client";

import { useCommerce } from "./CommerceProvider";

export function SoldOutBadge({ slug }: { slug: string }) {
  const { getStock } = useCommerce();
  return getStock(slug).soldOut ? <span className="mb-3 inline-block border border-white/30 bg-[#1A1A1A]/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white" role="status">Sold Out</span> : null;
}

export default function ProductStockStatus({ slug, className = "" }: { slug: string; className?: string }) {
  const { getStock } = useCommerce();
  const stock = getStock(slug);
  const low = !stock.soldOut && stock.availableQuantity !== null && stock.availableQuantity <= 5;
  return <span className={`block text-[10px] font-semibold uppercase tracking-[0.16em] ${stock.soldOut ? "text-red-700" : low ? "text-[#9a5f2f]" : "text-[#66704b]"} ${className}`} aria-live="polite">
    {stock.soldOut ? "Sold out" : low ? `Only ${stock.availableQuantity} left` : "In stock"}
  </span>;
}
