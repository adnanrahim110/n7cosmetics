"use client";

import { useCommerce } from "./CommerceProvider";

export function formatCartPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default function CartPriceSummary({ showCouponControl = true }: { showCouponControl?: boolean }) {
  const { cartPricing, pricingLoading, pricingError, couponCode, setCouponCode } = useCommerce();
  return (
    <div aria-live="polite" className="text-sm">
      {cartPricing && pricingError ? <p role="alert" className="mb-3 text-red-700">{pricingError}</p> : null}
      {cartPricing ? (
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2">
          <dt className="text-black/50">Subtotal</dt><dd>{formatCartPrice(cartPricing.subtotalPence)}</dd>
          {cartPricing.discountPence > 0 ? <>
            <dt className="text-emerald-800">{cartPricing.discount?.name ?? "Discount"}{cartPricing.freeQuantity ? ` · ${cartPricing.freeQuantity} free` : ""}</dt>
            <dd className="text-emerald-800">−{formatCartPrice(cartPricing.discountPence)}</dd>
          </> : null}
          {cartPricing.discount?.freeShipping ? <><dt className="text-emerald-800">{cartPricing.discount.name}</dt><dd className="text-emerald-800">Free shipment</dd></> : null}
          <dt className="border-t border-black/10 pt-2 font-semibold">Total before shipment</dt>
          <dd className="border-t border-black/10 pt-2 font-semibold">{formatCartPrice(cartPricing.totalPence)}</dd>
        </dl>
      ) : <p className={pricingError ? "text-red-700" : "text-black/50"}>{pricingLoading ? "Updating prices and offers…" : pricingError ?? "Loading cart prices…"}</p>}
      {showCouponControl && couponCode ? <button className="mt-2 text-xs underline underline-offset-4" onClick={() => setCouponCode("")} type="button">Remove coupon {couponCode}</button> : null}
      <p className="mt-2 text-xs text-black/45">Shipment calculated at checkout.</p>
    </div>
  );
}
