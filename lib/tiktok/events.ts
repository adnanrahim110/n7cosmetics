import type { PoolConnection } from "mysql2/promise";
import { executeMutation } from "../db/query";
import { encryptSecret } from "../security/encryption";
import { getApplicationConfig } from "../env";
import { tiktokPageUrl } from "./pixel";
import { tiktokServerReady, type TikTokSettings } from "./settings";
import type { TikTokBrowserEvent, TikTokProperties } from "./shared";

export interface TikTokServerEvent {
  event: TikTokBrowserEvent["name"]; event_id: string; event_time: number;
  user: Record<string, string>; page: { url: string }; properties: TikTokProperties;
}
export function makeTikTokEvent(name: TikTokServerEvent["event"], id: string, path: string, user: Record<string, string>, properties: TikTokProperties): TikTokServerEvent {
  const origin = new URL(getApplicationConfig().appUrl).origin;
  return { event: name, event_id: id, event_time: Math.floor(Date.now() / 1000), user, page: { url: origin + (tiktokPageUrl(path, origin) ?? "/") }, properties };
}
export async function queueTikTokEvent(event: TikTokServerEvent, settings: TikTokSettings, consent: string, connection?: PoolConnection) {
  if (!tiktokServerReady(settings) || Date.now() - event.event_time * 1000 >= 47 * 60 * 60 * 1000) return;
  await executeMutation("INSERT IGNORE INTO tiktok_event_jobs (pixel_id, event_id, event_name, consent_id, test_event_code, payload_encrypted, event_time) VALUES (?, ?, ?, ?, ?, ?, ?)", [settings.pixelId, event.event_id, event.event, consent, settings.testEventCode, encryptSecret(JSON.stringify(event)), new Date(event.event_time * 1000)], connection);
}
