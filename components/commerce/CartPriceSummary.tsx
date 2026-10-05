"use client";

import { useCommerce } from "./CommerceProvider";
import { cn } from "@/lib/cn";

export function formatCartPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default function CartPriceSummary({ showCouponControl = true, compact = false }: { showCouponControl?: boolean; compact?: boolean }) {
  const { cartPricing, pricingLoading, pricingError, couponCode, setCouponCode } = useCommerce();
  return (
    <div aria-live="polite" className={cn("text-sm", compact && "text-xs leading-4")}>
      {cartPricing && pricingError ? <p role="alert" className="mb-3 text-red-700">{pricingError}</p> : null}
      {cartPricing ? (
        <dl className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2", compact && "gap-x-3 gap-y-1")}>
          {!compact || cartPricing.discountPence > 0 ? <>
            <dt className={cn("text-black/50", compact && "text-stone-600")}>Subtotal</dt><dd>{formatCartPrice(cartPricing.subtotalPence)}</dd>
          </> : null}
          {cartPricing.discountPence > 0 ? <>
            <dt className="text-emerald-800">{cartPricing.discount?.name ?? "Discount"}{cartPricing.freeQuantity ? ` · ${cartPricing.freeQuantity} free` : ""}</dt>
            <dd className="text-emerald-800">−{formatCartPrice(cartPricing.discountPence)}</dd>
          </> : null}
          {cartPricing.discount?.freeShipping ? <><dt className="text-emerald-800">{cartPricing.discount.name}</dt><dd className="text-emerald-800">Free shipment</dd></> : null}
          <dt className={cn("border-t border-black/10 pt-2 font-semibold", compact && cartPricing.discountPence === 0 && "border-0 pt-0")}>Total before shipment</dt>
          <dd className={cn("border-t border-black/10 pt-2 font-semibold", compact && "text-sm", compact && cartPricing.discountPence === 0 && "border-0 pt-0")}>{formatCartPrice(cartPricing.totalPence)}</dd>
        </dl>
      ) : <p className={pricingError ? "text-red-700" : "text-black/50"}>{pricingLoading ? "Updating prices and offers…" : pricingError ?? "Loading cart prices…"}</p>}
      {showCouponControl && couponCode ? <button className={cn("mt-2 text-xs underline underline-offset-4", compact && "mt-1 inline-flex min-h-11 items-center text-[11px] focus-visible:ring-2 focus-visible:ring-[#735132]")} onClick={() => setCouponCode("")} type="button">Remove coupon {couponCode}</button> : null}
      {!compact ? <p className="mt-2 text-xs text-black/45">Shipment calculated at checkout.</p> : null}
    </div>
  );
}
