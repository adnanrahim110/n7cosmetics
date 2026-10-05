"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import { useCommerce } from "./CommerceProvider";
import ExpressPayment from "./ExpressPayment";
import StripeProvider from "./StripeProvider";

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
  const request = JSON.stringify({ items: [{ slug, quantity }], countryCode: "GB" });
  const current = result?.request === request ? result : undefined;

  useEffect(() => {
    if (disabled || paying) return;
    const controller = new AbortController();
    async function loadQuote() {
      try {
        const response = await fetch("/api/commerce/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{ slug, quantity }], countryCode: "GB", reservationKey }),
          signal: controller.signal,
        });
        const data: CheckoutQuote & { error?: string } = await response.json();
        if (!response.ok) throw new Error(data.error || "Payment options are unavailable. Please try again.");
        if (!controller.signal.aborted) setResult({ request, quote: data });
      } catch (reason) {
        if (!controller.signal.aborted) setResult({
          request,
          error: reason instanceof Error ? reason.message : "Payment options are unavailable. Please try again.",
        });
      }
    }
    void loadQuote();
    return () => controller.abort();
  }, [slug, quantity, request, reservationKey, retry, disabled, paying]);

  if (disabled && !paying) return null;
  if (current?.error) return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <p className="text-red-700" role="alert">{current.error}</p>
      <button
        className="min-h-11 font-semibold text-stone-800 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-stone-700"
        onClick={() => { setResult(undefined); setRetry((value) => value + 1); }}
        type="button"
      >
        Retry payment options
      </button>
    </div>
  );
  if (!current?.quote) return (
    <p className="mt-4 flex min-h-12 items-center justify-center gap-2 text-xs text-stone-600" role="status">
      <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={16} />
      Loading payment options…
    </p>
  );

  return (
    <div className="mt-4" aria-busy={paying}>
      <StripeProvider amount={current.quote.totalPence}>
        <ExpressPayment
          quote={current.quote}
          items={[{ slug, quantity }]}
          onBusyChange={(busy) => { setPaying(busy); onBusyChange(busy); }}
        />
      </StripeProvider>
    </div>
  );
}
