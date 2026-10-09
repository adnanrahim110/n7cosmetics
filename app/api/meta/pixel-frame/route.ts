import { consentGranted, consentId } from "@/lib/meta/consent";
import { metaExternalId, readCookie } from "@/lib/meta/identity";
import { getMetaSettings, pixelReady } from "@/lib/meta/settings";
import { metaMatchingKeys } from "@/lib/meta/matching";
import { metaCampaignParameters } from "@/lib/meta/browser-policy";
import { metaEventNames } from "@/lib/meta/shared";
import { metaPixelFrameDocument } from "@/lib/meta/pixel-frame-runtime";

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
  const channel = new URL(request.url).searchParams.get("channel") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(channel)) return new Response(null, { status: 400, headers });
  try {
    const id = consentId(request);
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(id)) return new Response(null, { status: 204, headers });
    const settings = await getMetaSettings();
    if (!pixelReady(settings)) return new Response(null, { status: 204, headers });
    return new Response(metaPixelFrameDocument({ channel, pixelId: settings.pixelId, externalId: metaExternalId(id), matchingKeys: metaMatchingKeys, campaignKeys: metaCampaignParameters, eventNames: [...metaEventNames, "Purchase"] }), { headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
