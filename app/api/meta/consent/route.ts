import { NextResponse } from "next/server";
import { isPaymentRequestOrigin } from "@/lib/payments/request";
import { allowMetaRequest, saveConsent } from "@/lib/meta/consent";
import { META_CONSENT_COOKIE } from "@/lib/meta/shared";
import { readMetaJson } from "@/lib/meta/http";
export async function POST(request: Request) {
  if (!isPaymentRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const body = await readMetaJson(request, 200) as { granted?: unknown } | null;
    if (typeof body?.granted !== "boolean") return NextResponse.json({ error: "Choose your cookie preference." }, { status: 400 });
    if (!await allowMetaRequest(request)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });
    const id = await saveConsent(request, body.granted);
    const response = NextResponse.json({ consent: body.granted ? "granted" : "denied" }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(META_CONSENT_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 180 * 86400 });
    response.cookies.set("n7_marketing_optout", body.granted ? "" : "1", { secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: body.granted ? 0 : 180 * 86400 });
    return response;
  } catch { return NextResponse.json({ error: "Unable to save cookie preferences. Tracking remains off." }, { status: 503 }); }
}
