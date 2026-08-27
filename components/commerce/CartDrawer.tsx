"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { commerceProductHref, useCommerce } from "./CommerceProvider";
import Title from "@/components/ui/Title";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotalPence,
    closeCart,
    isCartOpen,
    removeFromCart,
    updateQuantity,
  } = useCommerce();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isCartOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
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
          className="fixed inset-0 z-[100]"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
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
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-[#f7f3eb] text-[#1c1814] shadow-[-24px_0_70px_rgba(20,14,9,0.2)]"
            exit={{ x: "100%" }}
            id="cart-sidebar"
            initial={{ x: "100%" }}
            role="dialog"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-5 sm:px-7 sm:py-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#9a7048]">
                  Your selection
                </p>
                <Title
                  className="mt-1"
                  id="cart-drawer-title"
                  text="Shopping bag"
                  tone="gold"
                  variant="compact"
                />
              </div>
              <button
                aria-label="Close cart"
                className="grid size-11 place-items-center rounded-full border border-black/12 transition-colors hover:border-black hover:bg-[#1c1814] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1c1814]"
                onClick={closeCart}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={19} strokeWidth={1.5} />
              </button>
            </div>

            <p className="border-b border-black/8 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45 sm:px-7" aria-live="polite">
              {cartCount} {cartCount === 1 ? "item" : "items"} in your bag
            </p>

            {cart.length ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-7">
                <div className="divide-y divide-black/10">
                  {cart.map((item) => (
                    <article className="group relative grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] gap-4 py-5" key={item.slug}>
                      <Link
                        aria-label={`View ${item.name}`}
                        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a7048]"
                        href={commerceProductHref(item)}
                        onClick={closeCart}
                      />
                      <div className="pointer-events-none relative aspect-square bg-[#ebe2d5]">
                        <Image
                          alt={item.name}
                          className="object-contain p-2.5"
                          fill
                          sizes="88px"
                          src={item.image}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="block break-words font-heading text-lg leading-tight transition-colors group-hover:text-[#9a7048]">{item.name}</h3>
                            <p className="mt-1.5 text-xs text-black/48">{money(item.pricePence)}</p>
                          </div>
                          <button
                            aria-label={`Remove ${item.name} from cart`}
                            className="relative z-20 grid size-8 shrink-0 place-items-center text-black/35 transition-colors hover:text-red-700"
                            onClick={() => removeFromCart(item.slug)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={15} strokeWidth={1.5} />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="relative z-20 inline-flex h-9 items-center border border-black/15 bg-white/35">
                            <button
                              aria-label={`Decrease ${item.name} quantity`}
                              className="grid h-full w-9 place-items-center transition-colors hover:bg-black/5"
                              onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                              type="button"
                            >
                              <Minus aria-hidden="true" size={12} />
                            </button>
                            <span className="w-7 text-center text-xs" aria-label={`Quantity ${item.quantity}`}>
                              {item.quantity}
                            </span>
                            <button
                              aria-label={`Increase ${item.name} quantity`}
                              className="grid h-full w-9 place-items-center transition-colors hover:bg-black/5"
                              onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                              type="button"
                            >
                              <Plus aria-hidden="true" size={12} />
                            </button>
                          </div>
                          <strong className="text-sm font-semibold">{money(item.pricePence * item.quantity)}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
                <span className="grid size-16 place-items-center rounded-full border border-[#9a7048]/25 bg-[#eee5d8] text-[#9a7048]">
                  <ShoppingBag aria-hidden="true" size={25} strokeWidth={1.3} />
                </span>
                <p className="mt-6 font-heading text-2xl">Your bag is empty</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-black/45">
                  Discover a fragrance and add it to your selection.
                </p>
                <Link
                  className="mt-7 bg-[#1c1814] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
                  href="/yusuf-bhai-originals"
                  onClick={closeCart}
                >
                  Explore fragrances
                </Link>
              </div>
            )}

            {cart.length ? (
              <div className="border-t border-black/10 bg-[#efe7db] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pt-6">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-black/42">Subtotal</p>
                    <p className="mt-1 text-xs text-black/42">Delivery calculated at checkout</p>
                  </div>
                  <strong className="font-heading text-2xl">{money(cartSubtotalPence)}</strong>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    className="flex min-h-12 items-center justify-center border border-[#1c1814] px-4 text-[9px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-white/45"
                    href="/cart"
                    onClick={closeCart}
                  >
                    View cart
                  </Link>
                  <Link
                    className="flex min-h-12 items-center justify-center gap-2 bg-[#1c1814] px-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#9a7048]"
                    href="/checkout"
                    onClick={closeCart}
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
