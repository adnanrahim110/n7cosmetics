import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";
import { normalizeSocialMediaLinks, type SocialMediaLink } from "@/lib/social-media";

export interface PublicSiteSettings { phone?: string; email?: string; address?: string; whatsapp?: string; socialLinks: SocialMediaLink[]; currency?: string }
interface SettingRow extends RowDataPacket { setting_key: string; value_json: unknown }
function value(value: unknown): string { if (typeof value === "string") { try { const parsed: unknown = JSON.parse(value); return typeof parsed === "string" ? parsed : ""; } catch { return value; } } return typeof value === "number" ? String(value) : ""; }
const fields = { "contact.phone": "phone", "contact.email": "email", "contact.address": "address", "contact.whatsapp": "whatsapp", "store.currency": "currency" } as const;
export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  if (!hasDatabaseConfig()) return { socialLinks: [] };
  const rows = await selectRows<SettingRow>("SELECT setting_key, value_json FROM site_settings WHERE is_public = 1");
  const result: PublicSiteSettings = { socialLinks: [] };
  for (const row of rows) {
    if (row.setting_key === "social.links") {
      result.socialLinks = normalizeSocialMediaLinks(row.value_json);
      continue;
    }
    const field = fields[row.setting_key as keyof typeof fields];
    if (field) result[field] = value(row.value_json);
  }
  return result;
}
