import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getRequestMetadata } from "@/lib/auth/request";
import { CommerceError } from "@/lib/commerce/quote";
import { createOrder } from "@/lib/commerce/orders";
import { checkoutInputSchema } from "@/lib/commerce/validation";
import { executeMutation, selectOne } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { kickEmailQueue } from "@/lib/email/kick";
import { getStripeSettings, stripeKeysReady, PaymentUnavailableError } from "@/lib/payments/settings";
import { applyPaymentIntent, ensurePaymentIntent } from "@/lib/payments/stripe";
import { isPaymentRequestOrigin } from "@/lib/payments/request";

interface AttemptCount extends RowDataPacket { attempt_count: number }
export async function POST(request: Request) {
  if (!isPaymentRequestOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Commerce database is not configured." }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 65536) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  const metadata = await getRequestMetadata();
  const attempts = await selectOne<AttemptCount>("SELECT COUNT(*) AS attempt_count FROM checkout_attempts WHERE ip_address = ? AND attempted_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 15 MINUTE)", [metadata.ipAddress]);
  if (Number(attempts?.attempt_count ?? 0) >= 10) return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) { await executeMutation("INSERT INTO checkout_attempts (ip_address, succeeded) VALUES (?, 0)", [metadata.ipAddress]); return NextResponse.json({ error: "Check the checkout details." }, { status: 400 }); }
  try {
    const settings = await getStripeSettings();
    if (!settings.enabled || !stripeKeysReady(settings)) throw new PaymentUnavailableError();
    const order = await createOrder(parsed.data, settings.mode, settings.revision);
    if (order.inventory_state === "COMMITTED") return NextResponse.json({ orderNumber: order.order_number, totalPence: order.total_pence, currency: order.currency, paid: true }, { headers: { "Cache-Control": "no-store" } });
    const intent = await ensurePaymentIntent(order.id, settings);
    if (intent.status === "canceled") throw new CommerceError("CHECKOUT_EXPIRED", "This payment session expired. Please try again.");
    if (intent.status === "succeeded") await applyPaymentIntent(intent);
    await executeMutation("INSERT INTO checkout_attempts (ip_address, succeeded) VALUES (?, 1)", [metadata.ipAddress]);
    kickEmailQueue();
    return NextResponse.json({ orderNumber: order.order_number, totalPence: order.total_pence, currency: order.currency, clientSecret: intent.client_secret, paid: intent.status === "succeeded" }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    await executeMutation("INSERT INTO checkout_attempts (ip_address, succeeded) VALUES (?, 0)", [metadata.ipAddress]);
    if (error instanceof CommerceError) return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    if (error instanceof PaymentUnavailableError) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("Stripe checkout could not be created; safe to retry with the same checkout key.");
    return NextResponse.json({ error: "Unable to place the order." }, { status: 500 });
  }
}
