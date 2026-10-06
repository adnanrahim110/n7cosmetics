import { requireAdministrator } from "@/lib/auth/session";
import { getMetaDeliveryHealth } from "@/lib/meta/delivery-health";
import { after } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  await requireAdministrator(["OWNER", "MANAGER"]);
  // Also cover development servers started before instrumentation was added.
  if (process.env.NODE_ENV === "development") after(async () => {
    const { startMetaDevelopmentWorker } = await import("@/lib/meta/development-worker");
    startMetaDevelopmentWorker();
  });
  try { return Response.json(await getMetaDeliveryHealth(), { headers: { "Cache-Control": "no-store, private" } }); }
  catch { return Response.json({ error: "Delivery health is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store, private" } }); }
}
