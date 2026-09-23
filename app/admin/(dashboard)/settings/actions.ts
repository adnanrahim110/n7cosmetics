"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/admin/form";
import { GLOBAL_LOW_STOCK_SETTING_KEY } from "@/lib/admin/product-defaults";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import type { PoolConnection } from "mysql2/promise";
import { socialMediaPlatformValues } from "@/lib/social-media";

const settingsSchema = z.object({ phone: z.string().max(50), email: z.union([z.literal(""), z.email().max(190)]), address: z.string().max(1000), whatsapp: z.string().max(50), currency: z.enum(["GBP", "PKR", "USD", "EUR"]), lowStockThreshold: z.number().int().min(0).max(1000000) });
const keyMap = { phone: "contact.phone", email: "contact.email", address: "contact.address", whatsapp: "contact.whatsapp", currency: "store.currency", lowStockThreshold: GLOBAL_LOW_STOCK_SETTING_KEY } as const;
const socialMediaLinkSchema = z.object({
  platform: z.enum(socialMediaPlatformValues),
  url: z.url().max(1000).refine((url) => url.startsWith("https://") || url.startsWith("http://")),
});
const socialMediaLinksSchema = z.array(socialMediaLinkSchema).max(20).superRefine((links, context) => {
  const seen = new Set<string>();
  links.forEach((link, index) => {
    const key = `${link.platform}\u0000${link.url.toLowerCase()}`;
    if (seen.has(key)) context.addIssue({ code: "custom", message: "Duplicate social profile", path: [index, "url"] });
    seen.add(key);
  });
});

async function saveSetting(key: string, value: unknown, publicValue: boolean, administratorId: string, connection?: PoolConnection): Promise<void> {
  await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE setting_group = VALUES(setting_group), value_json = VALUES(value_json), is_public = VALUES(is_public), updated_by = VALUES(updated_by)", [key, key.split(".")[0], JSON.stringify(value), publicValue, administratorId], connection);
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = settingsSchema.safeParse({ phone: formString(formData, "phone"), email: formString(formData, "email").toLowerCase(), address: formString(formData, "address"), whatsapp: formString(formData, "whatsapp"), currency: formString(formData, "currency"), lowStockThreshold: Number(formString(formData, "lowStockThreshold")) });
  if (!parsed.success) redirect("/admin/settings?error=invalid");
  await withTransaction(async (connection) => {
    for (const [field, key] of Object.entries(keyMap) as [keyof typeof keyMap, string][]) {
      await saveSetting(key, parsed.data[field], field !== "lowStockThreshold", admin.id, connection);
    }
    await executeMutation("UPDATE product_variants SET low_stock_threshold = ?", [parsed.data.lowStockThreshold], connection);
  });
  const metadata = await getRequestMetadata(); await writeAuditLog({ administratorId: admin.id, action: "SETTINGS_UPDATE", entityType: "site_settings", summary: "Updated global store settings", ipAddress: metadata.ipAddress });
  revalidatePath("/", "layout"); revalidatePath("/admin/settings"); redirect("/admin/settings?saved=1");
}

export async function saveSocialMediaSettingsAction(formData: FormData): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  let candidate: unknown;
  try {
    candidate = JSON.parse(formString(formData, "socialLinksJson")) as unknown;
  } catch {
    redirect("/admin/settings?social-error=invalid#social-media");
  }
  const parsed = socialMediaLinksSchema.safeParse(candidate);
  if (!parsed.success) redirect("/admin/settings?social-error=invalid#social-media");

  await saveSetting("social.links", parsed.data, true, admin.id);
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: admin.id, action: "SOCIAL_MEDIA_SETTINGS_UPDATE", entityType: "site_settings", entityId: "social.links", summary: `Updated ${parsed.data.length} storefront social profile${parsed.data.length === 1 ? "" : "s"}`, ipAddress: metadata.ipAddress });
  revalidatePath("/", "layout");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?social-saved=1#social-media");
}
