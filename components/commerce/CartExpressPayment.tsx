"use client";

import { useEffect, useState } from "react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { useCommerce } from "./CommerceProvider";
import StripeProvider from "./StripeProvider";
import ExpressPayment from "./ExpressPayment";

export default function CartExpressPayment() {
  const { cart, couponCode, pricingLoading, pricingError, reservationKey } = useCommerce();
  const [paying, setPaying] = useState(false);
  const request = JSON.stringify({ items: cart.map(({ slug, quantity }) => ({ slug, quantity })), countryCode: "GB", couponCode: couponCode || undefined });
  const [result, setResult] = useState<{ request: string; quote: CheckoutQuote }>();
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/commerce/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...JSON.parse(request), reservationKey }), signal: controller.signal })
      .then(async (response) => { if (response.ok) { const quote = await response.json(); if (!controller.signal.aborted) setResult({ request, quote }); } })
      .catch(() => undefined);
    return () => controller.abort();
  }, [request, reservationKey, pricingError]);
  if (!result || result.request !== request || (!paying && (pricingLoading || pricingError))) return null;
  return <div className="mt-4"><StripeProvider amount={result.quote.totalPence}><ExpressPayment quote={result.quote} onQuote={(quote) => setResult({ request, quote })} onBusyChange={setPaying} /></StripeProvider></div>;
}
