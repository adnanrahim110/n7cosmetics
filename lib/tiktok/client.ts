"use client";
import { tiktokPixelTransport } from "./pixel-transport";
import { safeTikTokPixelLocation, tiktokPageUrl } from "./pixel";
import type { TikTokPublicConfig, TikTokBrowserEvent, TikTokEventName } from "./shared";
import { checkoutMetaMatching, type MetaMatchingInput } from "../meta/matching-input";

let config: TikTokPublicConfig = { enabled: false, pixelId: "", consent: "unknown" };
let generation = 0;
let landingClick: string | undefined;
let matchingSequence = 0;
let matchingTail: Promise<boolean> = Promise.resolve(false);
let matchingPending: Promise<boolean> | undefined;
let matchingFingerprint = "";
const purchases = new Map<string, number>();
const retention = 47 * 60 * 60 * 1000;
function locallyDenied(): boolean {
  try { if (document.cookie.split(";").some(cookie => cookie.trim() === "n7_marketing_optout=1")) return true; } catch { /* Storage is optional. */ }
  try { return localStorage.getItem("n7-marketing-denied") === "1"; } catch { return false; }
}

export function captureTikTokLandingClick(): void {
  try {
    const click = new URL(location.href).searchParams.get("ttclid");
    if (click && /^[A-Za-z0-9_.~-]{1,500}$/.test(click)) landingClick = click;
  } catch { /* Optional attribution. */ }
}
function prune(clear = false) {
  for (const [key, expires] of purchases) if (clear || expires <= Date.now()) purchases.delete(key);
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index);
      if (!key?.startsWith("n7_tiktok_")) continue;
      const expires = Number(localStorage.getItem(key));
      if (clear || !Number.isFinite(expires) || expires <= Date.now()) localStorage.removeItem(key);
    }
  } catch { /* Storage is optional. */ }
}
function clearCookies() {
  try {
    const names = document.cookie.split(";").map(cookie => cookie.trim().split("=")[0]).filter(name => name === "_ttp" || name === "ttclid" || /^ttcsid(?:_|$)/.test(name));
    for (const name of names) {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      const parts = location.hostname.split(".");
      for (let index = 0; index < parts.length - 1; index++) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${parts.slice(index).join(".")}; SameSite=Lax`;
    }
  } catch { /* Cookie storage may be blocked. */ }
}
export function configureTikTok(value: TikTokPublicConfig): void {
  if (locallyDenied()) value = { ...value, consent: "denied" };
  if (config.enabled !== value.enabled || config.pixelId !== value.pixelId || config.externalId !== value.externalId || config.consent !== value.consent) { generation++; matchingFingerprint = ""; }
  config = value;
  tiktokPixelTransport.configure(config.pixelId, config.externalId, config.enabled && config.consent === "granted");
  prune(config.consent === "denied");
  if (config.consent === "denied") { landingClick = undefined; clearCookies(); }
  if (config.enabled && config.consent === "granted") {
    captureTikTokLandingClick();
    if (landingClick && !document.cookie.split(";").some(cookie => cookie.trim() === `ttclid=${landingClick}`)) {
      // Preserve only a real TikTok click ID, after permission. The SDK owns _ttp.
      document.cookie = `ttclid=${landingClick}; Max-Age=7776000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    }
    window.dispatchEvent(new Event("n7:tiktok-ready"));
  }
}
export function stopTikTok(): void { configureTikTok({ ...config, consent: "denied" }); }
export function suspendTikTok(): void { configureTikTok({ ...config, enabled: false }); }

export function updateTikTokMatching(input: MetaMatchingInput): Promise<boolean> {
  if (!config.enabled || config.consent !== "granted") return Promise.resolve(false);
  const profile = checkoutMetaMatching(input);
  if (!profile) return Promise.resolve(false);
  const body = JSON.stringify(profile), epoch = generation, sequence = ++matchingSequence;
  const active = () => epoch === generation && config.enabled && config.consent === "granted" && !locallyDenied();
  const work = matchingTail.then(async () => {
    if (!active() || sequence !== matchingSequence) return false;
    try {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (!active() || sequence !== matchingSequence) return false;
      if (matchingFingerprint === fingerprint) return true;
      matchingFingerprint = "";
      const response = await fetch("/api/tiktok/matching", { method: "POST", headers: { "Content-Type": "application/json" }, body, credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok || response.status === 204 || !active() || sequence !== matchingSequence) return false;
      const value: unknown = await response.json();
      if (!value || typeof value !== "object" || !("externalId" in value) || value.externalId !== config.externalId) return false;
      matchingFingerprint = fingerprint; return true;
    } catch { return false; }
  });
  matchingTail = work; matchingPending = work;
  void work.finally(() => { if (matchingPending === work) matchingPending = undefined; });
  return work;
}
export async function sendTikTokBrowserEvent(event: TikTokBrowserEvent, source = { url: location.href, referrer: document.referrer }): Promise<boolean> {
  if (!config.enabled || config.consent !== "granted" || locallyDenied() || !event.pixelId || event.pixelId !== config.pixelId || event.externalId !== config.externalId || !safeTikTokPixelLocation(source.url, source.referrer)) return false;
  const key = `${event.pixelId}:${event.eventId}`;
  if (event.name === "Purchase") {
    if ((purchases.get(key) ?? 0) > Date.now()) return true;
    try { if (Number(localStorage.getItem(`n7_tiktok_${key}`)) > Date.now()) return true; } catch { /* Memory guard remains. */ }
  }
  const epoch = generation;
  const page = tiktokPageUrl(source.url, location.origin);
  if (!page) return false;
  const sent = await tiktokPixelTransport.send(event, location.origin + page);
  if (!sent || epoch !== generation) return false;
  if (event.name === "Purchase") {
    const expires = Date.now() + retention; purchases.set(key, expires);
    try { localStorage.setItem(`n7_tiktok_${key}`, String(expires)); } catch { /* Optional storage. */ }
  }
  return true;
}
export async function trackTikTok(name: TikTokEventName, items: { slug: string; quantity: number }[] = [], extra: { couponCode?: string; reservationKey?: string } = {}): Promise<void> {
  if (!config.enabled || config.consent !== "granted") return;
  const epoch = generation;
  const source = { url: location.href, referrer: document.referrer };
  const body = JSON.stringify({ name, eventId: crypto.randomUUID(), path: location.pathname, items, ...extra });
  const active = () => epoch === generation && config.enabled && config.consent === "granted" && !locallyDenied();
  try {
    while (matchingPending) { const pending = matchingPending; await pending; if (matchingPending === pending) break; }
    // Transient collection failures retry with the SAME action ID.
    for (let attempt = 0; attempt < 3 && active(); attempt++) {
      try {
        const response = await fetch("/api/tiktok/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, credentials: "same-origin", cache: "no-store", keepalive: true, signal: AbortSignal.timeout(5000) });
        if (response.status === 204 || !active()) return;
        if (response.ok) { const event: TikTokBrowserEvent = await response.json(); if (active()) await sendTikTokBrowserEvent(event, source); return; }
        if (response.status !== 429 && response.status < 500) return;
      } catch { /* Retry the same action. */ }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 300 * 2 ** attempt));
    }
  } catch { /* Analytics never interrupts shopping. */ }
}
