import { NextResponse } from "next/server";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "@/lib/db/query";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!z.uuid().safeParse(key).success) return NextResponse.json({ error: "Invalid checkout." }, { status: 400 });
  // The unguessable checkout key is the guest's receipt token. Return no PII.
  const row = await selectOne<RowDataPacket & { order_number: string; total_pence: number; currency: string; payment_status: string; inventory_state: string }>("SELECT o.order_number, o.total_pence, o.currency, o.payment_status, c.inventory_state FROM orders o JOIN payments p ON p.order_id = o.id JOIN stripe_checkouts c ON c.order_id = o.id WHERE p.idempotency_key = ? AND p.provider = 'STRIPE'", [key]);
  if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const status = row.inventory_state === "RELEASED" ? "expired" : row.payment_status === "PAID" ? "paid" : row.payment_status === "FAILED" ? "failed" : "pending";
  return NextResponse.json({ orderNumber: row.order_number, totalPence: row.total_pence, currency: row.currency, status }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
