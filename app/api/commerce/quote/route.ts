import { NextResponse } from "next/server";
import { calculateQuote, CommerceError } from "@/lib/commerce/quote";
import { quoteInputSchema } from "@/lib/commerce/validation";
import { hasDatabaseConfig } from "@/lib/env";

export async function POST(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ error: "Commerce database is not configured." }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 65536) return NextResponse.json({ error: "Request too large." }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const parsed = quoteInputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart or delivery details." }, { status: 400 });
  try { return NextResponse.json(await calculateQuote(parsed.data)); } catch (error: unknown) { if (error instanceof CommerceError) return NextResponse.json({ error: error.message, code: error.code }, { status: 422 }); console.error("Quote failed", error); return NextResponse.json({ error: "Unable to calculate checkout." }, { status: 500 }); }
}
