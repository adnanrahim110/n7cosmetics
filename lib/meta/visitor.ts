import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "../db/query";
import { decryptSecret } from "../security/encryption";
import { metaExternalId, requestUserData } from "./identity";

const matchingKeys = new Set(["em", "ph", "fn", "ln", "ct", "st", "zp", "country"]);
export async function visitorMetaUserData(request: Request, consent: string): Promise<Record<string, string | string[]>> {
  const row = await selectOne<RowDataPacket>("SELECT matching_data_encrypted FROM meta_consents WHERE id = ? AND granted = 1 AND expires_at > CURRENT_TIMESTAMP(3)", [consent]);
  if (!row) return {}; // Consent can change while an event is being prepared.
  const known: Record<string, string[]> = {};
  if (row.matching_data_encrypted) {
    try {
      const profile = JSON.parse(decryptSecret(row.matching_data_encrypted));
      for (const [key, value] of Object.entries(profile)) {
        if (matchingKeys.has(key) && Array.isArray(value) && value.length === 1 && /^[a-f0-9]{64}$/.test(String(value[0]))) known[key] = value as string[];
      }
    } catch { /* An unreadable optional profile must not stop event delivery. */ }
  }
  return { ...requestUserData(request), ...known, external_id: [metaExternalId(consent)] };
}
