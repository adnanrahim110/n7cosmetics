"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CartLinePrice from "./CartLinePrice";
import CartProductLabels from "./CartProductLabels";
import { formatCartPrice } from "./CartPriceSummary";
import { commerceProductHref, useCommerce, type CartItem } from "./CommerceProvider";

export default function CartDrawerItem({ item }: { item: CartItem }) {
  const { cartPricing, closeCart, removeFromCart, updateQuantity, getCartLimit, getStockIssue, cartBusy } = useCommerce();
  const line = cartPricing?.lines.find((entry) => entry.slug === item.slug);
  const stockIssue = getStockIssue(item.slug);
  const productCode = item.productCode?.trim();
  const title = productCode ? `${productCode} - ${item.name}` : item.name;
  const quantityButtonClass = "relative grid size-7 shrink-0 place-items-center transition-colors hover:bg-black/5 active:bg-black/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#735132] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none [@media(any-pointer:coarse)]:after:absolute [@media(any-pointer:coarse)]:after:-inset-2 [@media(any-pointer:coarse)]:after:content-['']";

  return (
    <article className="group relative grid grid-cols-[56px_minmax(0,1fr)] items-start gap-3 py-2">
      <Link
        aria-label={`View ${title}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#735132]"
        href={commerceProductHref(item)}
        onClick={closeCart}
      />
      <div className="pointer-events-none min-w-0">
        <div className="relative aspect-square bg-[#ebe2d5]">
          <Image alt={item.name} className="object-contain p-1" fill sizes="56px" src={item.image} />
        </div>
        {item.quantity > 1 ? (
          <p className="mt-1 text-center text-[10px] leading-4 text-stone-600">
            {formatCartPrice(line?.unitPricePence ?? item.pricePence)} each
          </p>
        ) : null}
      </div>
      <div className="min-w-0">
        <h3 className="wrap-break-word font-heading text-sm leading-5 text-[#1c1814] transition-colors group-hover:text-[#735132] motion-reduce:transition-none">
          {title}
        </h3>
        <CartProductLabels inspiredBy={item.inspiredBy} />
        {stockIssue ? <p role="status" className="mt-1 text-[11px] leading-4 text-red-700">{stockIssue.message}</p> : null}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="relative z-20 inline-flex items-center border border-black/12 bg-white/35">
            <button aria-label={`Decrease ${item.name} quantity`} className={quantityButtonClass} disabled={cartBusy} onClick={() => updateQuantity(item.slug, item.quantity - 1)} type="button">
              <Minus aria-hidden="true" size={12} />
            </button>
            <span className="w-5 text-center text-[11px] leading-none tabular-nums" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
            <button aria-label={`Increase ${item.name} quantity`} className={quantityButtonClass} disabled={cartBusy || item.quantity >= getCartLimit(item.slug)} onClick={() => updateQuantity(item.slug, item.quantity + 1)} type="button">
              <Plus aria-hidden="true" size={12} />
            </button>
          </div>
          <div className="ml-auto">
            <CartLinePrice compact line={line} fallbackPence={item.pricePence * item.quantity} />
          </div>
          <button
            aria-label={`Remove ${item.name} from cart`}
            className="relative z-20 grid size-8 shrink-0 place-items-center text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700 active:bg-red-100 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-700 motion-reduce:transition-none [@media(any-pointer:coarse)]:size-11"
            onClick={() => removeFromCart(item.slug)}
            type="button"
          >
            <Trash2 aria-hidden="true" size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </article>
  );
}
