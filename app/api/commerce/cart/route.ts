import { NextResponse } from "next/server";
import { calculateCartPricing, CommerceError } from "@/lib/commerce/quote";
import { cartDeliveryInputSchema } from "@/lib/commerce/validation";
import { getShippingConfiguration } from "@/lib/commerce/shipping-data";
import { freeDeliveryProgress } from "@/lib/commerce/free-delivery";
import { hasDatabaseConfig } from "@/lib/env";

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Cart pricing is temporarily unavailable." }, { status: 503, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 65536) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400, headers }); }
  const parsed = cartDeliveryInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart or coupon details." }, { status: 400, headers });
  try {
    const [pricing, config] = await Promise.all([calculateCartPricing(parsed.data), getShippingConfiguration()]);
    const coupon = pricing.discount?.freeShipping ? { id: pricing.discount.id, name: pricing.discount.name } : null;
    return NextResponse.json({ ...pricing, deliveryProgress: freeDeliveryProgress(config, "GB", parsed.data.postalCode ?? "", pricing.subtotalPence, pricing.totalPence, coupon) }, { headers });
  } catch (error) {
    if (error instanceof CommerceError) return NextResponse.json({ error: error.message, code: error.code }, { status: 422, headers });
    console.error("Cart pricing failed", error);
    return NextResponse.json({ error: "Unable to calculate cart prices." }, { status: 500, headers });
  }
}
