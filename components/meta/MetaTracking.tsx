"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { configureMeta, stopMeta, trackMeta } from "@/lib/meta/client";
import type { MetaPublicConfig } from "@/lib/meta/shared";
import { useCommerce } from "@/components/commerce/CommerceProvider";

export default function MetaTracking() {
  const pathname = usePathname();
  const { cart, hydrated, couponCode, reservationKey } = useCommerce();
  const [config, setConfig] = useState<MetaPublicConfig>();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastPage = useRef("");
  const lastCheckout = useRef("");
  const panel = useRef<HTMLElement>(null);
  const refreshSequence = useRef(0);
  const locallyDenied = useRef(false);
  const withdrawalSynced = useRef(false);
  const withdrawalRequest = useRef<Promise<void> | null>(null);
  const savingChoice = useRef(false);
  const refresh = useCallback(async () => {
    if (savingChoice.current) return;
    const sequence = ++refreshSequence.current;
    try {
      const response = await fetch("/api/meta/config", { cache: "no-store" });
      if (sequence !== refreshSequence.current) return;
      if (!response.ok) { stopMeta(); return; }
      const value: MetaPublicConfig = await response.json();
      if (sequence !== refreshSequence.current) return;
      try { locallyDenied.current = localStorage.getItem("n7-marketing-denied") === "1"; } catch { /* Keep the in-memory preference. */ }
      if (document.cookie.split(";").some(cookie => cookie.trim() === "n7_marketing_optout=1")) locallyDenied.current = true;
      if (locallyDenied.current) {
        if (!withdrawalSynced.current && !withdrawalRequest.current) withdrawalRequest.current = fetch("/api/meta/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"granted":false}', signal: AbortSignal.timeout(8000) }).then(response => { if (response.ok) withdrawalSynced.current = true; }).catch(() => undefined).finally(() => { withdrawalRequest.current = null; });
        value.consent = "denied";
      }
      configureMeta(value); setConfig(value);
    } catch { if (sequence === refreshSequence.current) stopMeta(); }
  }, []);
  useEffect(() => {
    const sequence = refreshSequence;
    const initial = window.setTimeout(() => void refresh(), 0);
    const show = () => { setOpen(true); };
    const focus = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("n7:cookie-preferences", show);
    window.addEventListener("focus", focus);
    const timer = window.setInterval(focus, 60000);
    return () => { sequence.current++; window.clearTimeout(initial); window.removeEventListener("n7:cookie-preferences", show); window.removeEventListener("focus", focus); window.clearInterval(timer); stopMeta(); };
  }, [refresh]);
  const granted = config?.enabled && config.consent === "granted";
  useEffect(() => {
    if (!granted) { lastPage.current = ""; lastCheckout.current = ""; return; }
    const key = `${config?.pixelId}:${pathname}`;
    if (lastPage.current === key) return;
    lastPage.current = key;
    void trackMeta("PageView");
    const match = pathname.match(/^\/(?:products|bundles)\/([a-z0-9-]+)$/);
    if (match) void trackMeta("ViewContent", [{ slug: match[1], quantity: 1 }]);
    if (pathname !== "/checkout") lastCheckout.current = "";
  }, [granted, config?.pixelId, pathname]);
  useEffect(() => {
    if (!granted || !hydrated || !cart.length || pathname !== "/checkout" || lastCheckout.current === pathname) return;
    lastCheckout.current = pathname;
    void trackMeta("InitiateCheckout", cart.map(({ slug, quantity }) => ({ slug, quantity })), { couponCode, reservationKey });
  }, [granted, hydrated, cart, pathname, couponCode, reservationKey]);
  const visible = open || (config?.enabled && config.consent === "unknown");
  useEffect(() => { if (open) panel.current?.focus(); }, [open]);
  async function choose(granted: boolean) {
    savingChoice.current = true;
    refreshSequence.current++;
    if (!granted) {
      withdrawalSynced.current = false;
      locallyDenied.current = true;
      document.cookie = `n7_marketing_optout=1; Max-Age=15552000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      try { localStorage.setItem("n7-marketing-denied", "1"); } catch { /* Storage is optional. */ }
      stopMeta(); // Stop immediately, even if the preference request fails.
    }
    setBusy(true); setError("");
    try {
      // Finish a pending withdrawal before a newer explicit choice can replace it.
      await withdrawalRequest.current;
      const response = await fetch("/api/meta/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ granted }) });
      if (!response.ok) throw new Error("Unable to save your preference. Please try again.");
      locallyDenied.current = !granted;
      withdrawalSynced.current = !granted;
      try { if (granted) localStorage.removeItem("n7-marketing-denied"); } catch { /* In-memory consent still applies. */ }
      savingChoice.current = false;
      await refresh(); setOpen(false);
      // The storage message makes other open tabs stop promptly after withdrawal.
      try { localStorage.setItem("n7-cookie-change", String(Date.now())); } catch { /* Optional cross-tab notification. */ }
    } catch (error) { setError(error instanceof Error ? error.message : "Please try again."); }
    finally { savingChoice.current = false; setBusy(false); }
  }
  useEffect(() => {
    const changed = (event: StorageEvent) => { if (event.key === "n7-cookie-change" || event.key === "n7-marketing-denied") { stopMeta(); void refresh(); } };
    window.addEventListener("storage", changed); return () => window.removeEventListener("storage", changed);
  }, [refresh]);
  if (!visible) return null;
  return <section data-mobile-purchase-blocker ref={panel} tabIndex={-1} aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-2xl rounded-xl border border-[#967c55]/30 bg-[#f8f4ed] p-5 text-[#1c1814] shadow-2xl sm:bottom-5 sm:p-6">
    <h2 className="font-body text-lg font-semibold">Your cookie preferences</h2>
    <p className="mt-2 text-sm leading-6 text-black/65">Essential storage keeps your basket and checkout working. With your permission, we also use Meta cookies and share browsing and purchase information to measure and improve our advertising. You can change your choice anytime.</p>
    <Link href="/privacy#meta" className="mt-2 inline-block text-sm text-[#705230] underline underline-offset-4">How we use your information</Link>
    {error ? <p role="alert" className="mt-3 text-sm text-red-800">{error}</p> : null}
    <div className="mt-4 flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={() => void choose(false)} className="min-h-11 flex-1 rounded-lg border border-[#1c1814] px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Essential only</button>
      <button type="button" disabled={busy} onClick={() => void choose(true)} className="min-h-11 flex-1 rounded-lg bg-[#1c1814] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Allow marketing</button>
      {open && config?.consent !== "unknown" ? <button type="button" onClick={() => setOpen(false)} className="px-3 text-sm underline">Close</button> : null}
    </div>
  </section>;
}
