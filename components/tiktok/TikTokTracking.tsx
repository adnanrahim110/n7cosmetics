"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import { configureTikTok, stopTikTok, suspendTikTok, trackTikTok } from "@/lib/tiktok/client";
import type { TikTokPublicConfig } from "@/lib/tiktok/shared";

export default function TikTokTracking({ consent }: { consent: TikTokPublicConfig["consent"] }) {
  const pathname = usePathname();
  const { cart, hydrated, couponCode, reservationKey } = useCommerce();
  const [config, setConfig] = useState<TikTokPublicConfig>();
  const lastPage = useRef("");
  const lastCheckout = useRef("");
  useEffect(() => {
    if (consent !== "granted") { if (consent === "denied") stopTikTok(); else suspendTikTok(); return; }
    let active = true;
    let sequence = 0;
    const refresh = async () => {
      const current = ++sequence;
      try {
        const response = await fetch("/api/tiktok/config", { cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (!active || current !== sequence) return;
        if (!response.ok) { suspendTikTok(); setConfig(undefined); return; }
        const value: TikTokPublicConfig = await response.json();
        if (!active || current !== sequence) return;
        configureTikTok(value); setConfig(value);
      } catch { if (active && current === sequence) { suspendTikTok(); setConfig(undefined); } }
    };
    const focus = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("focus", focus);
    const timer = setInterval(focus, 60000);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", focus); suspendTikTok(); };
  }, [consent]);
  useEffect(() => {
    if (consent !== "granted" || !config?.enabled || config.consent !== "granted") { lastPage.current = ""; lastCheckout.current = ""; return; }
    const key = `${config.pixelId}:${config.externalId}:${pathname}`;
    if (lastPage.current === key) return;
    lastPage.current = key;
    void trackTikTok("Pageview");
    const match = pathname.match(/^\/(?:products|bundles)\/([a-z0-9-]+)$/);
    if (match) void trackTikTok("ViewContent", [{ slug: match[1], quantity: 1 }]);
    if (pathname !== "/checkout") lastCheckout.current = "";
  }, [config, consent, pathname]);
  useEffect(() => {
    if (consent !== "granted" || !config?.enabled || config.consent !== "granted" || !hydrated || !cart.length || pathname !== "/checkout" || lastCheckout.current === pathname) return;
    lastCheckout.current = pathname;
    void trackTikTok("InitiateCheckout", cart.map(({ slug, quantity }) => ({ slug, quantity })), { couponCode, reservationKey });
  }, [config, consent, hydrated, cart, pathname, couponCode, reservationKey]);
  return null;
}
