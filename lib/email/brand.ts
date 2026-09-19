import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectRows } from "../db/query";
import { getApplicationConfig } from "../env";
import type { EmailBrand } from "./layout";

export interface EmailPreferences extends EmailBrand { orderRecipient?: string; bankInstructions?: string }

export async function getEmailPreferences(connection?: PoolConnection): Promise<EmailPreferences> {
  const rows = await selectRows<RowDataPacket & { setting_key: string; value_json: unknown }>("SELECT setting_key, value_json FROM site_settings WHERE setting_key IN ('contact.email','contact.address','email.order_recipient','email.bank_instructions')", [], connection);
  const values = new Map(rows.map((row) => {
    let value = row.value_json;
    if (typeof value === "string") { try { value = JSON.parse(value); } catch {} }
    return [row.setting_key, typeof value === "string" ? value : ""];
  }));
  return { appUrl: getApplicationConfig().appUrl, contactEmail: values.get("contact.email") || undefined, address: values.get("contact.address") || undefined, orderRecipient: values.get("email.order_recipient") || values.get("contact.email") || undefined, bankInstructions: values.get("email.bank_instructions") || undefined };
}
