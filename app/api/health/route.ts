import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { getPool } from "@/lib/db/pool";
import { getMediaStorageRoot } from "@/lib/media/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    // Check the restored schema as well as database connectivity.
    await getPool().query({ sql: "SELECT id FROM products LIMIT 1", timeout: 3000 });
    await access(getMediaStorageRoot(), constants.R_OK | constants.W_OK);
    return Response.json(
      { status: "ok", release: process.env.APP_BUILD_SHA || "local" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
