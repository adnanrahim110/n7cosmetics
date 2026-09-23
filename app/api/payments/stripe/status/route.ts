import { NextResponse } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "@/lib/db/query";
import { getStripeSettings } from "@/lib/payments/settings";
import { reconcileStripeCheckout } from "@/lib/payments/stripe";
import { isPaymentRequestOrigin } from "@/lib/payments/request";
import { kickEmailQueue } from "@/lib/email/kick";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
interface ReceiptRow extends RowDataPacket { id: string; order_number: string; total_pence: number; currency: string; payment_status: string; inventory_state: string }

function findOrder(key: string) {
  return selectOne<ReceiptRow>("SELECT CAST(o.id AS CHAR) AS id, o.order_number, o.total_pence, o.currency, o.payment_status, c.inventory_state FROM orders o JOIN payments p ON p.order_id = o.id JOIN stripe_checkouts c ON c.order_id = o.id WHERE p.idempotency_key = ? AND p.provider = 'STRIPE'", [key]);
}

async function receiptResponse(key: unknown, verify: boolean) {
  const parsed = z.uuid().safeParse(key);
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout." }, { status: 400, headers });
  try {
    // The guest token selects the stored order. Never accept a payment status,
    // amount or Stripe intent ID supplied by the browser as proof of payment.
    let row = await findOrder(parsed.data);
    if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404, headers });
    let reconciled = false;
    if (verify && row.inventory_state === "RESERVED") {
      let verificationFailed = false;
      try { reconciled = await reconcileStripeCheckout(row.id, await getStripeSettings()); }
      catch {
        verificationFailed = true;
        console.error(`Stripe checkout ${row.id} could not be verified; safe to retry.`);
      }
      row = await findOrder(parsed.data);
      if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404, headers });
      if (verificationFailed && row.inventory_state === "RESERVED") {
        return NextResponse.json({ error: "We couldn’t confirm your payment yet. We’ll keep checking; please don’t pay again." }, { status: 503, headers });
      }
      if (row.payment_status === "PAID") kickEmailQueue();
    }
    // Another verifier may be updating an earlier failed attempt after a retry.
    // Keep polling until its current Stripe status has been checked.
    const status = row.inventory_state === "RELEASED" ? "expired" : row.inventory_state === "COMMITTED" ? "paid" : row.payment_status === "FAILED" && (!verify || reconciled) ? "failed" : "pending";
    // Return receipt details only; no customer data or Stripe credentials.
    return NextResponse.json({ orderNumber: row.order_number, totalPence: row.total_pence, currency: row.currency, status }, { headers });
  } catch {
    return NextResponse.json({ error: "Payment confirmation is temporarily unavailable. We’ll keep checking; please don’t pay again." }, { status: 503, headers });
  }
}

export async function GET(request: Request) {
  return receiptResponse(new URL(request.url).searchParams.get("key"), false);
}

export async function POST(request: Request) {
  if (!isPaymentRequestOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 4096) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
  const body = await request.json().catch(() => null);
  return receiptResponse(body?.key, true);
}
