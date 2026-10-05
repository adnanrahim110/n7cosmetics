"use client";

import { ArrowRight, ShoppingBag, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import Title from "@/components/ui/Title";
import CartDrawerItem from "./CartDrawerItem";
import CartPriceSummary from "./CartPriceSummary";
import FreeDeliveryProgress from "./FreeDeliveryProgress";
import { useCommerce } from "./CommerceProvider";

export default function CartDrawer({ onReady }: { onReady?: () => void }) {
  const {
    cart,
    cartCount,
    closeCart,
    isCartOpen,
    pricingLoading,
    pricingError,
  } = useCommerce();
  const shouldReduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => { onReady?.(); }, [onReady]);

  useEffect(() => {
    if (!isCartOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
      0,
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [closeCart, isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-100"
          exit={{ opacity: 0 }}
          initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        >
          <button
            aria-label="Close cart"
            className="absolute inset-0 h-full w-full cursor-default bg-[#130f0c]/55 backdrop-blur-[2px]"
            onClick={closeCart}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            aria-labelledby="cart-drawer-title"
            aria-modal="true"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden bg-[#f7f3eb] text-[#1c1814] shadow-[-24px_0_70px_rgba(20,14,9,0.2)]"
            exit={{ x: shouldReduceMotion ? 0 : "100%" }}
            id="cart-sidebar"
            initial={{ x: shouldReduceMotion ? 0 : "100%" }}
            role="dialog"
            transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <Title
                  className="text-xl leading-tight"
                  id="cart-drawer-title"
                  text="Shopping bag"
                  tone="ink"
                  variant="custom"
                />
                <p aria-live="polite" className="text-xs text-stone-600">
                  {cartCount} {cartCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                aria-label="Close cart"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-black/12 transition-colors hover:border-black hover:bg-[#1c1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1814] motion-reduce:transition-none"
                onClick={closeCart}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={16} strokeWidth={1.5} />
              </button>
            </div>

            {cart.length ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
                <div className="pt-3"><FreeDeliveryProgress compact /></div>
                <div className="divide-y divide-black/10 pb-2">
                  {cart.map((item) => (
                    <CartDrawerItem item={item} key={item.slug} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8 text-center">
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#9a7048]/25 bg-[#eee5d8] text-[#9a7048]">
                  <ShoppingBag aria-hidden="true" size={20} strokeWidth={1.3} />
                </span>
                <p className="mt-4 font-heading text-xl">Your bag is empty</p>
                <p className="mt-2 max-w-xs text-xs leading-5 text-stone-600">
                  Discover a fragrance and add it to your selection.
                </p>
                <Link
                  className="mt-5 inline-flex min-h-11 items-center justify-center bg-[#1c1814] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1814]"
                  href="/yusuf-bhai-originals"
                  onClick={closeCart}
                >
                  Explore fragrances
                </Link>
              </div>
            )}

            {cart.length ? (
              <div className="shrink-0 border-t border-black/10 bg-[#efe7db] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
                <CartPriceSummary compact />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    className="flex min-h-11 items-center justify-center border border-[#1c1814] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-white/45 active:bg-white/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1814] motion-reduce:transition-none"
                    href="/cart"
                    onClick={closeCart}
                  >
                    View cart
                  </Link>
                  <Link
                    className="flex min-h-11 items-center justify-center gap-2 bg-[#1c1814] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#735132] active:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1814] aria-disabled:cursor-wait aria-disabled:opacity-60 motion-reduce:transition-none"
                    href="/checkout"
                    aria-disabled={pricingLoading || Boolean(pricingError)}
                    onClick={(event) => { if (pricingLoading || pricingError) event.preventDefault(); else closeCart(); }}
                  >
                    Checkout <ArrowRight aria-hidden="true" size={14} />
                  </Link>
                </div>
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
