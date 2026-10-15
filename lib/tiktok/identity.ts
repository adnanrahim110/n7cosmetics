import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { hashMetaValue, normalizeMetaPhone, readCookie } from "../meta/identity";
import { clientIpAddress } from "../http/client-ip";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { decryptSecret, encryptSecret } from "../security/encryption";
import { consentId } from "../meta/consent";
import { tiktokMatching, type TikTokMatching } from "./shared";
import { getTikTokSettings, tiktokPixelReady, tiktokServerReady } from "./settings";
import type { MetaMatchingInput } from "../meta/matching-input";

export const tiktokExternalId = (id: string) => hashMetaValue(`n7:tiktok:visitor:${id}`);
export function tiktokContact(email: string, phone: string): TikTokMatching {
  const normalized = normalizeMetaPhone(phone);
  return { ...(email.trim() ? { email: hashMetaValue(email.trim().toLowerCase()) } : {}), ...(normalized ? { phone: hashMetaValue(`+${normalized}`) } : {}) };
}
export function readTikTokMatching(encrypted: string | null): TikTokMatching {
  try { return encrypted ? tiktokMatching(JSON.parse(decryptSecret(encrypted))) : {}; }
  catch { return {}; }
}
export function tiktokRequestUser(request: Request): Record<string, string> {
  const user: Record<string, string> = {};
  const ip = clientIpAddress(request.headers);
  const ua = request.headers.get("user-agent")?.slice(0, 1000);
  if (ip) user.ip = ip;
  if (ua) user.user_agent = ua;
  for (const [cookie, key] of [["ttclid", "ttclid"], ["_ttp", "ttp"]]) {
    const value = readCookie(request, cookie);
    if (/^[A-Za-z0-9_.~-]{1,500}$/.test(value)) user[key] = value;
  }
  return user;
}
export async function tiktokVisitor(request: Request, id: string, connection?: PoolConnection): Promise<Record<string, string> | null> {
  const row = await selectOne<RowDataPacket & { tiktok_matching_encrypted: string | null }>("SELECT tiktok_matching_encrypted FROM meta_consents WHERE id = ? AND granted = 1 AND expires_at > CURRENT_TIMESTAMP(3)", [id], connection);
  if (!row) return null;
  return { ...tiktokRequestUser(request), ...readTikTokMatching(row.tiktok_matching_encrypted), external_id: tiktokExternalId(id) };
}
export async function saveTikTokMatching(request: Request, input: MetaMatchingInput) {
  const id = consentId(request);
  if (!/^[0-9a-f-]{36}$/.test(id) || readCookie(request, "n7_marketing_optout") === "1") return null;
  return withTransaction(async connection => {
    const row = await selectOne<RowDataPacket>("SELECT id FROM meta_consents WHERE id = ? AND granted = 1 AND expires_at > CURRENT_TIMESTAMP(3) FOR UPDATE", [id], connection);
    if (!row) return null;
    const settings = await getTikTokSettings(connection);
    if (!tiktokPixelReady(settings) && !tiktokServerReady(settings)) return null;
    const matching = tiktokContact(input.email, input.phone ?? "");
    await executeMutation("UPDATE meta_consents SET tiktok_matching_encrypted = ? WHERE id = ?", [encryptSecret(JSON.stringify(matching)), id], connection);
    return { externalId: tiktokExternalId(id) };
  });
}
