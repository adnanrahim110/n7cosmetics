import { consentGranted, consentId } from "@/lib/meta/consent";
import { readCookie } from "@/lib/meta/identity";
import { tiktokCampaignKeys } from "@/lib/tiktok/pixel";
import { tiktokPixelFrameDocument } from "@/lib/tiktok/pixel-frame-runtime";
import { getTikTokSettings, tiktokPixelReady } from "@/lib/tiktok/settings";
import { tiktokExternalId } from "@/lib/tiktok/identity";
import { tiktokEventNames } from "@/lib/tiktok/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Content-Type": "text/html; charset=utf-8",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Security-Policy": "frame-ancestors 'self'; base-uri 'none'; object-src 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
  const url = new URL(request.url);
  const channel = url.searchParams.get("channel") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(channel)) return new Response(null, { status: 400, headers });
  try {
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(consentId(request)))
      return new Response(null, { status: 204, headers });
    const settings = await getTikTokSettings();
    if (!tiktokPixelReady(settings) || settings.testEventCode) return new Response(null, { status: 204, headers });
    return new Response(tiktokPixelFrameDocument({ channel, pixelId: settings.pixelId, externalId: tiktokExternalId(consentId(request)), campaignKeys: tiktokCampaignKeys, eventNames: [...tiktokEventNames, "Purchase"] }), { headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
