import { safeEventPath } from "../meta/shared";

export const TIKTOK_PIXEL_ID = "DB7Q61BC77UCS546PMGG";

// Only public advertising parameters belong in a measurement URL.
export const tiktokCampaignKeys = [
  "fbclid", "adset_id", "placement", "site_source_name",
  "ttclid", "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "utm_id", "campaign_id", "ad_id",
] as const;
const campaignKeys = new Set<string>(tiktokCampaignKeys);

export function safeTikTokPixelLocation(url: string, referrer: string): boolean {
  return [url, referrer].every(value => {
    if (!value) return true;
    try { const parsed = new URL(value); return !parsed.hash && [...parsed.searchParams.keys()].every(key => campaignKeys.has(key)); }
    catch { return false; }
  });
}

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
