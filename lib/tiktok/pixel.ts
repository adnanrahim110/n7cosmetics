import { safeEventPath } from "../meta/shared";

export const TIKTOK_PIXEL_ID = "DB7Q61BC77UCS546PMGG";

// Only public advertising parameters belong in a measurement URL.
const campaignKeys = new Set([
  "ttclid", "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "utm_id", "campaign_id", "ad_id",
]);

export function tiktokPageUrl(value: string, origin: string): string | null {
  try {
    if (!value) return null;
    const url = new URL(value, origin);
    if (url.origin !== origin || !safeEventPath(url.pathname)) return null;
    const clean = new URL(url.pathname, origin);
    for (const [key, value] of url.searchParams) {
      if (campaignKeys.has(key) && /^[A-Za-z0-9_.~+% -]{1,500}$/.test(value))
        clean.searchParams.append(key, value);
    }
    return clean.pathname + clean.search;
  } catch { return null; }
}

export function tiktokPixelDocument(pageUrl: string): string {
  const page = JSON.stringify(pageUrl).replace(/</g, "\\u003c");
  // Like Meta, use a separate document so the SDK sees a public page URL and
  // does not install automatic navigation listeners in the checkout document.
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TikTok measurement</title></head><body><script>
history.replaceState(null, '', ${page});
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";s.async=true;s.referrerPolicy="no-referrer";s.src=r+"?sdkid="+e+"&lib="+t;d.head.appendChild(s)};
  ttq.holdConsent();
  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.grantConsent();
  ttq.page();
}(window, document, 'ttq');
</script></body></html>`;
}
