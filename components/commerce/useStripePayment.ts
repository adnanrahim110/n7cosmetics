"use client";

import { useRouter } from "next/navigation";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import type { CheckoutInput } from "@/lib/commerce/validation";
import { usePaymentConfig } from "./StripeProvider";

type PaymentInput = Omit<CheckoutInput, "idempotencyKey">;
export function useStripePayment() {
  const stripe = useStripe();
  const elements = useElements();
  const { paymentLock: busyRef } = usePaymentConfig();
  const router = useRouter();

  async function pay(payload: PaymentInput): Promise<void> {
    if (busyRef.current) throw new Error("A payment is already in progress. Please wait.");
    if (!stripe || !elements) throw new Error("Payment is still loading. Please try again.");
    busyRef.current = true;
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message || "Check your payment details.");
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
      const fingerprint = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      let previous: { key: string; fingerprint: string } | null = null;
      try { previous = JSON.parse(sessionStorage.getItem("n7-stripe-attempt") || "null"); } catch { /* Start a new attempt if storage was cleared. */ }
      if (previous && previous.fingerprint !== fingerprint) {
        const response = await fetch("/api/payments/stripe/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: previous.key }) });
        const data = await response.json();
        if (data.paid) { router.push(`/checkout/confirmation?key=${encodeURIComponent(previous.key)}`); return; }
        if (!response.ok) throw new Error(data.error || "Your previous payment is still processing. Please wait before retrying.");
        previous = null;
      }
      const key = previous?.key || crypto.randomUUID();
      sessionStorage.setItem("n7-stripe-attempt", JSON.stringify({ key, fingerprint }));
      const response = await fetch("/api/commerce/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, idempotencyKey: key }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === "CHECKOUT_EXPIRED") sessionStorage.removeItem("n7-stripe-attempt");
        throw new Error(data.error || "Unable to start payment. Please try again.");
      }
      const returnUrl = `${window.location.origin}/checkout/confirmation?key=${encodeURIComponent(key)}`;
      if (data.paid) { router.push(`/checkout/confirmation?key=${encodeURIComponent(key)}`); return; }
      const address = payload.billingAddress;
      const { error } = await stripe.confirmPayment({
        elements, clientSecret: data.clientSecret,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: { billing_details: { name: address.fullName, email: payload.customer.email, phone: payload.customer.phone, address: { line1: address.line1, line2: address.line2, city: address.city, state: address.region, postal_code: address.postalCode, country: address.countryCode } } },
          shipping: { name: payload.shippingAddress.fullName, phone: payload.shippingAddress.phone, address: { line1: payload.shippingAddress.line1, line2: payload.shippingAddress.line2, city: payload.shippingAddress.city, state: payload.shippingAddress.region, postal_code: payload.shippingAddress.postalCode, country: payload.shippingAddress.countryCode } },
        },
        redirect: "if_required",
      });
      if (error) throw new Error(error.message || "Payment was not completed. Please try again.");
      router.push(`/checkout/confirmation?key=${encodeURIComponent(key)}`);
    } finally { busyRef.current = false; }
  }
  return { pay, ready: Boolean(stripe && elements) };
}
