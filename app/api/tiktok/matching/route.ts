import { NextResponse } from "next/server";
import { isPaymentRequestOrigin } from "@/lib/payments/request";
import { allowMetaRequest, consentGranted, consentId } from "@/lib/meta/consent";
import { readCookie } from "@/lib/meta/identity";
import { readMetaJson } from "@/lib/meta/http";
import { metaMatchingInputSchema } from "@/lib/meta/matching-input";
import { saveTikTokMatching } from "@/lib/tiktok/identity";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isPaymentRequestOrigin(request)) return new NextResponse(null, { status: 403, headers });
  try {
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(consentId(request))) return new NextResponse(null, { status: 204, headers });
    if (!await allowMetaRequest(request, 120, "tiktok")) return new NextResponse(null, { status: 429, headers });
    const parsed = metaMatchingInputSchema.safeParse(await readMetaJson(request, 4096));
    if (!parsed.success) return new NextResponse(null, { status: 400, headers });
    const value = await saveTikTokMatching(request, parsed.data);
    return value ? NextResponse.json(value, { headers }) : new NextResponse(null, { status: 204, headers });
  } catch { return new NextResponse(null, { status: 503, headers }); }
}
