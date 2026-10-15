import { NextResponse } from "next/server";
import { consentId } from "@/lib/meta/consent";
import { readCookie } from "@/lib/meta/identity";
import { selectOne } from "@/lib/db/query";
import { getTikTokSettings, tiktokPixelReady, tiktokServerReady } from "@/lib/tiktok/settings";
import { tiktokExternalId } from "@/lib/tiktok/identity";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const s = await getTikTokSettings();
    const row = await selectOne("SELECT granted FROM meta_consents WHERE id = ? AND expires_at > CURRENT_TIMESTAMP(3)", [consentId(request)]);
    const consent = readCookie(request, "n7_marketing_optout") === "1" ? "denied" : row ? Number(row.granted) === 1 ? "granted" : "denied" : "unknown";
    return NextResponse.json({ enabled: tiktokPixelReady(s) || tiktokServerReady(s), pixelId: tiktokPixelReady(s) && !s.testEventCode ? s.pixelId : "", consent, ...(consent === "granted" ? { externalId: tiktokExternalId(consentId(request)) } : {}) }, { headers });
  } catch { return NextResponse.json({ enabled: false, pixelId: "", consent: "unknown" }, { status: 503, headers }); }
}
