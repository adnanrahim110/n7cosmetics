export interface TikTokPixelFrameOptions {
  channel: string; pixelId: string; externalId: string; campaignKeys: readonly string[]; eventNames: readonly string[];
}
type Queue = unknown[][] & { [key: string]: unknown };
declare global { interface Window { ttq?: Queue; TiktokAnalyticsObject?: string } }

// This function is serialized into an isolated same-origin document. The
// official bootstrap is installed lazily, only after the parent URL is checked.
export function tiktokPixelFrameRuntime(options: TikTokPixelFrameOptions): void {
  let active = true;
  let initialized = false;
  let ready = false;
  let profile: Record<string, string> = {};
  const sent = new Set<string>();
  const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
  const reply = (type: string, eventId?: string) => window.parent.postMessage({ type: `n7:tiktok-pixel-${type}`, channel: options.channel, ...(eventId ? { eventId } : {}) }, location.origin);
  const matching = (value: unknown) => {
    const result: Record<string, string> = {};
    if (record(value)) for (const key of ["email", "phone", "external_id"]) {
      const field = value[key];
      if (typeof field === "string" && /^[a-f0-9]{64}$/.test(field)) result[key] = field;
    }
    return result;
  };
  const call = (method: string, ...args: unknown[]) => {
    const fn = window.ttq?.[method];
    if (typeof fn !== "function") throw new Error("SDK unavailable");
    fn.apply(window.ttq, args);
  };
  window.addEventListener("message", (message: MessageEvent<unknown>) => {
    if (message.origin !== location.origin || message.source !== window.parent || !record(message.data) || message.data.channel !== options.channel) return;
    const value = message.data;
    if (value.type === "n7:tiktok-pixel-revoke") {
      active = false;
      if (window.ttq) { window.ttq.length = 0; try { call("revokeConsent"); } catch { /* SDK blocked. */ } }
      return;
    }
    if (!active) return;
    if (value.type === "n7:tiktok-pixel-init" && !initialized) {
      if (value.pixelId !== options.pixelId || value.externalId !== options.externalId || typeof value.url !== "string") { reply("error"); return; }
      try {
        const url = new URL(value.url);
        if (url.origin !== location.origin || url.hash || [...url.searchParams.keys()].some(key => !options.campaignKeys.includes(key)) || !/^\/(?!\/)[A-Za-z0-9/_-]*$/.test(url.pathname) || /^\/(admin|api|media|newsletter)(\/|$)/.test(url.pathname)) { reply("error"); return; }
        history.replaceState(null, "", url.pathname + url.search);
        profile = matching(value.matching);
        if (profile.external_id !== options.externalId) { reply("error"); return; }
        initialized = true;
        // The document defines this official bootstrap; it does not load any SDK
        // until explicitly called here after identity and URL validation.
        window.dispatchEvent(new Event("n7:tiktok-bootstrap"));
        call("holdConsent");
        call("load", options.pixelId);
        call("grantConsent");
        call("identify", { ...(profile.email ? { sha256_email: profile.email } : {}), ...(profile.phone ? { sha256_phone_number: profile.phone } : {}), external_id: profile.external_id });
        call("ready", () => { if (active) { ready = true; reply("ready"); } });
      } catch { reply("error"); }
    }
    if (value.type === "n7:tiktok-pixel-event" && ready && record(value.event)) {
      const event = value.event;
      if (event.pixelId !== options.pixelId || event.externalId !== options.externalId || typeof event.name !== "string" || !options.eventNames.includes(event.name) || typeof event.eventId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(event.eventId) || JSON.stringify(matching(event.matching)) !== JSON.stringify(profile) || !record(event.data)) return;
      const key = `${event.name}:${event.eventId}`;
      if (!sent.has(key)) {
        const data: Record<string, unknown> = {};
        for (const key of ["content_type", "content_ids", "contents", "currency", "value", "quantity", "order_id"]) if (key in event.data) data[key] = event.data[key];
        try { call("track", event.name, data, { event_id: event.eventId, pixel_code: options.pixelId }); }
        catch { reply("error"); return; }
        sent.add(key);
      }
      reply("queued", event.eventId);
    }
  });
  reply("loaded");
}

export function tiktokPixelFrameDocument(options: TikTokPixelFrameOptions): string {
  const json = JSON.stringify(options).replace(/</g, "\\u003c");
  const channel = JSON.stringify(options.channel).replace(/</g, "\\u003c");
  // Official TikTok deferred bootstrap. No automatic page call: every Pageview
  // is explicitly paired with the server event's deduplication ID.
  const bootstrap = `window.addEventListener('n7:tiktok-bootstrap',function(){
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";s.async=true;s.referrerPolicy="no-referrer";s.src=r+"?sdkid="+e+"&lib="+t;s.onerror=function(){w.parent.postMessage({type:'n7:tiktok-pixel-error',channel:${channel}},location.origin)};d.head.appendChild(s)}}(window,document,'ttq');
},{once:true});`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TikTok measurement</title></head><body><script>${bootstrap}\n(${tiktokPixelFrameRuntime.toString()})(${json});</script></body></html>`;
}
