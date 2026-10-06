import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "../db/query";
import { decryptSecret } from "../security/encryption";
import { metaExternalId, requestUserData } from "./identity";
import { metaAdvancedMatching } from "./matching";

export function readMetaMatchingProfile(encrypted: string | null): Record<string, string[]> {
  const known: Record<string, string[]> = {};
  if (encrypted) {
    try {
      const profile = metaAdvancedMatching(JSON.parse(decryptSecret(encrypted)));
      for (const [key, value] of Object.entries(profile)) known[key] = [value];
    } catch { /* An unreadable optional profile must not stop event delivery. */ }
  }
  return known;
}
export async function visitorMetaUserData(request: Request, consent: string): Promise<Record<string, string | string[]>> {
  const row = await selectOne<RowDataPacket & { matching_data_encrypted: string | null }>("SELECT matching_data_encrypted FROM meta_consents WHERE id = ? AND granted = 1 AND expires_at > CURRENT_TIMESTAMP(3)", [consent]);
  if (!row) return {}; // Consent can change while an event is being prepared.
  const known = readMetaMatchingProfile(row.matching_data_encrypted);
  return { ...requestUserData(request), ...known, external_id: [metaExternalId(consent)] };
}
