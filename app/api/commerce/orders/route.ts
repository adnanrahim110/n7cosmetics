import { NextResponse } from "next/server";
import { after } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { getRequestMetadata } from "@/lib/auth/request";
import { CommerceError } from "@/lib/commerce/quote";
import { createOrder } from "@/lib/commerce/orders";
import { checkoutInputSchema } from "@/lib/commerce/validation";
import { executeMutation, selectOne } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { sendProjectEmail } from "@/lib/email/service";

interface AttemptCount extends RowDataPacket { attempt_count: number }
export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Commerce database is not configured." }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 65536) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  const metadata = await getRequestMetadata();
  const attempts = await selectOne<AttemptCount>("SELECT COUNT(*) AS attempt_count FROM checkout_attempts WHERE ip_address = ? AND attempted_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 15 MINUTE)", [metadata.ipAddress]);
  if (Number(attempts?.attempt_count ?? 0) >= 10) return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) { await executeMutation("INSERT INTO checkout_attempts (ip_address, succeeded) VALUES (?, 0)", [metadata.ipAddress]); return NextResponse.json({ error: "Check the checkout details." }, { status: 400 }); }
  try { const order = await createOrder(parsed.data); await executeMutation("INSERT INTO checkout_attempts (ip_address, succeeded) VALUES (?, 1)", [metadata.ipAddress]); const total = new Intl.NumberFormat("en-GB", { style: "currency", currency: order.currency }).format(order.total_pence / 100); const safeOrderNumber = order.order_number.replaceAll("<", "&lt;").replaceAll(">", "&gt;"); after(async () => { await sendProjectEmail({ to: parsed.data.customer.email, subject: `Order ${order.order_number} received`, text: `Thank you for your N7 Cosmetics order.\n\nOrder: ${order.order_number}\nTotal: ${total}\n\nWe will email you when its status changes.`, html: `<h1>Thank you for your order</h1><p>We have received order <strong>${safeOrderNumber}</strong>.</p><p>Total: <strong>${total}</strong></p><p>We will email you when its status changes.</p>`, templateKey: "order-confirmation" }); }); return NextResponse.json({ orderNumber: order.order_number, totalPence: order.total_pence, currency: order.currency }, { status: 201 }); } catch (error: unknown) { await executeMutation("INSERT INTO checkout_attempts (ip_address, succeeded) VALUES (?, 0)", [metadata.ipAddress]); if (error instanceof CommerceError) return NextResponse.json({ error: error.message, code: error.code }, { status: 422 }); console.error("Checkout failed", error); return NextResponse.json({ error: "Unable to place the order." }, { status: 500 }); }
}
