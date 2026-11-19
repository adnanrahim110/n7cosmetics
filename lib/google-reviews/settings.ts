import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { writeAuditLog } from "../auth/audit";
import { defaultGoogleReviewsSettings, googleReviewsSettingKey, readGoogleReviewsSettings, type GoogleReviewsSettings } from "./config";

export async function getGoogleReviewsSettings(connection?: PoolConnection, lock = false) {
  const row = await selectOne<RowDataPacket & { value_json: unknown }>(
    `SELECT value_json FROM site_settings WHERE setting_key = ?${lock ? " FOR UPDATE" : ""}`, [googleReviewsSettingKey], connection);
  const settings = readGoogleReviewsSettings(row?.value_json);
  return { settings, revision: createHash("sha256").update(JSON.stringify(settings)).digest("hex") };
}

export async function saveGoogleReviewsSettings(settings: GoogleReviewsSettings, revision: string, administratorId: string) {
  return withTransaction(async connection => {
    await executeMutation("INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES (?, 'google', ?, 0)",
      [googleReviewsSettingKey, JSON.stringify(defaultGoogleReviewsSettings)], connection);
    const current = await getGoogleReviewsSettings(connection, true);
    if (current.revision !== revision) return { error: "These settings changed in another session. Reload this page before saving." };
    await executeMutation("UPDATE site_settings SET value_json = ?, is_public = 0, updated_by = ? WHERE setting_key = ?",
      [JSON.stringify(settings), administratorId, googleReviewsSettingKey], connection);
    await writeAuditLog({ administratorId, action: "GOOGLE_REVIEWS_SETTINGS_UPDATE", entityType: "site_settings",
      entityId: googleReviewsSettingKey, summary: "Updated Google Customer Reviews and store widget settings" }, connection);
    return { revision: (await getGoogleReviewsSettings(connection)).revision };
  });
}
