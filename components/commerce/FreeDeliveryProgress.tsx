"use client";

import { useState } from "react";
import { useCommerce } from "./CommerceProvider";
import { formatCartPrice } from "./CartPriceSummary";

export default function FreeDeliveryProgress() {
  const { cartPricing, pricingLoading, pricingError, deliveryPostcode, setDeliveryPostcode } = useCommerce();
  const [error, setError] = useState("");
  const progress = cartPricing?.deliveryProgress;
  if (pricingError) return null;
  return <section aria-label="Free delivery" className="mb-4 border border-[#967c55]/25 bg-white/40 p-3 text-sm">
    <div aria-live="polite">
      {pricingLoading ? <p className="text-xs text-black/55">Updating delivery offer…</p> : progress ? <>
        <p className="text-xs font-medium text-[#705230]">{progress.remainingPence ? `${formatCartPrice(progress.remainingPence)} away from free ${progress.methodName}` : `Free ${progress.methodName} ${progress.estimated ? "available" : "unlocked"}`}{progress.estimated ? " (estimate)" : ""}</p>
        <div role="progressbar" aria-label={`Progress toward free ${progress.methodName}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.thresholdPence ? Math.min(100, Math.floor(progress.currentPence / progress.thresholdPence * 100)) : 100} className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10"><div className="h-full bg-[#967c55] transition-[width]" style={{ width: `${progress.thresholdPence ? Math.min(100, progress.currentPence / progress.thresholdPence * 100) : 100}%` }} /></div>
        <p className="mt-2 text-[11px] leading-4 text-black/55">{progress.remainingPence ? `Based on your basket ${progress.basis === "AFTER_DISCOUNT" ? "after" : "before"} discounts. ` : ""}{progress.estimated ? "Enter your postcode to confirm eligibility." : "Select this service at checkout."}</p>
      </> : <p className="text-xs text-black/55">{deliveryPostcode ? "No free delivery offer applies to this postcode." : "Enter your postcode to check delivery offers."}</p>}
    </div>
    <details className="mt-2">
      <summary className="cursor-pointer text-xs underline underline-offset-2">{deliveryPostcode ? `Delivery postcode: ${deliveryPostcode}` : "Check your postcode"}</summary>
      <form key={deliveryPostcode} className="mt-3 flex flex-wrap gap-2" onSubmit={event => {
        event.preventDefault();
        const postcode = String(new FormData(event.currentTarget).get("postcode") ?? "").trim().toUpperCase().replace(/\s/g, "");
        if (postcode && !/^(?:[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}|GIR0AA)$/.test(postcode)) { setError("Enter a full UK postcode."); return; }
        setError(""); setDeliveryPostcode(postcode);
      }}>
        <input aria-label="Delivery postcode" autoComplete="postal-code" name="postcode" defaultValue={deliveryPostcode} maxLength={10} placeholder="e.g. SW1A 1AA" className="min-h-11 min-w-0 flex-1 border border-black/20 bg-white px-2 text-sm uppercase" />
        <button type="submit" className="min-h-11 bg-[#1c1814] px-3 text-xs font-semibold text-white">Check</button>
        {error ? <p role="alert" className="w-full text-xs text-red-700">{error}</p> : null}
      </form>
    </details>
  </section>;
}
