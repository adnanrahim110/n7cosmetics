"use client";
import type { MetaBrowserEvent, MetaEventName, MetaPublicConfig } from "./shared";
import { metaClickCookie, metaLandingClick, safeMetaPixelLocation, type MetaClick } from "./browser-policy";
import { deliverMetaClientEvent } from "./client-delivery";
import { metaAdvancedMatching, type MetaAdvancedMatching } from "./matching";

type PixelFunction = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: PixelFunction; loaded: boolean; version: string };
declare global { interface Window { fbq?: PixelFunction; _fbq?: PixelFunction } }
let configuration: MetaPublicConfig = { enabled: false, pixelId: "", consent: "unknown" };
let consentGeneration = 0;
// A landing URL stays in this tab's memory only. No cookie/storage/request is used before consent.
let landingClick: MetaClick | undefined;
let pixelScriptAttempts = 0;
const initialized = new Map<string, string>();
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
export function captureMetaLandingClick(): void {
  const click = metaLandingClick(location.href);
  if (click && click.id !== landingClick?.id) landingClick = click;
}
function loadPixelScript() {
  if (pixelScriptAttempts >= 2) return;
  pixelScriptAttempts++;
  const script = document.createElement("script");
  script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.referrerPolicy = "strict-origin";
  script.onerror = () => {
    script.remove();
    const generation = consentGeneration;
    window.setTimeout(() => {
      if (generation === consentGeneration && configuration.enabled && configuration.consent === "granted" && safePixelLocation()) loadPixelScript();
    }, 1500);
  };
  document.head.appendChild(script);
}
function initializePixel(id: string, externalId = configuration.externalId, refreshMatching = false, matching: MetaAdvancedMatching = configuration.matching ?? {}): boolean {
  // A missing identifier must not initialize an unmatched browser event.
  if (!safePixelLocation() || !externalId || !/^[a-f0-9]{64}$/.test(externalId)) return false;
  if (!window.fbq) {
    const fbq = function (...args: unknown[]) { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args); } as PixelFunction;
    fbq.queue = []; fbq.loaded = true; fbq.version = "2.0"; fbq.push = fbq;
    window.fbq = fbq; window._fbq = fbq;
    loadPixelScript();
  }
  window.fbq("consent", "grant");
  if (!initialized.has(id)) {
    window.fbq("set", "autoConfig", false, id);
  }
  // Meta's official Pixel template refreshes advanced matching with init before
  // subsequent events. Do not put identity in commerce/custom_data parameters.
  const userData = { ...metaAdvancedMatching(matching), external_id: externalId };
  const matchingKey = JSON.stringify(userData);
  if (refreshMatching || initialized.get(id) !== matchingKey) {
    window.fbq("init", id, userData);
    initialized.set(id, matchingKey);
  }
  return true;
}
function safePixelLocation(): boolean {
  // Pixel reads the document URL itself; keep receipt tokens and Stripe secrets out.
  return safeMetaPixelLocation(location.href, document.referrer);
}
export function configureMeta(config: MetaPublicConfig): void {
  if (JSON.stringify(configuration) !== JSON.stringify(config)) consentGeneration++;
  configuration = config;
  if (config.consent === "denied") landingClick = undefined;
  else captureMetaLandingClick();
  prunePurchaseMarkers(config.consent === "denied");
  if (!config.enabled || config.consent !== "granted") {
    window.fbq?.("consent", "revoke"); deleteMetaCookies(); return;
  }
  // Only derive a click cookie from an actual fbclid, and only after consent.
  const existingFbc = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith("_fbc="));
  if (landingClick && !existingFbc?.endsWith(`.${landingClick.id}`)) document.cookie = `_fbc=${metaClickCookie(landingClick)}; Max-Age=7776000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (config.pixelId) initializePixel(config.pixelId);
  window.dispatchEvent(new Event("n7:meta-ready"));
}
export function stopMeta(): void { configureMeta({ ...configuration, consent: "denied" }); }
// A temporary config failure pauses delivery without discarding an unconsented landing click.
export function suspendMeta(): void { configureMeta({ ...configuration, enabled: false }); }
export function sendMetaBrowserEvent(event: MetaBrowserEvent): void {
  if (!configuration.enabled || configuration.consent !== "granted" || !event.pixelId || event.pixelId !== configuration.pixelId || !safePixelLocation()) return;
  const key = `${event.pixelId}:${event.eventId}`;
  if (event.name === "Purchase") {
    if (purchaseSent.has(key)) return;
    try { if (Number(localStorage.getItem(`n7_meta_${key}`)) > Date.now()) return; } catch { /* In-memory guard still applies. */ }
  }
  if (!initializePixel(event.pixelId, event.externalId, true, event.matching ?? {})) return;
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
    const event = await deliverMetaClientEvent(
      JSON.stringify({ name, eventId: crypto.randomUUID(), path: location.pathname, items, ...extra }),
      () => generation === consentGeneration && configuration.enabled && configuration.consent === "granted",
    );
    if (event && generation === consentGeneration) sendMetaBrowserEvent(event);
  } catch { /* Analytics must never block a visitor action. */ }
}
