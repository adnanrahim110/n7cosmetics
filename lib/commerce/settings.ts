import type { RowDataPacket } from "mysql2/promise";
import { selectRows } from "@/lib/db/query";
import { hasDatabaseConfig } from "@/lib/env";

export interface PublicSiteSettings { phone?: string; email?: string; address?: string; whatsapp?: string; instagramUrl?: string; facebookUrl?: string; currency?: string }
interface SettingRow extends RowDataPacket { setting_key: string; value_json: unknown }
function value(value: unknown): string { if (typeof value === "string") { try { const parsed: unknown = JSON.parse(value); return typeof parsed === "string" ? parsed : ""; } catch { return value; } } return typeof value === "number" ? String(value) : ""; }
const fields: Record<string, keyof PublicSiteSettings> = { "contact.phone": "phone", "contact.email": "email", "contact.address": "address", "contact.whatsapp": "whatsapp", "social.instagram": "instagramUrl", "social.facebook": "facebookUrl", "store.currency": "currency" };
export async function getPublicSiteSettings(): Promise<PublicSiteSettings> { if (!hasDatabaseConfig()) return {}; const rows = await selectRows<SettingRow>("SELECT setting_key, value_json FROM site_settings WHERE is_public = 1"); const result: PublicSiteSettings = {}; for (const row of rows) { const field = fields[row.setting_key]; if (field) result[field] = value(row.value_json); } return result; }
