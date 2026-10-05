import { ArrowLeftRight, CircleHelp, LoaderCircle, Tag } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { checkoutCouponSchema } from "@/lib/commerce/checkout-validation";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { cn } from "@/lib/cn";
import { useCommerce } from "../CommerceProvider";
import CheckoutDeliveryOptions from "./CheckoutDeliveryOptions";
import CheckoutOrderItems from "./CheckoutOrderItems";
import CheckoutFieldError from "./CheckoutFieldError";
import { checkoutCard, checkoutFocus, checkoutInput, checkoutMoney } from "./styles";

interface CheckoutOrderSummaryProps {
  quote: CheckoutQuote | null;
  quoting: boolean;
  placing: boolean;
  couponError?: string;
  itemsExpanded: boolean;
  onItemsExpandedChange: (expanded: boolean) => void;
  onShippingChange: (id: string) => void;
  onCouponChange: (code: string) => void;
  onRetry: () => void;
}

export default function CheckoutOrderSummary({ quote, quoting, placing, couponError, itemsExpanded, onItemsExpandedChange, onShippingChange, onCouponChange, onRetry }: CheckoutOrderSummaryProps) {
  const { cart, cartPricing, cartSubtotalPence, couponCode, pricingLoading } = useCommerce();
  const [couponDraft, setCouponDraft] = useState(couponCode);
  const [couponTouched, setCouponTouched] = useState(false);
  const couponId = useId();
  const couponResult = checkoutCouponSchema.safeParse(couponDraft);
  const couponValidationError = couponTouched && couponDraft.trim() && !couponResult.success ? couponResult.error.issues[0]?.message : undefined;
  const displayCouponError = couponValidationError || (couponDraft.trim().toUpperCase() === couponCode ? couponError : undefined);
  const pricing = quote ?? cartPricing;
  const progress = quote?.deliveryProgress;
  const estimate = quote?.shippingMethod;
  const days = estimate?.estimatedDaysMin !== null && estimate?.estimatedDaysMin !== undefined
    ? `${estimate.estimatedDaysMin}${estimate.estimatedDaysMax && estimate.estimatedDaysMax !== estimate.estimatedDaysMin ? `–${estimate.estimatedDaysMax}` : ""} working days`
    : null;
  const couponApplied = Boolean(quote?.discount?.couponCode && quote.discount.couponCode === couponCode);

  function applyCoupon() {
    setCouponTouched(true);
    if (couponResult.success) onCouponChange(couponResult.data);
  }

  return (
    <section aria-labelledby="checkout-summary-title" className={cn(checkoutCard, "bg-[#f6f3ed]")}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-[#e8e3d9] pb-3">
        <h2 className="font-heading text-xl font-semibold leading-7 tracking-normal text-[#111110]" id="checkout-summary-title"><span aria-hidden="true" className="mr-1 text-[#a67520]">◖</span>Order Summary</h2>
        <Link className={cn("inline-flex min-h-11 items-center rounded text-xs text-[#805915] underline underline-offset-2 hover:text-black", checkoutFocus)} href="/cart">Edit cart</Link>
      </div>
      <CheckoutOrderItems disabled={placing} expanded={itemsExpanded} onExpandedChange={onItemsExpandedChange} items={cart} lines={pricing?.lines} />
      <fieldset className="mt-4 flex min-w-0 gap-2" disabled={placing || pricingLoading || quoting}>
        <legend className="sr-only">Discount code</legend>
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={couponId}>Discount code</label>
          <div className="relative">
            <Tag aria-hidden="true" className="pointer-events-none absolute left-3 top-4 size-4 text-[#625f59]" strokeWidth={1.7} />
            <input aria-describedby={displayCouponError ? `${couponId}-error` : undefined} aria-invalid={Boolean(displayCouponError)} className={cn(checkoutInput, "pl-9", displayCouponError && "border-red-500 focus:border-red-500 focus:ring-red-500/20")} id={couponId} maxLength={80} onBlur={() => setCouponTouched(true)} onChange={(event) => setCouponDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyCoupon(); } }} placeholder="Discount code" value={couponDraft} />
          </div>
          <CheckoutFieldError id={`${couponId}-error`} message={displayCouponError} />
        </div>
        <button className={cn("min-h-11 shrink-0 self-start rounded bg-[#141413] px-5 py-3 text-xs font-semibold uppercase text-white hover:bg-[#35332f] active:bg-black disabled:cursor-not-allowed disabled:opacity-50", checkoutFocus)} disabled={!couponDraft.trim()} onClick={applyCoupon} type="button">Apply</button>
      </fieldset>
      {couponCode ? <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-xs leading-5">
        <p role="status" className={couponApplied ? "text-[#196029]" : "text-[#625f59]"}>{couponApplied ? `${couponCode} applied` : quoting || pricingLoading ? `Checking ${couponCode}…` : `${couponCode} could not be applied`}</p>
        <button className={cn("min-h-11 rounded text-[#805915] underline underline-offset-2 hover:text-black disabled:cursor-not-allowed", checkoutFocus)} disabled={placing} onClick={() => { setCouponDraft(""); setCouponTouched(false); onCouponChange(""); }} type="button">Remove code</button>
      </div> : null}
      <dl className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm sm:text-base" aria-busy={quoting || pricingLoading}>
        <dt>Subtotal</dt><dd className="text-right tabular-nums">{checkoutMoney(pricing?.subtotalPence ?? cartSubtotalPence)}</dd>
        {pricing?.discountPence ? <><dt className="min-w-0 wrap-break-word">Discount{pricing.discount ? <span className="block text-xs text-[#625f59]">{pricing.discount.name}</span> : null}</dt><dd className="text-right text-[#196029] tabular-nums">−{checkoutMoney(pricing.discountPence)}</dd></> : null}
        <dt className="flex items-center gap-2">Delivery (UK)<Link aria-label="Read delivery information" className={cn("inline-flex size-11 items-center rounded text-[#625f59] hover:text-black pointer-fine:size-4 any-pointer-coarse:size-11", checkoutFocus)} href="/shipping-returns"><CircleHelp aria-hidden="true" className="size-4" /></Link></dt>
        <dd className="self-center text-right tabular-nums">{quote ? quote.shippingPence ? checkoutMoney(quote.shippingPence, quote.currency) : "Free" : "—"}</dd>
      </dl>
      {quote ? <>
        <p className="mt-1 text-sm leading-5 text-[#625f59]">{quote.shippingMethod.name}{days ? ` (${days})` : ""}</p>
        {progress || quote.shippingPence === 0 ? <p className="mt-2 flex items-start gap-2 text-sm leading-5 text-[#196029]"><ArrowLeftRight aria-hidden="true" className="mt-1 size-4 shrink-0" />{quote.shippingPence === 0 ? `FREE UK delivery${quote.shippingEstimated ? " available" : " applied"}` : progress?.remainingPence ? `FREE UK delivery on orders from ${checkoutMoney(progress.thresholdPence, quote.currency)}` : `FREE UK delivery available with ${progress?.methodName}`}</p> : null}
        {quote.shippingEstimated ? <p className="mt-2 text-xs leading-5 text-[#625f59]">Enter your postcode to confirm delivery services and prices.</p> : null}
        <CheckoutDeliveryOptions quote={quote} disabled={placing || quoting} onChange={onShippingChange} />
        {quote.freeQuantity ? <p className="mt-3 text-sm text-[#196029]">{quote.freeQuantity} {quote.freeQuantity === 1 ? "bottle" : "bottles"} free in this order.</p> : null}
      </> : <p role="status" className="mt-3 flex items-center gap-2 text-sm text-[#625f59]">{quoting ? <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" /> : null}{quoting ? "Calculating delivery…" : <><span>Delivery quote unavailable.</span><button className={cn("min-h-11 rounded text-[#805915] underline underline-offset-2", checkoutFocus)} onClick={onRetry} type="button">Try again</button></>}</p>}
      <dl className="mt-4 flex items-center justify-between gap-4 border-t border-[#e8e3d9] pt-4 font-semibold">
        <dt className="text-lg">Total (GBP)</dt><dd aria-live="polite" className="text-right text-2xl tabular-nums">{quote ? checkoutMoney(quote.totalPence, quote.currency) : "—"}</dd>
      </dl>
      {quote && quote.totalPence < 30 ? <p role="alert" className="mt-3 text-sm text-red-700">Card payments require an order total of at least £0.30.</p> : null}
    </section>
  );
}
