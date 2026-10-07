"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { paymentStripe } from "@/lib/payments/stripe-loader";
import { useStripeRuntime } from "./StripeRuntimeProvider";

interface PaymentConfigState { enabled: boolean; loading: boolean; error: string | null; paymentLock: { current: boolean } }
const PaymentConfig = createContext<PaymentConfigState>({ enabled: false, loading: true, error: null, paymentLock: { current: false } });
export const usePaymentConfig = () => useContext(PaymentConfig);

export default function StripeProvider({ children, amount = 30, appearance }: { children: ReactNode; amount?: number; appearance?: Appearance }) {
  const { config, paymentLock } = useStripeRuntime();
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const stripe = useMemo(() => paymentStripe(config.publishableKey), [config.publishableKey]);
  useEffect(() => {
    let active = true;
    if (stripe) void stripe.then(value => { if (active && !value) setFailedKey(config.publishableKey); });
    return () => { active = false; };
  }, [stripe, config.publishableKey]);
  const failed = Boolean(config.publishableKey && failedKey === config.publishableKey);
  return <PaymentConfig.Provider value={{ enabled: config.enabled && !failed, loading: false, error: failed ? "Unable to load secure payment. Please refresh and try again." : null, paymentLock }}>
    <Elements key={config.publishableKey || "unconfigured"} stripe={stripe} options={{ mode: "payment", amount: Math.max(30, amount), currency: "gbp", paymentMethodTypes: ["card"], appearance: appearance ?? { theme: "stripe", variables: { colorPrimary: "#8d6745", borderRadius: "0px" } } }}>
      {children}
    </Elements>
  </PaymentConfig.Provider>;
}
