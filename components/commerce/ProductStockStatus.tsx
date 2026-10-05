"use client";

import { useCommerce } from "./CommerceProvider";
import { cn } from "@/lib/cn";

export function SoldOutBadge({ slug }: { slug: string }) {
  const { getStock } = useCommerce();
  return getStock(slug).soldOut ? (
    <span
      className="mb-3 inline-block border border-white/30 bg-[#1A1A1A]/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
      role="status"
    >
      Sold Out
    </span>
  ) : null;
}

export default function ProductStockStatus({
  slug,
  className = "",
  showInStock = false,
  soldOutOnly = false,
}: {
  slug: string;
  className?: string;
  showInStock?: boolean;
  soldOutOnly?: boolean;
}) {
  const { getStock } = useCommerce();
  const stock = getStock(slug);
  const low =
    !stock.soldOut &&
    stock.availableQuantity !== null &&
    stock.availableQuantity <= 5;
  if ((!stock.soldOut && soldOutOnly) || (!stock.soldOut && !low && !showInStock)) return null;
  return (
    <span
      className={cn("block text-[10px] font-semibold uppercase tracking-[0.16em]", stock.soldOut ? "text-red-700" : low ? "text-[#9a5f2f]" : "text-[#66704b]", showInStock && (stock.soldOut ? "bg-red-50" : low ? "bg-amber-50" : "bg-emerald-50 text-emerald-800"), className)}
      aria-live="polite"
    >
      {stock.soldOut
        ? "Sold out"
        : low
          ? `Only ${stock.availableQuantity} left`
          : showInStock ? "In stock" : null}
    </span>
  );
}
