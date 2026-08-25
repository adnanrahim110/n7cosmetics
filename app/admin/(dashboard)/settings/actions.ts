"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString } from "@/lib/admin/form";
import { GLOBAL_LOW_STOCK_SETTING_KEY } from "@/lib/admin/product-defaults";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import type { PoolConnection } from "mysql2/promise";
import { sendProjectEmail } from "@/lib/email/service";
import { encryptSecret } from "@/lib/security/encryption";
import { socialMediaPlatformValues } from "@/lib/social-media";

const settingsSchema = z.object({ phone: z.string().max(50), email: z.union([z.literal(""), z.email().max(190)]), address: z.string().max(1000), whatsapp: z.string().max(50), currency: z.enum(["GBP", "PKR", "USD", "EUR"]), lowStockThreshold: z.number().int().min(0).max(1000000) });
const keyMap = { phone: "contact.phone", email: "contact.email", address: "contact.address", whatsapp: "contact.whatsapp", currency: "store.currency", lowStockThreshold: GLOBAL_LOW_STOCK_SETTING_KEY } as const;
const smtpSchema = z.object({ host: z.string().min(1).max(255), port: z.number().int().min(1).max(65535), secure: z.boolean(), user: z.string().min(1).max(255), password: z.string().max(500), fromName: z.string().min(1).max(120), fromEmail: z.email().max(190) });
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

export async function saveSmtpSettingsAction(formData: FormData): Promise<void> {
  const admin = await requireAdministrator(["OWNER"]);
  const parsed = smtpSchema.safeParse({ host: formString(formData, "smtpHost").trim(), port: Number(formString(formData, "smtpPort")), secure: formCheckbox(formData, "smtpSecure"), user: formString(formData, "smtpUser").trim(), password: formString(formData, "smtpPassword"), fromName: formString(formData, "smtpFromName").trim(), fromEmail: formString(formData, "smtpFromEmail").trim().toLowerCase() });
  if (!parsed.success) redirect("/admin/settings?smtp-error=invalid");
  const values: [string, unknown][] = [["smtp.host", parsed.data.host], ["smtp.port", parsed.data.port], ["smtp.secure", parsed.data.secure], ["smtp.user", parsed.data.user], ["smtp.from_name", parsed.data.fromName], ["smtp.from_email", parsed.data.fromEmail]];
  if (parsed.data.password) values.push(["smtp.password_encrypted", encryptSecret(parsed.data.password)]);
  for (const [key, value] of values) await saveSetting(key, value, false, admin.id);
  const metadata = await getRequestMetadata(); await writeAuditLog({ administratorId: admin.id, action: "SMTP_SETTINGS_UPDATE", entityType: "site_settings", summary: "Updated SMTP email settings", ipAddress: metadata.ipAddress });
  revalidatePath("/admin/settings"); redirect("/admin/settings?smtp-saved=1");
}

export async function sendTestEmailAction(): Promise<void> {
  const admin = await requireAdministrator(["OWNER"]);
  const result = await sendProjectEmail({ to: admin.email, subject: "N7 Cosmetics SMTP test", text: "Your N7 Cosmetics SMTP configuration is working.", html: "<p>Your <strong>N7 Cosmetics</strong> SMTP configuration is working.</p>", templateKey: "smtp-test" });
  redirect(`/admin/settings?smtp-test=${result.status.toLowerCase()}`);
}
