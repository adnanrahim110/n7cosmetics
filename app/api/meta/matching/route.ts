import { NextResponse } from "next/server";
import { isPaymentRequestOrigin } from "@/lib/payments/request";
import { allowMetaRequest, consentGranted, consentId } from "@/lib/meta/consent";
import { readMetaJson } from "@/lib/meta/http";
import { readCookie } from "@/lib/meta/identity";
import { metaMatchingInputSchema } from "@/lib/meta/matching-input";
import { saveMetaMatchingProfile } from "@/lib/meta/matching-profile";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (!isPaymentRequestOrigin(request)) return new NextResponse(null, { status: 403, headers });
  try {
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(consentId(request))) return new NextResponse(null, { status: 204, headers });
    if (!await allowMetaRequest(request)) return new NextResponse(null, { status: 429, headers });
    let body: unknown;
    try { body = await readMetaJson(request, 4096); }
    catch { return new NextResponse(null, { status: 400, headers }); }
    const parsed = metaMatchingInputSchema.safeParse(body);
    if (!parsed.success) return new NextResponse(null, { status: 400, headers });
    const profile = await saveMetaMatchingProfile(request, parsed.data);
    return profile ? NextResponse.json(profile, { headers }) : new NextResponse(null, { status: 204, headers });
  } catch {
    // Optional matching never exposes contact data or prevents checkout.
    return new NextResponse(null, { status: 503, headers });
  }
}
