"use client";
import type { MetaBrowserEvent, MetaEventName, MetaPublicConfig } from "./shared";

type PixelFunction = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: PixelFunction; loaded: boolean; version: string };
declare global { interface Window { fbq?: PixelFunction; _fbq?: PixelFunction } }
let configuration: MetaPublicConfig = { enabled: false, pixelId: "", consent: "unknown" };
let consentGeneration = 0;
const initialized = new Set<string>();
const purchaseSent = new Set<string>();
const purchaseRetentionMs = 47 * 60 * 60 * 1000;

function prunePurchaseMarkers(clear = false) {
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index);
      if (!key?.startsWith("n7_meta_")) continue;
      const expiresAt = Number(localStorage.getItem(key));
      if (clear || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) localStorage.removeItem(key);
    }
  } catch { /* Storage is optional. */ }
}

function deleteMetaCookies() {
  for (const name of ["_fbp", "_fbc"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    const parts = location.hostname.split(".");
    for (let i = 0; i < parts.length - 1; i++) document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.${parts.slice(i).join(".")}; SameSite=Lax`;
  }
}
function initializePixel(id: string) {
  if (!safePixelLocation()) return;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args); } as PixelFunction;
    fbq.queue = []; fbq.loaded = true; fbq.version = "2.0"; fbq.push = fbq;
    window.fbq = fbq; window._fbq = fbq;
    const script = document.createElement("script"); script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.referrerPolicy = "strict-origin";
    document.head.appendChild(script);
  }
  window.fbq("consent", "grant");
  if (!initialized.has(id)) {
    window.fbq("set", "autoConfig", false, id);
    window.fbq("init", id);
    initialized.add(id);
  }
}
function safePixelLocation(): boolean {
  // Pixel reads the document URL itself; keep receipt tokens and Stripe secrets out.
  const allowed = new Set(["fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);
  return [location.href, document.referrer].every(value => {
    if (!value) return true;
    try { return [...new URL(value).searchParams.keys()].every(key => allowed.has(key)); }
    catch { return false; }
  });
}
export function configureMeta(config: MetaPublicConfig): void {
  if (JSON.stringify(configuration) !== JSON.stringify(config)) consentGeneration++;
  configuration = config;
  prunePurchaseMarkers(config.consent === "denied");
  if (!config.enabled || config.consent !== "granted") {
    window.fbq?.("consent", "revoke"); deleteMetaCookies(); return;
  }
  // Only derive a click cookie from an actual fbclid, and only after consent.
  const fbclid = new URL(location.href).searchParams.get("fbclid");
  const existingFbc = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith("_fbc="));
  if (fbclid && /^[A-Za-z0-9_-]{1,500}$/.test(fbclid) && !existingFbc?.endsWith(`.${fbclid}`)) document.cookie = `_fbc=fb.1.${Date.now()}.${fbclid}; Max-Age=7776000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (config.pixelId) initializePixel(config.pixelId);
  window.dispatchEvent(new Event("n7:meta-ready"));
}
export function stopMeta(): void { configureMeta({ ...configuration, consent: "denied" }); }
export function sendMetaBrowserEvent(event: MetaBrowserEvent): void {
  if (!configuration.enabled || configuration.consent !== "granted" || !event.pixelId || event.pixelId !== configuration.pixelId || !safePixelLocation()) return;
  const key = `${event.pixelId}:${event.eventId}`;
  if (event.name === "Purchase") {
    if (purchaseSent.has(key)) return;
    try { if (Number(localStorage.getItem(`n7_meta_${key}`)) > Date.now()) return; } catch { /* In-memory guard still applies. */ }
  }
  initializePixel(event.pixelId);
  // Only allow canonical commerce fields; Pixel also reads the checked document URL/referrer.
  window.fbq?.("trackSingle", event.pixelId, event.name, event.data, { eventID: event.eventId });
  if (event.name === "Purchase") {
    purchaseSent.add(key);
    try { localStorage.setItem(`n7_meta_${key}`, String(Date.now() + purchaseRetentionMs)); } catch { /* Storage is optional. */ }
  }
}
export async function trackMeta(name: MetaEventName, items: { slug: string; quantity: number }[] = [], extra: { couponCode?: string; reservationKey?: string } = {}): Promise<void> {
  if (!configuration.enabled || configuration.consent !== "granted") return;
  const generation = consentGeneration;
  try {
    const response = await fetch("/api/meta/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, eventId: crypto.randomUUID(), path: location.pathname, items, ...extra }), keepalive: true, signal: AbortSignal.timeout(8000) });
    if (response.status !== 200 || generation !== consentGeneration) return;
    sendMetaBrowserEvent(await response.json());
  } catch { /* Analytics must never block a visitor action. */ }
}
