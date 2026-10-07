"use client";

import { useEffect, useState } from "react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { useCommerce } from "./CommerceProvider";
import StripeProvider from "./StripeProvider";
import ExpressPayment from "./ExpressPayment";
import PaymentOptionsError from "./PaymentOptionsError";

export default function CartExpressPayment() {
  const { cart, couponCode, pricingLoading, pricingError, reservationKey } = useCommerce();
  const [paying, setPaying] = useState(false);
  const [retry, setRetry] = useState(0);
  const request = JSON.stringify({ items: cart.map(({ slug, quantity }) => ({ slug, quantity })), countryCode: "GB", couponCode: couponCode || undefined, reservationKey });
  const [result, setResult] = useState<{ request: string; quote?: CheckoutQuote; error?: string }>();
  const current = result?.request === request ? result : undefined;
  useEffect(() => {
    if (paying) return;
    const controller = new AbortController();
    fetch("/api/commerce/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: request, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) })
      .then(async response => {
        const quote: CheckoutQuote & { error?: string } = await response.json();
        if (!response.ok) throw new Error(quote.error || "Payment options are unavailable. Please try again.");
        if (!controller.signal.aborted) setResult({ request, quote });
      })
      .catch(reason => { if (!controller.signal.aborted) setResult(previous => ({ request, quote: previous?.quote, error: reason instanceof Error ? reason.message : "Payment options are unavailable. Please try again." })); });
    return () => controller.abort();
  }, [request, pricingError, paying, retry]);
  const blocked = !paying && (!current?.quote || pricingLoading || Boolean(pricingError) || Boolean(current?.error));
  return <div className="mt-4">
    <StripeProvider amount={result?.quote?.totalPence ?? 30}>
      {current?.error ? <PaymentOptionsError message={current.error} onRetry={() => {
        setResult(previous => previous ? { request: "", quote: previous.quote } : undefined);
        setRetry(value => value + 1);
      }} /> : null}
      {result?.quote || !current?.error ? <ExpressPayment quote={result?.quote ?? null} disabled={blocked} onQuote={quote => setResult({ request, quote })} onBusyChange={setPaying} /> : null}
    </StripeProvider>
  </div>;
}
