"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formCheckbox, formString } from "@/lib/admin/form";
import { requireAdministrator } from "@/lib/auth/session";
import { getRequestMetadata } from "@/lib/auth/request";
import { writeAuditLog } from "@/lib/auth/audit";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { encryptSecret } from "@/lib/security/encryption";
import { getStripeSettings, stripeKeysReady } from "@/lib/payments/settings";
import type { RowDataPacket } from "mysql2/promise";

export async function saveStripeSettingsAction(form: FormData): Promise<void> {
  const admin = await requireAdministrator(["OWNER"]);
  const current = await getStripeSettings();
  const secretKey = formString(form, "stripeSecretKey").trim();
  const webhookSecret = formString(form, "stripeWebhookSecret").trim();
  const candidate = {
    enabled: formCheckbox(form, "stripeEnabled"),
    mode: formString(form, "stripeMode") === "live" ? "live" as const : "test" as const,
    publishableKey: formString(form, "stripePublishableKey").trim(),
    secretKey: secretKey || current.secretKey,
    webhookSecret: webhookSecret || current.webhookSecret,
  };
  if ([candidate.publishableKey, candidate.secretKey, candidate.webhookSecret].some((value) => value.length > 500)
    || (candidate.enabled && !stripeKeysReady(candidate))
    || (candidate.publishableKey && !/^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(candidate.publishableKey))
    || (candidate.secretKey && !/^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(candidate.secretKey))
    || (candidate.webhookSecret && !/^whsec_[A-Za-z0-9]{16,}$/.test(candidate.webhookSecret))) {
    redirect("/admin/settings?stripe-error=keys#stripe");
  }
  // Keep the old account credentials available while existing payments can settle.
  const values: [string, unknown][] = [["stripe.enabled", candidate.enabled], ["stripe.mode", candidate.mode], ["stripe.publishable_key", candidate.publishableKey]];
  if (secretKey) values.push(["stripe.secret_key_encrypted", encryptSecret(secretKey)]);
  if (webhookSecret) values.push(["stripe.webhook_secret_encrypted", encryptSecret(webhookSecret)]);
  await withTransaction(async (connection) => {
    await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'stripe.enabled' FOR UPDATE", [], connection);
    const latest = await getStripeSettings(connection);
    if (latest.revision !== current.revision) redirect("/admin/settings?stripe-error=changed#stripe");
    if (candidate.mode !== current.mode || candidate.secretKey !== current.secretKey || candidate.webhookSecret !== current.webhookSecret || candidate.publishableKey !== current.publishableKey) {
      const pending = await selectOne<RowDataPacket & { total: number }>("SELECT COUNT(*) AS total FROM stripe_checkouts WHERE inventory_state = 'RESERVED'", [], connection);
      if (Number(pending?.total)) redirect("/admin/settings?stripe-error=pending#stripe");
    }
    for (const [key, value] of values) await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES (?, 'stripe', ?, 0, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), is_public = 0, updated_by = VALUES(updated_by)", [key, JSON.stringify(value), admin.id], connection);
  });
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: admin.id, action: "STRIPE_SETTINGS_UPDATE", entityType: "site_settings", summary: `Updated Stripe settings (${candidate.mode}, ${candidate.enabled ? "enabled" : "disabled"})`, ipAddress: metadata.ipAddress });
  revalidatePath("/admin/settings");
  redirect("/admin/settings?stripe-saved=1#stripe");
}
