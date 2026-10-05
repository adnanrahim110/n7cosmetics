"use client";

import { useState } from "react";
import Accordion from "@/components/ui/Accordion";
import { cn } from "@/lib/cn";
import { useCommerce } from "./CommerceProvider";
import { formatCartPrice } from "./CartPriceSummary";

export default function FreeDeliveryProgress({ compact = false }: { compact?: boolean }) {
  const { cartPricing, pricingLoading, pricingError, deliveryPostcode, setDeliveryPostcode } = useCommerce();
  const [error, setError] = useState("");
  const progress = cartPricing?.deliveryProgress;
  const progressPercent = progress?.thresholdPence ? Math.min(100, progress.currentPence / progress.thresholdPence * 100) : 100;
  const deliveryDescription = progress ? `${progress.remainingPence ? `Based on your basket ${progress.basis === "AFTER_DISCOUNT" ? "after" : "before"} discounts. ` : ""}${progress.estimated ? "Enter your postcode to confirm eligibility." : "Select this service at checkout."}` : "";
  if (pricingError || (compact && pricingLoading && !progress)) return null;
  return <section aria-label="Free delivery" className={cn("mb-4 border border-[#967c55]/25 bg-white/40 p-3 text-sm", compact && "mb-2 p-2 text-xs")}>
    <div aria-live="polite">
      {pricingLoading ? <p className="text-xs text-black/55">Updating delivery offer…</p> : progress ? <>
        <p className="text-xs font-medium text-[#705230]">{progress.remainingPence ? `${formatCartPrice(progress.remainingPence)} away from free ${progress.methodName}` : `Free ${progress.methodName} ${progress.estimated ? "available" : "unlocked"}`}{progress.estimated ? " (estimate)" : ""}</p>
        <progress aria-label={`Progress toward free ${progress.methodName}`} max={100} value={progressPercent} className={cn("mt-2 block h-1 w-full appearance-none overflow-hidden rounded-full bg-black/10 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-black/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[#967c55] [&::-webkit-progress-value]:transition-[width] motion-reduce:[&::-webkit-progress-value]:transition-none [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[#967c55]", compact && "mt-1")} />
        {!compact ? <p className="mt-2 text-[11px] leading-4 text-black/55">{deliveryDescription}</p> : null}
      </> : !compact || deliveryPostcode ? <p className="text-xs text-black/55">{deliveryPostcode ? "No free delivery offer applies to this postcode." : "Enter your postcode to check delivery offers."}</p> : null}
    </div>
    <Accordion
      className={cn("mt-2", compact && "mt-1")}
      summaryClassName={cn("flex items-center text-xs underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-[#8d6745]", compact && "min-h-8 text-[11px] [@media(any-pointer:coarse)]:min-h-11")}
      summary={deliveryPostcode ? `Delivery postcode: ${deliveryPostcode}` : "Check your postcode"}
    >
      {compact && deliveryDescription ? <p className="text-[11px] leading-4 text-stone-600">{deliveryDescription}</p> : null}
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
    </Accordion>
  </section>;
}
