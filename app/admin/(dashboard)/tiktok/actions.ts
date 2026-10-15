"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import { hashMetaValue } from "@/lib/meta/identity";
import { clientIpAddress } from "@/lib/http/client-ip";
import { TikTokApiError, tiktokRequest } from "@/lib/tiktok/api";
import { makeTikTokEvent } from "@/lib/tiktok/events";
import { getTikTokSettings, tiktokServerReady } from "@/lib/tiktok/settings";
import { tiktokSettingsSchema } from "@/lib/tiktok/shared";
import { retryTikTokEvents } from "@/lib/tiktok/queue";

export interface TikTokFormState { error?: string; success?: string; revision?: string }
export async function saveTikTokSettings(_previous: TikTokFormState, form: FormData): Promise<TikTokFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  const value = (key: string) => String(form.get(key) ?? "");
  const checked = (key: string) => form.get(key) === "on";
  const parsed = tiktokSettingsSchema.safeParse({ pixelId: value("pixelId"), pixelEnabled: checked("pixelEnabled"), serverEnabled: checked("serverEnabled"), accessToken: value("accessToken"), clearAccessToken: checked("clearAccessToken"), testEventCode: value("testEventCode"), revision: value("revision") });
  if (!parsed.success) return { error: parsed.error.issues.map(issue => `${String(issue.path[0])}: ${issue.message}`).join(" ") };
  const p = parsed.data;
  try {
    await withTransaction(async connection => {
      await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'tiktok.configuration' FOR UPDATE", [], connection);
      const current = await getTikTokSettings(connection);
      if (current.revision !== p.revision) throw new Error("changed");
      const next = { pixelId: p.pixelId, pixelEnabled: p.pixelEnabled, serverEnabled: p.serverEnabled, testEventCode: p.testEventCode, accessTokenEncrypted: p.clearAccessToken ? "" : p.accessToken ? encryptSecret(p.accessToken) : current.accessTokenEncrypted };
      await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES ('tiktok.configuration', 'tiktok', ?, 0, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_by = VALUES(updated_by), is_public = 0", [JSON.stringify(next), admin.id], connection);
      if (current.pixelId !== next.pixelId || current.testEventCode !== next.testEventCode || !next.serverEnabled || p.clearAccessToken) {
        await executeMutation("UPDATE tiktok_event_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'TikTok settings changed' WHERE status IN ('PENDING','PROCESSING','FAILED')", [], connection);
        await executeMutation("UPDATE tiktok_order_contexts SET server_enabled = 0", [], connection);
      }
      await executeMutation("DELETE FROM site_settings WHERE setting_key = 'tiktok.check'", [], connection);
      await writeAuditLog({ administratorId: admin.id, action: "TIKTOK_SETTINGS_UPDATE", entityType: "site_settings", entityId: "tiktok.configuration", summary: "Updated TikTok integration settings", metadata: { pixelEnabled: next.pixelEnabled, serverEnabled: next.serverEnabled } }, connection);
    });
    revalidatePath("/admin/tiktok");
    return { success: "TikTok settings saved. Storefronts refresh within one minute.", revision: (await getTikTokSettings()).revision };
  } catch (error) {
    return { error: error instanceof Error && error.message === "changed" ? "Settings changed in another session. Reload before saving." : "Unable to save. Check database migrations and the application encryption key." };
  }
}
export async function checkTikTokConnection(_previous: TikTokFormState): Promise<TikTokFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  const s = await getTikTokSettings();
  if (!tiktokServerReady(s) || !s.testEventCode) return { error: "Save the Pixel ID, access token and a Test Events code first. This check sends only a test event." };
  let success = false;
  let message: string;
  try {
    const requestHeaders = await headers();
    const ip = clientIpAddress(requestHeaders);
    const event = makeTikTokEvent("Pageview", `n7_test_${randomUUID()}`, "/", { external_id: hashMetaValue(`n7:tiktok:test:${randomUUID()}`), user_agent: requestHeaders.get("user-agent")?.slice(0, 1000) || "N7 integration check", ...(ip ? { ip } : {}) }, {});
    const result = await tiktokRequest(decryptSecret(s.accessTokenEncrypted), { event_source: "web", event_source_id: s.pixelId, test_event_code: s.testEventCode, data: [event] });
    success = true;
    message = `TikTok accepted the server test event.${result.requestId ? ` Request ID: ${result.requestId}.` : ""} Confirm it in Events Manager → Test Events. Acceptance does not confirm attribution or match quality.`;
  } catch (error) { message = error instanceof TikTokApiError ? error.message : "Unable to read the saved access token. Replace it or check the application encryption key."; }
  try {
    await withTransaction(async connection => {
      await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'tiktok.configuration' FOR UPDATE", [], connection);
      if ((await getTikTokSettings(connection)).revision !== s.revision) return;
      await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES ('tiktok.check', 'tiktok', ?, 0) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)", [JSON.stringify({ success, message, checkedAt: new Date().toISOString() })], connection);
      await writeAuditLog({ administratorId: admin.id, action: "TIKTOK_CONNECTION_CHECK", entityType: "site_settings", summary: `TikTok test event ${success ? "accepted" : "failed"}` }, connection);
    });
  } catch { return { error: "The connection check finished, but its result could not be saved. Reload and check delivery status." }; }
  revalidatePath("/admin/tiktok");
  return success ? { success: message } : { error: message };
}

export async function retryTikTokDelivery(_previous: TikTokFormState): Promise<TikTokFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  try {
    const count = await withTransaction(async connection => {
      const retried = await retryTikTokEvents(connection);
      await writeAuditLog({ administratorId: admin.id, action: "TIKTOK_DELIVERY_RETRY", entityType: "site_settings", summary: `Queued ${retried} failed TikTok events for retry` }, connection);
      return retried;
    });
    revalidatePath("/admin/tiktok");
    return { success: count ? `${count} event${count === 1 ? "" : "s"} queued for retry. The worker will attempt delivery.` : "No eligible failed events remain within the delivery window." };
  } catch { return { error: "Unable to retry. Enable Events API, check the saved credentials and try again." }; }
}
