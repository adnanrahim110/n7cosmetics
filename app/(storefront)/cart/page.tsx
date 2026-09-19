"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";
import { commerceProductHref, useCommerce } from "@/components/commerce/CommerceProvider";
import Title from "@/components/ui/Title";
import CartProductLabels from "@/components/commerce/CartProductLabels";
import CartPriceSummary from "@/components/commerce/CartPriceSummary";
import CartLinePrice from "@/components/commerce/CartLinePrice";
import CartExpressPayment from "@/components/commerce/CartExpressPayment";

function money(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function CartPage() {
  const { cart, cartPricing, removeFromCart, updateQuantity } = useCommerce();

  return (
    <div className="min-h-screen bg-[#f3eee5] pb-16 pt-40 text-[#1c1814] sm:pb-24 sm:pt-44">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d6745]">
          Your selection
        </p>
        <Title as="h1" className="mt-3" text="Shopping cart" tone="ink" />

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
                    href={commerceProductHref(item)}
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
                    <h3 className="break-words font-heading text-lg text-[#1c1814] transition-colors group-hover:text-[#735132] sm:text-xl">{item.name}</h3>
                    <CartProductLabels productCode={item.productCode} inspiredBy={item.inspiredBy} />
                    <p className="mt-2 text-sm text-black/45">{money(cartPricing?.lines.find((line) => line.slug === item.slug)?.unitPricePence ?? item.pricePence)}</p>
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
                        disabled={item.quantity >= Math.min(99, cartPricing?.lines.find((line) => line.slug === item.slug && line.trackInventory)?.stockOnHand ?? 99)}
                        className="grid size-8 place-items-center"
                        onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                        type="button"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 flex items-center justify-between border-t border-black/8 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <CartLinePrice line={cartPricing?.lines.find((line) => line.slug === item.slug)} fallbackPence={item.pricePence * item.quantity} />
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
              <Title text="Summary" tone="ink" variant="small" />
              <div className="mt-5"><CartPriceSummary /></div>
              <Link
                className="mt-6 flex items-center justify-between bg-[#1c1814] px-5 py-4 text-xs font-semibold uppercase tracking-[0.17em] text-white"
                href="/checkout"
              >
                Checkout <ArrowRight size={16} />
              </Link>
              <CartExpressPayment />
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
