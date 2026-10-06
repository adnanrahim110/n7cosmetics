import { requireAdministrator } from "@/lib/auth/session";
import { getMetaCatalogSummary } from "@/lib/meta/catalog-status";
export const dynamic = "force-dynamic";
export async function GET() {
  await requireAdministrator(["OWNER", "MANAGER"]);
  try { return Response.json(await getMetaCatalogSummary(), { headers: { "Cache-Control": "no-store, private" } }); }
  catch { return Response.json({ error: "Catalogue status is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
