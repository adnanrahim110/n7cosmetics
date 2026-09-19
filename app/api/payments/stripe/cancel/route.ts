import { NextResponse } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "@/lib/db/query";
import { getStripeSettings, stripeClient } from "@/lib/payments/settings";
import { applyPaymentIntent, ensurePaymentIntent } from "@/lib/payments/stripe";
import { isPaymentRequestOrigin } from "@/lib/payments/request";

export async function POST(request: Request) {
  if (!isPaymentRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const parsed = z.object({ key: z.uuid() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout." }, { status: 400 });
  const row = await selectOne<RowDataPacket & { order_id: string; inventory_state: string }>("SELECT CAST(c.order_id AS CHAR) AS order_id, c.inventory_state FROM stripe_checkouts c JOIN payments p ON p.order_id = c.order_id WHERE p.idempotency_key = ? AND p.provider = 'STRIPE'", [parsed.data.key]);
  if (!row || row.inventory_state === "RELEASED") return NextResponse.json({ cancelled: true });
  if (row.inventory_state === "COMMITTED") return NextResponse.json({ paid: true });
  try {
    const settings = await getStripeSettings();
    const stripe = stripeClient(settings);
    let intent = await ensurePaymentIntent(row.order_id, settings);
    if (["requires_payment_method", "requires_confirmation", "requires_action", "requires_capture"].includes(intent.status)) {
      try { intent = await stripe.paymentIntents.cancel(intent.id); }
      catch { intent = await stripe.paymentIntents.retrieve(intent.id); }
    }
    await applyPaymentIntent(intent);
    if (intent.status === "succeeded") return NextResponse.json({ paid: true });
    if (intent.status === "canceled") return NextResponse.json({ cancelled: true });
    return NextResponse.json({ error: "Your payment is still processing. Please wait before retrying." }, { status: 409 });
  } catch { return NextResponse.json({ error: "Unable to check the previous payment. Please try again shortly." }, { status: 503 }); }
}
