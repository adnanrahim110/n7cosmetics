import { consentGranted, consentId } from "@/lib/meta/consent";
import { readCookie } from "@/lib/meta/identity";
import { tiktokPageUrl, tiktokPixelDocument } from "@/lib/tiktok/pixel";

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
  const page = tiktokPageUrl(url.searchParams.get("page") ?? "", url.origin);
  if (!page) return new Response(null, { status: 400, headers });
  try {
    if (readCookie(request, "n7_marketing_optout") === "1" || !await consentGranted(consentId(request)))
      return new Response(null, { status: 204, headers });
    return new Response(tiktokPixelDocument(page), { headers });
  } catch { return new Response(null, { status: 503, headers }); }
}
