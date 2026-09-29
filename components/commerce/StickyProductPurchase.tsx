"use client";

import { useEffect, useState, type RefObject } from "react";
import CartAction from "./CartAction";
import { useCommerce, type CommerceProduct } from "./CommerceProvider";

export default function StickyProductPurchase({ product, quantity, target }: {
  product: CommerceProduct; quantity: number; target: RefObject<HTMLDivElement | null>;
}) {
  const { isCartOpen, cartPricing } = useCommerce();
  const [pastActions, setPastActions] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setPastActions(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0));
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);
  useEffect(() => {
    const check = () => setBlocked(Boolean(document.querySelector('[data-mobile-purchase-blocker], [aria-modal="true"]'))
      || Boolean(document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')));
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-modal", "data-mobile-purchase-blocker"] });
    const focusChanged = () => queueMicrotask(check);
    document.addEventListener("focusin", focusChanged);
    document.addEventListener("focusout", focusChanged);
    check();
    return () => { observer.disconnect(); document.removeEventListener("focusin", focusChanged); document.removeEventListener("focusout", focusChanged); };
  }, []);
  if (!pastActions || blocked || isCartOpen) return null;
  const price = cartPricing?.lines.find(line => line.slug === product.slug)?.unitPricePence ?? product.pricePence;
  return <aside aria-label="Quick purchase" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#967c55]/25 bg-[#f7f2e9] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
    <div className="mx-auto flex max-w-2xl items-center gap-4">
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-1 text-xs text-black/60">{quantity > 1 ? `${quantity} × ` : ""}{new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(price / 100)}</p></div>
      <CartAction product={product} quantity={quantity} className="inline-flex min-h-11 max-w-[55%] items-center justify-center bg-[#1c1814] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-40">Add to Bag</CartAction>
    </div>
  </aside>;
}
