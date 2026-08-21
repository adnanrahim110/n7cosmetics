"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import type { PoolConnection } from "mysql2/promise";
import { sendProjectEmail } from "@/lib/email/service";
import { encryptSecret } from "@/lib/security/encryption";

const settingsSchema = z.object({ phone: z.string().max(50), email: z.union([z.literal(""), z.email().max(190)]), address: z.string().max(1000), whatsapp: z.string().max(50), instagramUrl: z.union([z.literal(""), z.url().max(1000)]), facebookUrl: z.union([z.literal(""), z.url().max(1000)]), currency: z.enum(["GBP", "PKR", "USD", "EUR"]) });
const keyMap = { phone: "contact.phone", email: "contact.email", address: "contact.address", whatsapp: "contact.whatsapp", instagramUrl: "social.instagram", facebookUrl: "social.facebook", currency: "store.currency" } as const;
const smtpSchema = z.object({ host: z.string().min(1).max(255), port: z.number().int().min(1).max(65535), secure: z.boolean(), user: z.string().min(1).max(255), password: z.string().max(500), fromName: z.string().min(1).max(120), fromEmail: z.email().max(190) });

async function saveSetting(key: string, value: unknown, publicValue: boolean, administratorId: string, connection?: PoolConnection): Promise<void> {
  await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE setting_group = VALUES(setting_group), value_json = VALUES(value_json), is_public = VALUES(is_public), updated_by = VALUES(updated_by)", [key, key.split(".")[0], JSON.stringify(value), publicValue, administratorId], connection);
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = settingsSchema.safeParse({ phone: formString(formData, "phone"), email: formString(formData, "email").toLowerCase(), address: formString(formData, "address"), whatsapp: formString(formData, "whatsapp"), instagramUrl: formString(formData, "instagramUrl"), facebookUrl: formString(formData, "facebookUrl"), currency: formString(formData, "currency") });
  if (!parsed.success) redirect("/admin/settings?error=invalid");
  await withTransaction(async (connection) => { for (const [field, key] of Object.entries(keyMap) as [keyof typeof keyMap, string][]) await saveSetting(key, parsed.data[field], true, admin.id, connection); });
  const metadata = await getRequestMetadata(); await writeAuditLog({ administratorId: admin.id, action: "SETTINGS_UPDATE", entityType: "site_settings", summary: "Updated global store settings", ipAddress: metadata.ipAddress });
  revalidatePath("/", "layout"); revalidatePath("/admin/settings"); redirect("/admin/settings?saved=1");
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
