import { NextResponse } from "next/server";
import { isPaymentRequestOrigin } from "@/lib/payments/request";
import { allowMetaRequest, consentGranted, consentId } from "@/lib/meta/consent";
import { readCookie } from "@/lib/meta/identity";
import { readMetaJson } from "@/lib/meta/http";
import { resolveEventData } from "@/lib/meta/events";
import { safeEventPath } from "@/lib/meta/shared";
import { tiktokEventSchema, tiktokMatching, tiktokProperties } from "@/lib/tiktok/shared";
import { getTikTokSettings, tiktokPixelReady, tiktokServerReady } from "@/lib/tiktok/settings";
import { tiktokVisitor, tiktokExternalId } from "@/lib/tiktok/identity";
import { makeTikTokEvent, queueTikTokEvent } from "@/lib/tiktok/events";
import { kickTikTokQueue } from "@/lib/tiktok/kick";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isPaymentRequestOrigin(request)) return new NextResponse(null, { status: 403, headers });
  try {
    const id = consentId(request);
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(id)) return new NextResponse(null, { status: 204, headers });
    if (!await allowMetaRequest(request, 120, "tiktok")) return new NextResponse(null, { status: 429, headers });
    const parsed = tiktokEventSchema.safeParse(await readMetaJson(request, 16384));
    if (!parsed.success || !safeEventPath(parsed.data.path)) return new NextResponse(null, { status: 400, headers });
    const settings = await getTikTokSettings();
    if (!tiktokPixelReady(settings) && !tiktokServerReady(settings)) return new NextResponse(null, { status: 204, headers });
    const input = parsed.data;
    const data = tiktokProperties(await resolveEventData({ ...input, name: input.name === "Pageview" ? "PageView" : input.name }));
    const user = await tiktokVisitor(request, id);
    if (!user) return new NextResponse(null, { status: 204, headers });
    if (tiktokServerReady(settings)) {
      try { await queueTikTokEvent(makeTikTokEvent(input.name, input.eventId, input.path, user, data), settings, id); kickTikTokQueue(); }
      catch { return new NextResponse(null, { status: 503, headers }); }
    }
    return NextResponse.json({ pixelId: tiktokPixelReady(settings) && !settings.testEventCode ? settings.pixelId : "", externalId: tiktokExternalId(id), name: input.name, eventId: input.eventId, data, matching: tiktokMatching(user) }, { headers });
  } catch { return new NextResponse(null, { status: 400, headers }); }
}
