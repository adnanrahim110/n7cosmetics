import { NextResponse } from "next/server";
import { getPublicStripeConfiguration } from "@/lib/payments/settings";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await getPublicStripeConfiguration(), { headers: { "Cache-Control": "no-store" } });
}
