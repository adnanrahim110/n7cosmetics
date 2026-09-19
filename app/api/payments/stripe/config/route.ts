import { NextResponse } from "next/server";
import { getStripeSettings, stripeKeysReady } from "@/lib/payments/settings";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const settings = await getStripeSettings();
    const enabled = settings.enabled && stripeKeysReady(settings);
    return NextResponse.json({ enabled, publishableKey: enabled ? settings.publishableKey : null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ enabled: false, publishableKey: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
