"use client";

import { useRouter } from "next/navigation";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import type { CheckoutInput } from "@/lib/commerce/validation";
import { CheckoutChangedError, CheckoutValidationError } from "@/lib/commerce/checkout-validation";
import { usePaymentConfig } from "./StripeProvider";
import { useCommerce } from "./CommerceProvider";
import { trackMarketingEvent, updateMarketingMatching } from "@/lib/marketing/client";
import { CHECKOUT_ATTEMPT_KEY, readCheckoutAttempt, type CheckoutAttempt } from "@/lib/payments/checkout-attempt";
import { stripeConfirmationDetails, type WalletBilling } from "@/lib/payments/confirmation-details";

type PaymentInput = Omit<CheckoutInput, "idempotencyKey">;
export function useStripePayment({ preserveCart = false, returnPath }: { preserveCart?: boolean; returnPath?: string } = {}) {
  const stripe = useStripe();
  const elements = useElements();
  const { paymentLock: busyRef } = usePaymentConfig();
  const { setReservationKey } = useCommerce();
  const router = useRouter();

  async function pay(payload: PaymentInput, walletBilling?: WalletBilling): Promise<void> {
    if (busyRef.current) throw new Error("A payment is already in progress. Please wait.");
    if (!stripe || !elements) throw new Error("Payment is still loading. Please try again.");
    busyRef.current = true;
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message || "Check your payment details.");
      const expressCheckout = preserveCart || window.location.pathname !== "/checkout";
      const billing = payload.billingAddress;
      // Wallet details become known here. Matching and analytics remain optional
      // and run independently of payment, including during network failures.
      void updateMarketingMatching({
        email: payload.customer.email, phone: payload.customer.phone, fullName: billing.fullName,
        city: billing.city, region: billing.region, postalCode: billing.postalCode, countryCode: billing.countryCode,
      });
      if (expressCheckout) void trackMarketingEvent("InitiateCheckout", payload.items, { couponCode: payload.couponCode });
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(preserveCart ? { payload, preserveCart } : payload)));
      const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      let previous: CheckoutAttempt | null = null;
      try { previous = readCheckoutAttempt(sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY)); } catch { /* Start a new attempt if storage was cleared. */ }
      if (previous && previous.fingerprint !== fingerprint) {
        const response = await fetch("/api/payments/stripe/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: previous.key }) });
        const data = await response.json();
        if (data.paid) { router.push(`/checkout/confirmation?key=${encodeURIComponent(previous.key)}`); return; }
        if (!response.ok) throw new Error(data.error || "Your previous payment is still processing. Please wait before retrying.");
        previous = null;
        setReservationKey(undefined);
      }
      const key = previous?.key || crypto.randomUUID();
      const attempt: CheckoutAttempt = { key, fingerprint, preserveCart, returnPath: preserveCart ? returnPath ?? window.location.pathname : "/checkout" };
      sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt));
      const response = await fetch("/api/commerce/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, idempotencyKey: key }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "CHECKOUT_EXPIRED") { sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY); setReservationKey(undefined); }
        if (data.code === "VALIDATION_ERROR" || data.code === "ADDRESS_CONFIRMATION_REQUIRED") throw new CheckoutValidationError(data.error || "Review and confirm your delivery address.", data.fieldErrors);
        if (["CHECKOUT_EXPIRED", "CART_CHANGED", "CHECKOUT_CHANGED", "DELIVERY_UNAVAILABLE", "OUT_OF_STOCK", "COUPON_LIMIT", "INVALID_COUPON"].includes(data.code)) throw new CheckoutChangedError(data.error || "Your checkout changed. Review the updated details before paying.");
        throw new Error(data.error || "Unable to start payment. Please try again.");
      }
      setReservationKey(key);
      void trackMarketingEvent("AddPaymentInfo", payload.items, { couponCode: payload.couponCode, reservationKey: key });
      const returnUrl = `${window.location.origin}/checkout/confirmation?key=${encodeURIComponent(key)}`;
      if (data.paid) { router.push(`/checkout/confirmation?key=${encodeURIComponent(key)}`); return; }
      const { error } = await stripe.confirmPayment({
        elements, clientSecret: data.clientSecret,
        confirmParams: {
          return_url: returnUrl,
          ...stripeConfirmationDetails(payload, walletBilling),
        },
        redirect: "if_required",
      });
      if (error) throw new Error(error.message || "Payment was not completed. Please try again.");
      router.push(`/checkout/confirmation?key=${encodeURIComponent(key)}`);
    } finally { busyRef.current = false; }
  }
  return { pay, ready: Boolean(stripe && elements) };
}
