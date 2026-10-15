import { requireAdministrator } from "@/lib/auth/session";
import { getTikTokDeliveryStatus } from "@/lib/tiktok/diagnostics";
export const dynamic = "force-dynamic";
export async function GET() {
  await requireAdministrator(["OWNER", "MANAGER"]);
  try { return Response.json(await getTikTokDeliveryStatus(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return Response.json({ error: "TikTok delivery status is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "private, no-store" } }); }
}
