"use client";

import { useRef, useState } from "react";
import { ExpressCheckoutElement, useElements } from "@stripe/react-stripe-js";
import type { StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import type { CheckoutQuote } from "@/lib/commerce/quote";
import type { CheckoutInput } from "@/lib/commerce/validation";
import { useCommerce } from "./CommerceProvider";
import { usePaymentConfig } from "./StripeProvider";
import { useStripePayment } from "./useStripePayment";

export default function ExpressPayment({ quote, onQuote, marketingOptOut, onCheckoutDetails, onBusyChange }: {
  quote: CheckoutQuote;
  onQuote?: (quote: CheckoutQuote) => void;
  marketingOptOut?: boolean;
  onCheckoutDetails?: (input: Omit<CheckoutInput, "idempotencyKey">) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { cart, couponCode } = useCommerce();
  const config = usePaymentConfig();
  const elements = useElements();
  const { pay } = useStripePayment();
  const [error, setError] = useState("");
  const [available, setAvailable] = useState(true);
  const workingQuote = useRef(quote);
  const walletPostcode = useRef("");
  if (!config.enabled || quote.totalPence < 30) return null;
  const rates = (value: CheckoutQuote) => [...value.shippingMethods].sort((a, b) => Number(b.id === value.shippingMethod.id) - Number(a.id === value.shippingMethod.id)).map(method => ({ id: method.id, displayName: method.name, amount: method.pricePence }));

  async function refresh(shippingMethodId?: string, postalCode = walletPostcode.current) {
    const response = await fetch("/api/commerce/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart.map(({ slug, quantity }) => ({ slug, quantity })), countryCode: "GB", postalCode, couponCode: couponCode || undefined, shippingMethodId }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Shipment is unavailable.");
    const next = data as CheckoutQuote;
    elements?.update({ amount: next.totalPence });
    workingQuote.current = next;
    walletPostcode.current = postalCode;
    onQuote?.(next);
    return next;
  }

  async function confirm(event: StripeExpressCheckoutElementConfirmEvent) {
    setError("");
    onBusyChange?.(true);
    try {
      const billing = event.billingDetails;
      const shipping = event.shippingAddress;
      if (!billing?.address || !billing.name || !billing.email || !billing.phone || !shipping?.address || !shipping.name) throw new Error("Your wallet needs a full billing address, shipment address, email and phone number.");
      if (billing.address.country !== "GB" || shipping.address.country !== "GB") throw new Error("Billing and shipment addresses must be in the United Kingdom.");
      const expectedTotal = workingQuote.current.totalPence;
      const confirmedQuote = await refresh(event.shippingRate?.id || workingQuote.current.shippingMethod.id, shipping.address.postal_code || "");
      if (confirmedQuote.totalPence !== expectedTotal) throw new Error("The delivery total changed. Reopen your wallet to review the updated price.");
      const address = (fullName: string, value: typeof billing.address): CheckoutInput["shippingAddress"] => ({ fullName, line1: value!.line1 || "", line2: value!.line2 || "", city: value!.city || "", region: value!.state || "", postalCode: value!.postal_code || "", countryCode: "GB", phone: billing.phone! });
      const payload: Omit<CheckoutInput, "idempotencyKey"> = {
        items: cart.map(({ slug, quantity }) => ({ slug, quantity })), countryCode: "GB",
        shippingMethodId: confirmedQuote.shippingMethod.id,
        couponCode: couponCode || undefined,
        expectedTotalPence: confirmedQuote.totalPence,
        customer: { name: billing.name, email: billing.email, phone: billing.phone },
        billingAddress: address(billing.name, billing.address),
        shippingAddress: address(shipping.name, shipping.address),
        marketingOptOut,
        paymentMethod: "STRIPE",
      };
      onCheckoutDetails?.(payload);
      await pay(payload);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Payment was not completed.";
      setError(message);
      event.paymentFailed({ reason: "fail", message });
    } finally { onBusyChange?.(false); }
  }

  return <div className={available ? "space-y-3" : "hidden"}>
    <ExpressCheckoutElement
      options={{ paymentMethods: { applePay: "always", googlePay: "always", link: "never", amazonPay: "never", paypal: "never", klarna: "never" }, billingAddressRequired: true, emailRequired: true, phoneNumberRequired: true, shippingAddressRequired: true, allowedShippingCountries: ["GB"], shippingRates: rates(quote), buttonHeight: 48 }}
      onReady={(event) => setAvailable(Boolean(event.availablePaymentMethods?.applePay || event.availablePaymentMethods?.googlePay))}
      onClick={(event) => {
        workingQuote.current = quote;
        walletPostcode.current = "";
        elements?.update({ amount: quote.totalPence });
        event.resolve({ shippingRates: rates(quote) });
      }}
      onShippingAddressChange={async (event) => {
        if (event.address.country !== "GB") { event.reject(); return; }
        try {
          const next = await refresh(undefined, event.address.postal_code || "");
          event.resolve({ shippingRates: rates(next) });
        } catch { event.reject(); }
      }}
      onShippingRateChange={async (event) => {
        try { const next = await refresh(event.shippingRate.id); event.resolve({ shippingRates: rates(next) }); } catch { event.reject(); }
      }}
      onConfirm={confirm}
    />
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
  </div>;
}
