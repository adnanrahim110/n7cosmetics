"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString } from "@/lib/admin/form";
import { requireAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { withTransaction } from "@/lib/db/transaction";
import { getEmailPreferences } from "@/lib/email/brand";
import { saveEmailSetting } from "@/lib/email/store";
import { emailAddressSchema, notificationRecipients, notificationSettingsSchema, notificationTypes, smtpSchema, type EmailSettingsFormState } from "@/lib/email/settings";
import { sendProjectEmail } from "@/lib/email/service";
import { smtpTestEmail } from "@/lib/email/templates";
import { enqueueEmail } from "@/lib/email/queue";
import { kickEmailQueue } from "@/lib/email/kick";
import { saveVerifiedSmtpSettings } from "@/lib/email/configuration";

export async function saveSmtpSettingsAction(previous: EmailSettingsFormState, form: FormData): Promise<EmailSettingsFormState> {
  void previous;
  const admin = await requireAdministrator(["OWNER"]);
  const parsed = smtpSchema.safeParse({ provider: formString(form, "provider"), host: formString(form, "host"), port: Number(formString(form, "port")), security: formString(form, "security"), user: formString(form, "user"), password: form.get("password") ?? "", fromName: formString(form, "fromName"), fromEmail: formString(form, "fromEmail") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the SMTP fields." };
  const result = await saveVerifiedSmtpSettings(parsed.data, formString(form, "revision"), admin.id);
  if (result.error) return result;
  await writeAuditLog({ administratorId: admin.id, action: "SMTP_SETTINGS_UPDATE", entityType: "site_settings", summary: "Verified and updated SMTP email settings" });
  kickEmailQueue();
  revalidatePath("/admin/settings");
  redirect("/admin/settings?smtp-saved=1#smtp");
}

export async function sendTestEmailAction(form: FormData): Promise<void> {
  await requireAdministrator(["OWNER"]);
  const recipient = emailAddressSchema.safeParse(formString(form, "recipient"));
  if (!recipient.success) redirect("/admin/settings?smtp-test=invalid#smtp");
  const brand = await getEmailPreferences();
  const result = await sendProjectEmail({ ...smtpTestEmail(brand, recipient.data), to: recipient.data, replyTo: brand.replyToEmail, templateKey: "smtp-test" });
  revalidatePath("/admin/emails");
  redirect(`/admin/settings?smtp-test=${result.status.toLowerCase()}#smtp`);
}

export async function saveNotificationSettingsAction(previous: EmailSettingsFormState, form: FormData): Promise<EmailSettingsFormState> {
  void previous;
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  let candidate: unknown;
  try { candidate = JSON.parse(formString(form, "notifications")); }
  catch { return { error: "Check the notification recipient lists." }; }
  const parsed = notificationSettingsSchema.safeParse(candidate);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Check the notification recipient lists." };
  const preferences = z.object({ replyTo: z.union([z.literal(""), emailAddressSchema]), bankInstructions: z.string().trim().max(2000) }).safeParse({ replyTo: formString(form, "replyTo"), bankInstructions: formString(form, "bankInstructions") });
  if (!preferences.success) return { error: "Check the reply-to address and payment instructions." };
  await withTransaction(async (connection) => {
    const previousSettings = (await getEmailPreferences(connection)).notifications;
    await saveEmailSetting("email.notifications", parsed.data, admin.id, connection);
    if (JSON.stringify(notificationRecipients(previousSettings, "low_stock")) !== JSON.stringify(notificationRecipients(parsed.data, "low_stock"))) {
      await saveEmailSetting("email.low_stock_state", [], admin.id, connection);
    }
    await saveEmailSetting("email.reply_to", preferences.data.replyTo, admin.id, connection);
    await saveEmailSetting("email.bank_instructions", preferences.data.bankInstructions, admin.id, connection);
  });
  await writeAuditLog({ administratorId: admin.id, action: "EMAIL_PREFERENCES_UPDATE", entityType: "site_settings", summary: "Updated store notification routing, reply address and email content" });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?email-saved=1#email-content");
}

export async function sendNotificationTestAction(form: FormData): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const type = z.enum(notificationTypes).safeParse(formString(form, "notificationType"));
  if (!type.success) redirect("/admin/settings?notification-test=invalid#email-content");
  const brand = await getEmailPreferences();
  const recipients = notificationRecipients(brand.notifications, type.data);
  if (!recipients.length) redirect("/admin/settings?notification-test=empty#email-content");
  await withTransaction(async (connection) => {
    for (const recipient of recipients) {
      await enqueueEmail({ ...smtpTestEmail(brand, recipient), to: recipient, replyTo: brand.replyToEmail, templateKey: "store-notification-test", notificationType: type.data }, { dedupeKey: `notification-test:${randomUUID()}` }, connection);
    }
  });
  await writeAuditLog({ administratorId: admin.id, action: "EMAIL_TEST", entityType: "site_settings", summary: `Queued ${type.data} notification tests for ${recipients.length} recipients` });
  kickEmailQueue();
  revalidatePath("/admin/emails");
  redirect("/admin/settings?notification-test=queued#email-content");
}
