"use client";
import type { MetaBrowserEvent, MetaEventName, MetaPublicConfig } from "./shared";
import { metaClickCookie, metaCookieDomainIndex, metaLandingClick, safeMetaPixelLocation, type MetaClick } from "./browser-policy";
import { deliverMetaClientEvent } from "./client-delivery";
import { metaAdvancedMatching } from "./matching";
import { checkoutMetaMatching, type MetaMatchingInput } from "./matching-input";
import { metaPixelTransport } from "./pixel-transport";
let configuration: MetaPublicConfig = { enabled: false, pixelId: "", consent: "unknown" };
let consentGeneration = 0;
// A landing URL stays in this tab's memory only. No cookie/storage/request is used before consent.
let landingClick: MetaClick | undefined;
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
export function configureMeta(config: MetaPublicConfig): void {
  if (configuration.enabled !== config.enabled || configuration.pixelId !== config.pixelId || configuration.consent !== config.consent || configuration.externalId !== config.externalId) consentGeneration++;
  configuration = config;
  if (config.consent === "denied") landingClick = undefined;
  else captureMetaLandingClick();
  prunePurchaseMarkers(config.consent === "denied");
  metaPixelTransport.configure(config.pixelId, config.externalId, config.enabled && config.consent === "granted");
  if (!config.enabled || config.consent !== "granted") {
    deleteMetaCookies(); return;
  }
  // Bootstrap the same first-party browser identifier the SDK uses. This also
  // lets the first CAPI request share it before the asynchronous SDK is ready.
  if (config.pixelId && !document.cookie.split(";").some(part => /^_fbp=fb\.\d\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(part.trim()))) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] % 2147483647;
    document.cookie = `_fbp=fb.${metaCookieDomainIndex(location.hostname)}.${Date.now()}.${random}; Max-Age=7776000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  // Only derive a click cookie from an actual fbclid, and only after consent.
  const existingFbc = document.cookie.split(";").map(part => part.trim()).find(part => part.startsWith("_fbc="));
  if (landingClick && !existingFbc?.endsWith(`.${landingClick.id}`)) document.cookie = `_fbc=${metaClickCookie(landingClick, location.hostname)}; Max-Age=7776000; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
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
          // Success means the validated profile is saved and synchronized.
          // Actual browser calls are acknowledged separately by the transport.
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
export async function sendMetaBrowserEvent(event: MetaBrowserEvent, source = { url: location.href, referrer: document.referrer }): Promise<boolean> {
  // Retain the action's public URL across asynchronous matching and SPA routing.
  if (!configuration.enabled || configuration.consent !== "granted" || !event.pixelId || event.pixelId !== configuration.pixelId || event.externalId !== configuration.externalId || !safeMetaPixelLocation(source.url, source.referrer)) return false;
  const key = `${event.pixelId}:${event.eventId}`;
  if (event.name === "Purchase") {
    if (purchaseSent.has(key)) return true;
    try { if (Number(localStorage.getItem(`n7_meta_${key}`)) > Date.now()) return true; } catch { /* In-memory guard still applies. */ }
  }
  const generation = consentGeneration;
  const delivered = await metaPixelTransport.send(event, source.url);
  if (!delivered || generation !== consentGeneration || configuration.consent !== "granted") return false;
  if (event.name === "Purchase") {
    purchaseSent.add(key);
    try { localStorage.setItem(`n7_meta_${key}`, String(Date.now() + purchaseRetentionMs)); } catch { /* Storage is optional. */ }
  }
  return true;
}
export async function trackMeta(name: MetaEventName, items: { slug: string; quantity: number }[] = [], extra: { couponCode?: string; reservationKey?: string } = {}): Promise<void> {
  if (!configuration.enabled || configuration.consent !== "granted") return;
  const generation = consentGeneration;
  const path = location.pathname;
  const source = { url: location.href, referrer: document.referrer };
  try {
    // Do not race a confirmed wallet/checkout profile with event collection.
    while (matchingPending?.generation === generation) {
      const pending = matchingPending.promise;
      await pending;
      if (matchingPending?.promise === pending) break;
    }
    if (generation !== consentGeneration || configuration.consent !== "granted") return;
    const event = await deliverMetaClientEvent(
      JSON.stringify({ name, eventId: crypto.randomUUID(), path, items, ...extra }),
      () => generation === consentGeneration && configuration.enabled && configuration.consent === "granted",
    );
    if (event && generation === consentGeneration) await sendMetaBrowserEvent(event, source);
  } catch { /* Analytics must never block a visitor action. */ }
}
