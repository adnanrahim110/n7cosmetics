import { PaymentElement } from "@stripe/react-stripe-js";
import { CreditCard, LoaderCircle } from "lucide-react";
import { FaCcAmex, FaCcMastercard, FaCcVisa } from "react-icons/fa";
import { cn } from "@/lib/cn";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import type { CheckoutInput } from "@/lib/commerce/validation";
import type { WalletAvailability } from "../ExpressPayment";
import { usePaymentConfig } from "../StripeProvider";
import CheckoutSectionHeading from "./CheckoutSectionHeading";
import CheckoutFieldError from "./CheckoutFieldError";
import CheckoutWalletBrand, { type CheckoutPaymentMethod } from "./CheckoutWalletBrand";
import CheckoutWalletPayment from "./CheckoutWalletPayment";
import { checkoutCard, checkoutFocus } from "./styles";

interface CheckoutPaymentSectionProps {
  method: CheckoutPaymentMethod;
  onMethodChange: (method: CheckoutPaymentMethod) => void;
  available: WalletAvailability | null;
  quote: CheckoutQuote | null;
  disabled: boolean;
  marketingOptOut: boolean;
  cardError?: string;
  onCardReady: () => void;
  onCardCompleteChange: (complete: boolean) => void;
  onCardError: () => void;
  onCheckoutDetails: (input: Omit<CheckoutInput, "idempotencyKey">) => void;
  onBusyChange: (busy: boolean) => void;
}

export default function CheckoutPaymentSection({ method, onMethodChange, available, quote, disabled, marketingOptOut, cardError, onCardReady, onCardCompleteChange, onCardError, onCheckoutDetails, onBusyChange }: CheckoutPaymentSectionProps) {
  const config = usePaymentConfig();
  return (
    <section aria-labelledby="checkout-payment-title" className={cn(checkoutCard, "bg-[#f6f3ed] p-3 sm:p-4")}>
      <CheckoutSectionHeading id="checkout-payment-title" title="Payment Method" description="Pay securely with your card or wallet" icon={CreditCard} />
      <fieldset className="mt-4 min-w-0 space-y-1" disabled={disabled}>
        <legend className="sr-only">Choose a payment method</legend>
        <div className="rounded border border-[#e8e3d9] bg-white" data-cursor="native">
          <label className="flex min-h-14 cursor-pointer flex-wrap items-center gap-3 px-3 py-3 text-sm has-disabled:cursor-not-allowed">
            <input aria-controls="checkout-card-fields" checked={method === "card"} className={cn("size-5 shrink-0 accent-blue-600", checkoutFocus)} name="paymentMethodChoice" onChange={() => onMethodChange("card")} type="radio" value="card" />
            <span className="min-w-0 flex-1 font-semibold">Credit / Debit Card</span>
            <span aria-label="Visa, Mastercard and American Express" className="inline-flex items-center gap-2">
              <FaCcVisa aria-hidden="true" className="h-6 w-8 text-[#182587]" />
              <FaCcMastercard aria-hidden="true" className="h-6 w-8 text-[#b4451a]" />
              <FaCcAmex aria-hidden="true" className="h-6 w-8 text-[#0876b9]" />
            </span>
          </label>
          <div aria-describedby={cardError ? "checkout-card-error" : undefined} aria-invalid={Boolean(cardError)} aria-label="Card details" className={cn("rounded px-4 pb-5 sm:pl-8", checkoutFocus, method !== "card" && "hidden")} data-cursor="native" id="checkout-card-fields" inert={disabled} tabIndex={-1}>
            {config.enabled ? <PaymentElement options={{ fields: { billingDetails: "never" }, wallets: { applePay: "never", googlePay: "never", link: "never" }, layout: { type: "tabs", radios: "never" } }} onReady={onCardReady} onChange={(event) => onCardCompleteChange(event.complete)} onLoadError={onCardError} /> : <p role="status" className="flex items-center gap-2 text-sm leading-5 text-[#625f59]">{config.loading ? <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" /> : null}{config.loading ? "Loading secure payment…" : "Online payment is currently unavailable. Please try again later."}</p>}
            <CheckoutFieldError id="checkout-card-error" message={cardError} />
          </div>
        </div>
        {(["applePay", "googlePay"] as const).map((wallet) => {
          const walletAvailable = config.enabled && available?.[wallet];
          const selected = method === wallet;
          return (
            <div className="rounded border border-[#e8e3d9] bg-white" key={wallet}>
              <label className="flex min-h-14 cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-3 py-3 text-sm has-disabled:cursor-not-allowed">
                <input aria-controls={`checkout-${wallet}-payment`} checked={selected} className={cn("size-5 shrink-0 accent-blue-600", checkoutFocus)} disabled={disabled || !walletAvailable} name="paymentMethodChoice" onChange={() => onMethodChange(wallet)} type="radio" value={wallet} />
                <CheckoutWalletBrand wallet={wallet} />
                <span className="min-w-0 text-xs text-[#625f59]">{walletAvailable ? `Pay with ${wallet === "applePay" ? "Apple Pay" : "Google Pay"}` : config.loading || (config.enabled && !available) ? "Checking availability…" : "Unavailable on this device"}</span>
              </label>
              {selected && quote ? <div className="scroll-mt-40 px-4 pb-4" id={`checkout-${wallet}-payment`} tabIndex={-1} inert={disabled}>
                <p className="mb-3 text-xs leading-5 text-[#625f59]">Use the button below to confirm your payment and delivery details in your wallet.</p>
                <CheckoutWalletPayment wallet={wallet} quote={quote} marketingOptOut={marketingOptOut} onCheckoutDetails={onCheckoutDetails} onBusyChange={onBusyChange} />
              </div> : null}
            </div>
          );
        })}
      </fieldset>
    </section>
  );
}
