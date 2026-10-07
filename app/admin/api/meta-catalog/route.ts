import { requireAdministrator } from "@/lib/auth/session";
import { getMetaCatalogSummary } from "@/lib/meta/catalog-status";
import { refreshMetaCatalogObservations } from "@/lib/meta/catalog-observation-sync";
import { after } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  await requireAdministrator(["OWNER", "MANAGER"]);
  after(() => refreshMetaCatalogObservations().catch(() => console.error("Meta product status check deferred to the worker.")));
  try { return Response.json(await getMetaCatalogSummary(), { headers: { "Cache-Control": "no-store, private" } }); }
  catch { return Response.json({ error: "Catalogue status is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
