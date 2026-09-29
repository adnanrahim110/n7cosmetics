import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectOne } from "../db/query";
import { decryptSecret } from "../security/encryption";

export interface MetaSettings {
  pixelId: string; pixelEnabled: boolean; capiEnabled: boolean; adAccountId: string; reportingEnabled: boolean;
  testEventCode: string; capiTokenEncrypted: string; reportingTokenEncrypted: string;
}
export const defaultMetaSettings: MetaSettings = { pixelId: "", pixelEnabled: true, capiEnabled: true, adAccountId: "", reportingEnabled: true, testEventCode: "", capiTokenEncrypted: "", reportingTokenEncrypted: "" };
export async function getMetaSettings(connection?: PoolConnection): Promise<MetaSettings & { revision: string }> {
  const row = await selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = 'meta.configuration'", [], connection);
  const raw = typeof row?.value_json === "string" ? JSON.parse(row.value_json) : row?.value_json;
  const value: MetaSettings = { ...defaultMetaSettings, ...(raw && typeof raw === "object" ? raw : {}) };
  return { ...value, revision: createHash("sha256").update(JSON.stringify(value)).digest("hex") };
}
export function pixelReady(s: MetaSettings): boolean { return s.pixelEnabled && /^\d{5,30}$/.test(s.pixelId); }
export function capiReady(s: MetaSettings): boolean { return s.capiEnabled && /^\d{5,30}$/.test(s.pixelId) && Boolean(s.capiTokenEncrypted); }
export function reportingReady(s: MetaSettings): boolean { return s.reportingEnabled && Boolean(s.adAccountId && s.reportingTokenEncrypted); }
export function metaToken(s: MetaSettings, kind: "capi" | "reporting"): string { return decryptSecret(kind === "capi" ? s.capiTokenEncrypted : s.reportingTokenEncrypted); }
