export interface MetaPixelFrameOptions {
  channel: string;
  pixelId: string;
  externalId: string;
  matchingKeys: readonly string[];
  campaignKeys: readonly string[];
  eventNames: readonly string[];
}

type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push?: PixelFunction;
  loaded: boolean;
  version: string;
};
declare global { interface Window { fbq?: PixelFunction; _fbq?: PixelFunction } }

// Serialized into a small same-origin document; all dependencies must remain
// inside this function or in its JSON options. Only the official SDK sends hits.
export function metaPixelFrameRuntime(options: MetaPixelFrameOptions): void {
  let active = true;
  let initialized = false;
  let ready = false;
  let attempts = 0;
  let profile: Record<string, string> = {};
  const pending: Record<string, unknown>[] = [];
  const sent = new Set<string>();
  const reply = (type: string, eventId?: string) => window.parent.postMessage({ type: `n7:meta-pixel-${type}`, channel: options.channel, ...(eventId ? { eventId } : {}) }, location.origin);
  const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
  const matching = (value: unknown) => {
    const result: Record<string, string> = { external_id: options.externalId };
    if (record(value)) for (const key of options.matchingKeys) {
      const field = value[key];
      if (typeof field === "string" && /^[a-f0-9]{64}$/.test(field)) result[key] = field;
    }
    return result;
  };
  const deliver = (event: Record<string, unknown>) => {
    if (!active || !ready || typeof event.eventId !== "string" || !event.eventId || event.eventId.length > 100 || typeof event.name !== "string" || !options.eventNames.includes(event.name) || event.pixelId !== options.pixelId || event.externalId !== options.externalId || JSON.stringify(matching(event.matching)) !== JSON.stringify(profile) || !record(event.data)) return;
    const key = `${event.name}:${event.eventId}`;
    if (!sent.has(key)) {
      const data: Record<string, unknown> = {};
      for (const key of ["content_type", "content_name", "content_category", "content_ids", "contents", "currency", "value", "num_items"]) if (key in event.data) data[key] = event.data[key];
      window.fbq?.(event.name === "ViewCategory" ? "trackSingleCustom" : "trackSingle", options.pixelId, event.name, data, { eventID: event.eventId });
      sent.add(key);
    }
    // A queued browser call is observable; Meta attribution/acceptance is not.
    reply("queued", event.eventId);
  };
  const load = () => {
    if (!active) return;
    attempts++;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.referrerPolicy = "strict-origin";
    script.onload = () => {
      if (!active || !window.fbq?.callMethod) { if (active) reply("error"); return; }
      ready = true;
      reply("ready");
      for (const event of pending.splice(0)) deliver(event);
    };
    script.onerror = () => { script.remove(); if (active && attempts < 2) setTimeout(load, 1000); else if (active) reply("error"); };
    document.head.appendChild(script);
  };
  window.addEventListener("message", (message: MessageEvent<unknown>) => {
    if (message.origin !== location.origin || message.source !== window.parent || !record(message.data) || message.data.channel !== options.channel) return;
    const value = message.data;
    if (value.type === "n7:meta-pixel-revoke") {
      active = false;
      pending.length = 0;
      if (window.fbq) { window.fbq.queue.length = 0; window.fbq("consent", "revoke"); }
      return;
    }
    if (!active) return;
    if (value.type === "n7:meta-pixel-init" && !initialized) {
      if (value.pixelId !== options.pixelId || value.externalId !== options.externalId || typeof value.url !== "string") { reply("error"); return; }
      try {
        const url = new URL(value.url);
        if (url.origin !== location.origin || [...url.searchParams.keys()].some(key => !options.campaignKeys.includes(key))) { reply("error"); return; }
        // The SDK reads its document URL. Set it before loading; the frame's
        // channel and all receipt/payment credentials stay out of Meta traffic.
        history.replaceState(null, "", url.pathname + url.search);
        profile = matching(value.matching);
        const fbq = function (...args: unknown[]) { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue.push(args); } as PixelFunction;
        fbq.queue = []; fbq.loaded = true; fbq.version = "2.0"; fbq.push = fbq;
        window.fbq = fbq; window._fbq = fbq;
        fbq("consent", "grant");
        fbq("set", "autoConfig", false);
        fbq("set", "autoConfig", false, options.pixelId);
        fbq("init", options.pixelId, profile);
        initialized = true;
        load();
      } catch { reply("error"); }
    }
    if (value.type === "n7:meta-pixel-event" && record(value.event)) {
      if (ready) deliver(value.event);
      else if (pending.length < 50) pending.push(value.event);
    }
  });
  reply("loaded");
}

export function metaPixelFrameDocument(options: MetaPixelFrameOptions): string {
  const json = JSON.stringify(options).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Advertising measurement</title></head><body><script>(${metaPixelFrameRuntime.toString()})(${json});</script></body></html>`;
}
