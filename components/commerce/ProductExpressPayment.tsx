"use client";

import { useEffect, useState } from "react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { useCommerce } from "./CommerceProvider";
import ExpressPayment from "./ExpressPayment";
import StripeProvider from "./StripeProvider";
import PaymentOptionsError from "./PaymentOptionsError";

interface ProductExpressPaymentProps {
  slug: string;
  quantity: number;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}

interface QuoteResult {
  request: string;
  quote?: CheckoutQuote;
  error?: string;
}

export default function ProductExpressPayment({
  slug,
  quantity,
  disabled,
  onBusyChange,
}: ProductExpressPaymentProps) {
  const { reservationKey } = useCommerce();
  const [result, setResult] = useState<QuoteResult>();
  const [retry, setRetry] = useState(0);
  const [paying, setPaying] = useState(false);
  const request = JSON.stringify({ items: [{ slug, quantity }], countryCode: "GB", reservationKey });
  const current = result?.request === request ? result : undefined;

  useEffect(() => {
    if (disabled || paying) return;
    const controller = new AbortController();
    async function loadQuote() {
      try {
        const response = await fetch("/api/commerce/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: request,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const data: CheckoutQuote & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || "Payment options are unavailable. Please try again.");
        if (!controller.signal.aborted) setResult({ request, quote: data });
      } catch (reason) {
        if (!controller.signal.aborted) setResult(previous => ({
          request,
          quote: previous?.quote,
          error: reason instanceof Error ? reason.message : "Payment options are unavailable. Please try again.",
        }));
      }
    }
    void loadQuote();
    return () => controller.abort();
  }, [slug, quantity, request, reservationKey, retry, disabled, paying]);

  const blocked = !paying && (disabled || !current?.quote || Boolean(current.error));
  return (
    <StripeProvider amount={result?.quote?.totalPence ?? 30}>
      {disabled && !paying ? null : <div className="mt-4" aria-busy={paying}>
        {current?.error ? <PaymentOptionsError message={current.error} onRetry={() => {
          setResult(previous => previous ? { request: "", quote: previous.quote } : undefined);
          setRetry(value => value + 1);
        }} /> : null}
        {result?.quote || !current?.error ? <ExpressPayment
          quote={result?.quote ?? null} disabled={blocked} items={[{ slug, quantity }]}
          onBusyChange={busy => { setPaying(busy); onBusyChange(busy); }}
        /> : null}
      </div>}
    </StripeProvider>
  );
}
