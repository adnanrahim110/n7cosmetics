import { NextResponse } from "next/server";
import { getStripeSettings, stripeClient } from "@/lib/payments/settings";
import { applyPaymentIntent } from "@/lib/payments/stripe";
import { kickEmailQueue } from "@/lib/email/kick";
import type Stripe from "stripe";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    const settings = await getStripeSettings();
    const stripe = stripeClient(settings);
    // Signature verification requires the original, unparsed body.
    event = stripe.webhooks.constructEvent(await request.text(), signature, settings.webhookSecret);
    if (event.livemode !== (settings.mode === "live")) return NextResponse.json({ error: "Wrong payment mode." }, { status: 400 });
  } catch { return NextResponse.json({ error: "Webhook could not be verified." }, { status: 400 }); }
  if (["payment_intent.succeeded", "payment_intent.payment_failed", "payment_intent.canceled"].includes(event.type)) {
    try {
      await applyPaymentIntent(event.data.object as Stripe.PaymentIntent, event);
      kickEmailQueue();
    } catch {
      console.error(`Stripe webhook ${event.id} could not be applied; awaiting retry.`);
      return NextResponse.json({ error: "Unable to process payment event." }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
