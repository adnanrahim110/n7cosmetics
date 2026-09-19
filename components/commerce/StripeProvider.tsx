"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";

const promises = new Map<string, Promise<Stripe | null>>();
const PaymentConfig = createContext({ enabled: false, loading: true, paymentLock: { current: false } });
export const usePaymentConfig = () => useContext(PaymentConfig);

export default function StripeProvider({ children, amount = 30 }: { children: ReactNode; amount?: number }) {
  const paymentLock = useRef(false);
  const [config, setConfig] = useState<{ enabled: boolean; publishableKey: string | null; loading: boolean }>({ enabled: false, publishableKey: null, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/payments/stripe/config", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (!controller.signal.aborted) setConfig({ enabled: Boolean(data.enabled), publishableKey: data.publishableKey, loading: false }); })
      .catch(() => { if (!controller.signal.aborted) setConfig({ enabled: false, publishableKey: null, loading: false }); });
    return () => controller.abort();
  }, []);
  let stripe: Promise<Stripe | null> | null = null;
  if (config.publishableKey) {
    stripe = promises.get(config.publishableKey) ?? loadStripe(config.publishableKey);
    promises.set(config.publishableKey, stripe);
  }
  return <PaymentConfig.Provider value={{ ...config, paymentLock }}>
    <Elements key={config.publishableKey || "unconfigured"} stripe={stripe} options={{ mode: "payment", amount: Math.max(30, amount), currency: "gbp", paymentMethodTypes: ["card"], appearance: { theme: "stripe", variables: { colorPrimary: "#8d6745", borderRadius: "0px" } } }}>
      {children}
    </Elements>
  </PaymentConfig.Provider>;
}
