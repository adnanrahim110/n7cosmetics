import { NextResponse } from "next/server";
import { z } from "zod";
import { cartLineSchema } from "@/lib/commerce/validation";
import { MAX_CART_LINES } from "@/lib/commerce/cart-limits";
import { getStorefrontStock } from "@/lib/commerce/stock-data";
import { hasDatabaseConfig } from "@/lib/env";

const headers = { "Cache-Control": "private, no-store" };
const schema = z.object({ items: z.array(cartLineSchema).max(MAX_CART_LINES).refine((items) => new Set(items.map((item) => item.slug)).size === items.length), reservationKey: z.uuid().optional() });

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Stock information is temporarily unavailable." }, { status: 503, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 32768) return NextResponse.json({ error: "Request too large." }, { status: 413, headers });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart details." }, { status: 400, headers });
  try { return NextResponse.json(await getStorefrontStock(parsed.data.items, parsed.data.reservationKey), { headers }); }
  catch { return NextResponse.json({ error: "Unable to check stock. Please try again." }, { status: 503, headers }); }
}
