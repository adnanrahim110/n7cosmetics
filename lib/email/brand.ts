import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { getApplicationConfig } from "../env";
import type { EmailBrand } from "./layout";
import { legacyNotificationSettings, notificationSettingsSchema, readSetting, type NotificationSettings } from "./settings";
import { isEmailCopyKey, readEmailCopy, type EmailCopySettings } from "./copy";

export interface EmailPreferences extends EmailBrand { orderRecipient?: string; replyToEmail?: string; bankInstructions?: string; notifications: NotificationSettings }

export async function getEmailPreferences(connection?: PoolConnection): Promise<EmailPreferences> {
  const rows = await selectRows<RowDataPacket & { setting_key: string; value_json: unknown }>("SELECT setting_key, value_json FROM site_settings WHERE setting_key IN ('contact.email','contact.address','email.order_recipient','email.bank_instructions','email.reply_to','email.notifications') OR setting_key LIKE 'email.copy.%'", [], connection);
  const values = new Map(rows.map((row) => [row.setting_key, readSetting(row.value_json)]));
  const value = (key: string): string | undefined => typeof values.get(key) === "string" ? String(values.get(key)) || undefined : undefined;
  const saved = notificationSettingsSchema.safeParse(values.get("email.notifications"));
  const notifications = saved.success ? saved.data : values.has("email.notifications") ? legacyNotificationSettings() : legacyNotificationSettings(value("contact.email"), value("email.order_recipient"));
  const emailCopy: EmailCopySettings = {};
  for (const [setting, value] of values) {
    if (!setting.startsWith("email.copy.")) continue;
    const key = setting.slice("email.copy.".length);
    if (isEmailCopyKey(key)) emailCopy[key] = readEmailCopy(key, value);
  }
  return { appUrl: getApplicationConfig().appUrl, contactEmail: value("contact.email"), replyToEmail: value("email.reply_to") || value("contact.email"), address: value("contact.address"), orderRecipient: value("email.order_recipient") || value("contact.email"), bankInstructions: value("email.bank_instructions"), notifications, emailCopy };
}
