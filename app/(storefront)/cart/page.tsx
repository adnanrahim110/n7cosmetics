"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { useCommerce } from "@/components/commerce/CommerceProvider";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCommerce();
  const subtotal = cart.reduce(
    (sum, item) => sum + item.pricePence * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-[#f3eee5] pb-16 pt-40 text-[#1c1814] sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
          Your selection
        </p>
        <h1 className="mt-3 font-heading text-4xl sm:text-5xl">Shopping cart</h1>

        {cart.length ? (
          <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1fr_340px]">
            <section className="divide-y divide-black/10 border-y border-black/10">
              {cart.map((item) => (
                <article
                  key={item.slug}
                  className="group relative grid cursor-pointer grid-cols-[72px_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <Link
                    aria-label={`View ${item.name}`}
                    className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d6745]"
                    href={`/products/${item.slug}`}
                  />
                  <div className="pointer-events-none relative aspect-square bg-white/45">
                    <Image
                      alt={item.name}
                      className="object-contain p-2"
                      fill
                      sizes="(max-width: 640px) 72px, 120px"
                      src={item.image}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words font-heading text-lg transition-colors group-hover:text-[#8d6745] sm:text-xl">{item.name}</h3>
                    <p className="mt-2 text-sm text-black/45">{money(item.pricePence)}</p>
                    <div className="relative z-20 mt-3 inline-flex items-center border border-black/15 sm:mt-4">
                      <button
                        aria-label="Decrease quantity"
                        className="grid size-8 place-items-center"
                        onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                        type="button"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        className="grid size-8 place-items-center"
                        onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                        type="button"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between border-t border-black/8 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <p className="font-medium">{money(item.pricePence * item.quantity)}</p>
                    <button
                      aria-label={`Remove ${item.name}`}
                      className="relative z-20 grid size-9 place-items-center text-black/35 hover:text-red-600"
                      onClick={() => removeFromCart(item.slug)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit border border-black/10 bg-white/45 p-5 sm:p-6">
              <h2 className="font-heading text-2xl">Summary</h2>
              <div className="mt-5 flex justify-between border-y border-black/10 py-4 text-sm">
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-black/45">
                Discounts and delivery are calculated securely at checkout.
              </p>
              <Link
                className="mt-6 flex items-center justify-between bg-[#1c1814] px-5 py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white"
                href="/checkout"
              >
                Checkout <ArrowRight size={16} />
              </Link>
            </aside>
          </div>
        ) : (
          <div className="mt-10 border-y border-black/10 py-16 text-center sm:mt-12 sm:py-20">
            <p className="font-heading text-2xl text-black/40 sm:text-3xl">Your cart is empty</p>
            <Link
              className="mt-6 inline-flex bg-[#1c1814] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
              href="/yusuf-bhai-originals"
            >
              Explore fragrances
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
