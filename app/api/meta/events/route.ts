import { NextResponse } from "next/server";
import { isPaymentRequestOrigin } from "@/lib/payments/request";
import { allowMetaRequest, consentGranted, consentId } from "@/lib/meta/consent";
import { capiReady, getMetaSettings, pixelReady } from "@/lib/meta/settings";
import { metaEventSchema, safeEventPath } from "@/lib/meta/shared";
import { makeMetaEvent, queueMetaEvent, resolveEventData } from "@/lib/meta/events";
import { requestUserData, readCookie } from "@/lib/meta/identity";
import { kickMetaQueue } from "@/lib/meta/kick";
import { readMetaJson } from "@/lib/meta/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!isPaymentRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const headers = { "Cache-Control": "no-store" };
  try {
    const id = consentId(request);
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(id)) return new NextResponse(null, { status: 204, headers });
    if (!await allowMetaRequest(request)) return new NextResponse(null, { status: 429, headers });
    const parsed = metaEventSchema.safeParse(await readMetaJson(request, 16384));
    if (!parsed.success || !safeEventPath(parsed.data.path)) return new NextResponse(null, { status: 400, headers });
    const s = await getMetaSettings();
    if (!pixelReady(s) && !capiReady(s)) return new NextResponse(null, { status: 204, headers });
    const input = parsed.data;
    const data = await resolveEventData(input);
    if (capiReady(s)) {
      try {
        await queueMetaEvent(makeMetaEvent(input.name, input.eventId, input.path, requestUserData(request), data), s, id);
        kickMetaQueue();
      } catch { console.error("Meta browser event could not be queued; browser tracking remains available."); }
    }
    return NextResponse.json({ pixelId: pixelReady(s) ? s.pixelId : "", eventId: input.eventId, name: input.name, data }, { headers });
  } catch { return new NextResponse(null, { status: 400, headers }); }
}
