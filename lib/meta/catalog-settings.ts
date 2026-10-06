import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { selectOne } from "../db/query";
import { decryptSecret } from "../security/encryption";

export const metaCatalogSettingsSchema = z.object({
  catalogId: z.string().trim().regex(/^\d{5,30}$|^$/, "Enter the numeric catalogue ID from Commerce Manager."),
  enabled: z.boolean(),
  accessToken: z.string().trim().max(4096).regex(/^[A-Za-z0-9_.|-]*$/, "Enter a valid catalogue access token."),
  clearToken: z.boolean(),
  revision: z.string().length(64),
});
export interface MetaCatalogSettings { catalogId: string; enabled: boolean; tokenEncrypted: string; revision: string }
export async function getMetaCatalogSettings(connection?: PoolConnection): Promise<MetaCatalogSettings> {
  const row = await selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = 'meta.catalog.configuration'", [], connection);
  const parsed = z.object({ catalogId: z.string().default(""), enabled: z.boolean().default(true), tokenEncrypted: z.string().default("") }).parse(row ? typeof row.value_json === "string" ? JSON.parse(row.value_json) : row.value_json : {});
  return { ...parsed, revision: createHash("sha256").update(JSON.stringify(parsed)).digest("hex") };
}
export function catalogReady(settings: MetaCatalogSettings): boolean {
  return settings.enabled && /^\d{5,30}$/.test(settings.catalogId) && Boolean(settings.tokenEncrypted);
}
export function catalogToken(settings: MetaCatalogSettings): string { return decryptSecret(settings.tokenEncrypted); }
