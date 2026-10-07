"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { preconnect } from "react-dom";
import { usePathname } from "next/navigation";
import { disabledStripeConfig, readPublicStripeConfig, type PublicStripeConfig } from "@/lib/payments/public-config";
import { paymentStripe } from "@/lib/payments/stripe-loader";

const StripeRuntime = createContext({ config: disabledStripeConfig, paymentLock: { current: false }, walletLock: { current: false } });
export const useStripeRuntime = () => useContext(StripeRuntime);

export default function StripeRuntimeProvider({ initialConfig, children }: { initialConfig: PublicStripeConfig; children: ReactNode }) {
  const [config, setConfig] = useState(initialConfig);
  const paymentLock = useRef(false);
  const walletLock = useRef(false);
  const pathname = usePathname();
  const paymentPage = pathname === "/cart" || pathname === "/checkout" || /^\/(products|bundles)\//.test(pathname);
  if (config.enabled && paymentPage) {
    preconnect("https://js.stripe.com");
    preconnect("https://api.stripe.com", { crossOrigin: "anonymous" });
  }
  useEffect(() => {
    if (config.enabled && paymentPage) void paymentStripe(config.publishableKey);
  }, [config.enabled, config.publishableKey, paymentPage]);
  useEffect(() => {
    const controller = new AbortController();
    let checking = false;
    const refresh = async () => {
      if (checking || paymentLock.current || walletLock.current || document.visibilityState === "hidden") return;
      checking = true;
      try {
        const response = await fetch("/api/payments/stripe/config", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) });
        if (!response.ok) return;
        const value: unknown = await response.json();
        if (!controller.signal.aborted && !paymentLock.current && !walletLock.current) setConfig(readPublicStripeConfig(value));
      } catch { /* The server-rendered settings remain usable; orders recheck them. */ }
      finally { checking = false; }
    };
    // Initial settings already arrived with HTML: no blocking config request.
    const interval = window.setInterval(() => void refresh(), 60000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);
  return <StripeRuntime.Provider value={{ config, paymentLock, walletLock }}>{children}</StripeRuntime.Provider>;
}
