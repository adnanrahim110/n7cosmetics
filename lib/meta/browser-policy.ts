// Public campaign parameters are safe for the Pixel; receipt/payment credentials are not.
const campaignParameters = new Set([
  "fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id",
  "campaign_id", "adset_id", "ad_id", "placement", "site_source_name",
  "hsa_acc", "hsa_cam", "hsa_grp", "hsa_ad", "hsa_src", "hsa_net", "hsa_ver",
]);

export function safeMetaPixelLocation(url: string, referrer: string): boolean {
  return [url, referrer].every(value => {
    if (!value) return true;
    try { return [...new URL(value).searchParams.keys()].every(key => campaignParameters.has(key)); }
    catch { return false; }
  });
}

export interface MetaClick { id: string; arrivedAt: number }
export function metaLandingClick(url: string, now = Date.now()): MetaClick | undefined {
  try {
    const id = new URL(url).searchParams.get("fbclid");
    return id && /^[A-Za-z0-9_-]{1,500}$/.test(id) ? { id, arrivedAt: now } : undefined;
  } catch { return undefined; }
}

export function metaClickCookie(click: MetaClick): string {
  return `fb.1.${click.arrivedAt}.${click.id}`;
}
