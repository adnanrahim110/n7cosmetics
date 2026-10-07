import { LoaderCircle, Mail } from "lucide-react";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import type { CheckoutInput } from "@/lib/commerce/validation";
import { cn } from "@/lib/cn";
import ExpressPayment, { type WalletAvailability } from "../ExpressPayment";
import { usePaymentConfig } from "../StripeProvider";
import CheckoutSectionHeading from "./CheckoutSectionHeading";
import { checkoutCard } from "./styles";

interface CheckoutExpressSectionProps {
  quote: CheckoutQuote | null;
  available: WalletAvailability | null;
  blocked: boolean;
  busy: boolean;
  marketingOptOut: boolean;
  onAvailabilityChange: (availability: WalletAvailability) => void;
  onCheckoutDetails: (input: Omit<CheckoutInput, "idempotencyKey">) => void;
  onBusyChange: (busy: boolean) => void;
}

export default function CheckoutExpressSection({ quote, available, blocked, busy, marketingOptOut, onAvailabilityChange, onCheckoutDetails, onBusyChange }: CheckoutExpressSectionProps) {
  const config = usePaymentConfig();
  const enabled = config.enabled && quote && quote.totalPence >= 30;
  const unavailable = !config.loading && (!config.enabled || (available && !available.applePay && !available.googlePay));
  const cannotPay = !config.loading && config.enabled && !blocked && (!quote || quote.totalPence < 30);

  return (
    <section aria-labelledby="checkout-express-title" aria-busy={busy} className={checkoutCard}>
      <CheckoutSectionHeading id="checkout-express-title" title="Express Checkout" description="Pay securely and complete your order faster" icon={Mail} />
      <div className="mt-4" inert={busy || blocked}>
        {enabled ? <ExpressPayment quote={quote} checkoutStyle marketingOptOut={marketingOptOut} onAvailabilityChange={onAvailabilityChange} onCheckoutDetails={onCheckoutDetails} onBusyChange={onBusyChange} /> : null}
        {unavailable || cannotPay ? <p role="status" className="rounded border border-[#e8e3d9] bg-white/60 px-4 py-3 text-sm leading-5 text-[#625f59]">{cannotPay ? quote ? "Express payments require an order total of at least £0.30." : "Confirm your basket and delivery details to use express checkout." : config.enabled ? "Apple Pay and Google Pay aren’t available on this device. Continue with your card below." : "Express payment is currently unavailable."}</p> : !enabled || !available ? (
          <div role="status" className={cn("flex min-h-14 items-center justify-center gap-2 rounded bg-[#111110] px-4 text-sm text-white", enabled && "sr-only")}>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            {blocked && !busy ? "Updating checkout…" : "Loading express payment…"}
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[#ded9cf]" />
        <span className="text-center text-[11px] uppercase tracking-widest text-[#625f59]">Or continue below</span>
        <span className="h-px flex-1 bg-[#ded9cf]" />
      </div>
    </section>
  );
}
