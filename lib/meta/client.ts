"use client";
import type { MetaBrowserEvent, MetaEventName, MetaPublicConfig } from "./shared";
import { metaClickCookie, metaLandingClick, safeMetaPixelLocation, type MetaClick } from "./browser-policy";
import { deliverMetaClientEvent } from "./client-delivery";
import { metaAdvancedMatching, type MetaAdvancedMatching } from "./matching";
import { checkoutMetaMatching, type MetaMatchingInput } from "./matching-input";
import { prepareMetaPixelMatching, type MetaPixelIdentity } from "./pixel-matching";

type PixelFunction = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[][]; push?: PixelFunction; loaded: boolean; version: string };
declare global { interface Window { fbq?: PixelFunction; _fbq?: PixelFunction } }
let configuration: MetaPublicConfig = { enabled: false, pixelId: "", consent: "unknown" };
let consentGeneration = 0;
// A landing URL stays in this tab's memory only. No cookie/storage/request is used before consent.
let landingClick: MetaClick | undefined;
let pixelScriptAttempts = 0;
const initialized = new Map<string, MetaPixelIdentity>();
const purchaseSent = new Set<string>();
const purchaseRetentionMs = 47 * 60 * 60 * 1000;
let matchingSequence = 0;
let matchingTail: Promise<boolean> = Promise.resolve(false);
let matchingPending: { body: string; generation: number; promise: Promise<boolean> } | undefined;
let matchingApplied = "";

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
function initializePixel(id: string, externalId = configuration.externalId, matching: MetaAdvancedMatching = configuration.matching ?? {}): boolean {
  // Browser delivery still requires the server's valid consent identity.
  if (!safePixelLocation()) return false;
  const next = prepareMetaPixelMatching(initialized.get(id), externalId, matching);
  if (!next) return false;
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
  if (next.initialize) window.fbq("init", id, next.userData);
  initialized.set(id, next.identity);
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
export function updateMetaMatching(input: MetaMatchingInput): Promise<boolean> {
  if (!configuration.enabled || configuration.consent !== "granted" || !configuration.externalId) return Promise.resolve(false);
  const generation = consentGeneration;
  const pixelId = configuration.pixelId, externalId = configuration.externalId;
  const active = () => generation === consentGeneration && configuration.enabled && configuration.consent === "granted";
  const profile = checkoutMetaMatching(input);
  if (!profile) return Promise.resolve(false);
  const body = JSON.stringify(profile);
  if (matchingPending?.generation === generation && matchingPending.body === body) return matchingPending.promise;
  // Assign sequence before asynchronous hashing, so completion order cannot
  // reorder two changes. Raw details live only in the pending request's memory.
  const sequence = ++matchingSequence;
  if (matchingPending) matchingApplied = "";
  const promise = (async () => {
    try {
      // Cache only a fingerprint after success; never persist raw contact data.
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
      if (!active() || sequence !== matchingSequence) return false;
      const key = `${generation}:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
      if (matchingApplied === key) return true;
      matchingApplied = "";
      // Serialize writes; skip superseded updates that have not started yet.
      const work = matchingTail.then(async () => {
        if (!active() || sequence !== matchingSequence) return false;
        try {
          const response = await fetch("/api/meta/matching", {
            method: "POST", headers: { "Content-Type": "application/json" }, body,
            credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(5000),
          });
          if (!response.ok || response.status === 204 || !active() || sequence !== matchingSequence) return false;
          const value: unknown = await response.json();
          if (!active() || sequence !== matchingSequence || !value || typeof value !== "object" || !("pixelId" in value) || !("externalId" in value) || !("matching" in value)) return false;
          if (value.pixelId !== pixelId || value.externalId !== externalId) return false;
          const matching = metaAdvancedMatching(value.matching);
          if (!matching.em) return false;
          configuration = { ...configuration, matching };
          if (pixelId) initializePixel(pixelId, externalId, matching);
          matchingApplied = key;
          return true;
        } catch { return false; }
      });
      matchingTail = work;
      return await work;
    } catch { return false; }
  })();
  matchingPending = { body, generation, promise };
  void promise.then(() => { if (matchingPending?.promise === promise) matchingPending = undefined; });
  return promise;
}
export function sendMetaBrowserEvent(event: MetaBrowserEvent): void {
  if (!configuration.enabled || configuration.consent !== "granted" || !event.pixelId || event.pixelId !== configuration.pixelId || !safePixelLocation()) return;
  const key = `${event.pixelId}:${event.eventId}`;
  if (event.name === "Purchase") {
    if (purchaseSent.has(key)) return;
    try { if (Number(localStorage.getItem(`n7_meta_${key}`)) > Date.now()) return; } catch { /* In-memory guard still applies. */ }
  }
  if (!initializePixel(event.pixelId, event.externalId, event.matching ?? {})) return;
  // Only allow canonical commerce fields; Pixel also reads the checked document URL/referrer.
  const command = event.name === "ViewCategory" ? "trackSingleCustom" : "trackSingle";
  window.fbq?.(command, event.pixelId, event.name, event.data, { eventID: event.eventId });
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
