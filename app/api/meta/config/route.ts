import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "@/lib/db/query";
import { consentId } from "@/lib/meta/consent";
import { readCookie } from "@/lib/meta/identity";
import { capiReady, getMetaSettings, pixelReady } from "@/lib/meta/settings";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store, private" };
  try {
    const s = await getMetaSettings();
    const row = await selectOne<RowDataPacket>("SELECT granted FROM meta_consents WHERE id = ? AND expires_at > CURRENT_TIMESTAMP(3)", [consentId(request)]);
    const consent = readCookie(request, "n7_marketing_optout") === "1" ? "denied" : row ? Number(row.granted) === 1 ? "granted" : "denied" : "unknown";
    return NextResponse.json({ enabled: pixelReady(s) || capiReady(s), pixelId: pixelReady(s) ? s.pixelId : "", consent }, { headers });
  } catch { return NextResponse.json({ enabled: false, pixelId: "", consent: "unknown" }, { status: 503, headers }); }
}
