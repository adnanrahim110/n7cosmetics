import type { RowDataPacket } from "mysql2/promise";
import { writeAuditLog } from "../auth/audit";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { isEmailCopyKey, readEmailCopy, validateEmailCopy, type EmailCopyOverrides } from "./copy";
import { readSetting } from "./settings";
import { saveEmailSetting, settingsRevision } from "./store";

export type EmailCopySaveResult = { success: true; revision: string; values: EmailCopyOverrides } | { success: false; message: string };

export async function saveEmailCopySettings(key: string, input: unknown, revision: string, administratorId: string | null): Promise<EmailCopySaveResult> {
  if (!isEmailCopyKey(key)) return { success: false, message: "Choose an email template." };
  let values: EmailCopyOverrides;
  try { values = validateEmailCopy(key, input); }
  catch (error) { return { success: false, message: error instanceof Error ? error.message : "Check the email wording." }; }
  return withTransaction(async (connection) => {
    const settingKey = `email.copy.${key}`;
    // Ensure there is a row to lock even for two concurrent first-time saves.
    await executeMutation("INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES (?, 'email', '{}', 0)", [settingKey], connection);
    const current = await selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = ? FOR UPDATE", [settingKey], connection);
    const saved = readEmailCopy(key, readSetting(current?.value_json));
    if (revision !== settingsRevision(saved)) return { success: false, message: "This template was changed in another session. Reload the page before saving again." };
    await saveEmailSetting(settingKey, values, administratorId, connection);
    await writeAuditLog({ administratorId, action: "EMAIL_TEMPLATE_UPDATE", entityType: "site_settings", summary: `Updated ${key} email wording`, metadata: { template: key, fields: Object.keys(values) } }, connection);
    return { success: true, revision: settingsRevision(values), values };
  });
}
