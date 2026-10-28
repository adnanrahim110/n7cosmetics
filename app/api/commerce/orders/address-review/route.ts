import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestMetadata } from "@/lib/auth/request";
import { deliveryReviewInputSchema, DeliveryReviewError } from "@/lib/commerce/delivery-review";
import { readDeliveryReview, confirmDeliveryReview } from "@/lib/commerce/delivery-review-store";
import { kickEmailQueue } from "@/lib/email/kick";
import { isPaymentRequestOrigin } from "@/lib/payments/request";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

export async function POST(request: Request) {
  if (!isPaymentRequestOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 16384) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
  const body: unknown = await request.json().catch(() => null);
  const key = z.object({ key: z.uuid() }).safeParse(body);
  if (!key.success) return NextResponse.json({ error: "Invalid checkout." }, { status: 400, headers });
  try {
    if (!body || typeof body !== "object" || !("address" in body)) return NextResponse.json(await readDeliveryReview(key.data.key), { headers });
    const parsed = deliveryReviewInputSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) (fieldErrors[issue.path.map(String).join(".")] ??= []).push(issue.message);
      return NextResponse.json({ error: "Check your delivery address.", fieldErrors }, { status: 400, headers });
    }
    const metadata = await getRequestMetadata();
    const result = await confirmDeliveryReview(parsed.data, metadata.ipAddress);
    if (!result.success) return NextResponse.json({ error: result.message, fieldErrors: result.fieldErrors }, { status: 422, headers });
    if (result.changed) kickEmailQueue();
    return NextResponse.json({ success: true }, { headers });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof DeliveryReviewError ? reason.message : "Unable to confirm the address. Please try again." }, { status: reason instanceof DeliveryReviewError ? reason.status : 503, headers });
  }
}
