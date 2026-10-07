import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { encryptSecret } from "../security/encryption";
import { consentId } from "./consent";
import { metaExternalId, metaMatchData, preserveMetaRegion, readCookie } from "./identity";
import { metaAdvancedMatching } from "./matching";
import type { MetaMatchingInput } from "./matching-input";
import { capiReady, getMetaSettings, pixelReady } from "./settings";
import { readMetaMatchingProfile } from "./visitor";

export async function saveMetaMatchingProfile(request: Request, input: MetaMatchingInput) {
  const id = consentId(request);
  if (!/^[0-9a-f-]{36}$/.test(id) || readCookie(request, "n7_marketing_optout") === "1") return null;
  return withTransaction(async connection => {
    // Serialize with consent withdrawal; an expired/withdrawn choice must never
    // be renewed implicitly by entering checkout details.
    const row = await selectOne<RowDataPacket & { matching_data_encrypted: string | null }>(
      "SELECT matching_data_encrypted FROM meta_consents WHERE id = ? AND granted = 1 AND expires_at > CURRENT_TIMESTAMP(3) FOR UPDATE", [id], connection,
    );
    if (!row) return null;
    const settings = await getMetaSettings(connection);
    if (!pixelReady(settings) && !capiReady(settings)) return null;
    const matching = preserveMetaRegion(metaMatchData(input.email, input.phone ?? "", input), readMetaMatchingProfile(row.matching_data_encrypted));
    await executeMutation("UPDATE meta_consents SET matching_data_encrypted = ? WHERE id = ?", [encryptSecret(JSON.stringify(matching)), id], connection);
    return { pixelId: pixelReady(settings) ? settings.pixelId : "", externalId: metaExternalId(id), matching: metaAdvancedMatching(matching) };
  });
}
