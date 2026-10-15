import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectOne } from "../db/query";
import { TIKTOK_PIXEL_ID } from "./pixel";

export interface TikTokSettings { pixelId: string; pixelEnabled: boolean; serverEnabled: boolean; accessTokenEncrypted: string; testEventCode: string }
export const defaultTikTokSettings: TikTokSettings = { pixelId: TIKTOK_PIXEL_ID, pixelEnabled: true, serverEnabled: true, accessTokenEncrypted: "", testEventCode: "" };
export async function getTikTokSettings(connection?: PoolConnection): Promise<TikTokSettings & { revision: string }> {
  const row = await selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = 'tiktok.configuration'", [], connection);
  const raw = typeof row?.value_json === "string" ? JSON.parse(row.value_json) : row?.value_json;
  const value: TikTokSettings = { ...defaultTikTokSettings, ...(raw && typeof raw === "object" ? raw : {}) };
  return { ...value, revision: createHash("sha256").update(JSON.stringify(value)).digest("hex") };
}
export const tiktokPixelReady = (s: TikTokSettings) => s.pixelEnabled && /^[A-Z0-9]{20}$/.test(s.pixelId);
export const tiktokServerReady = (s: TikTokSettings) => s.serverEnabled && /^[A-Z0-9]{20}$/.test(s.pixelId) && Boolean(s.accessTokenEncrypted);
