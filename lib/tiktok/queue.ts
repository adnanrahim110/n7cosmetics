import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectRows, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { decryptSecret } from "../security/encryption";
import { consentGranted } from "../meta/consent";
import { TikTokApiError, tiktokRequest } from "./api";
import { getTikTokSettings, tiktokServerReady } from "./settings";
import { queueTikTokPurchase } from "./orders";
import type { TikTokServerEvent } from "./events";
import { syncTikTokOrderDiagnostics } from "./diagnostics";

interface Job extends RowDataPacket { id: string; consent_id: string; pixel_id: string; event_name: string; test_event_code: string; payload_encrypted: string; attempts: number; lease_token: string }
export async function retryTikTokEvents(connection: PoolConnection): Promise<number> {
  await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'tiktok.configuration' FOR UPDATE", [], connection);
  const settings = await getTikTokSettings(connection);
  if (!tiktokServerReady(settings)) throw new Error("TikTok server events are not configured.");
  const result = await executeMutation(`UPDATE tiktok_event_jobs j JOIN meta_consents c ON c.id = j.consent_id SET j.status = 'PENDING', j.attempts = 0, j.next_attempt_at = CURRENT_TIMESTAMP(3), j.last_error = NULL
    WHERE j.status = 'FAILED' AND j.payload_encrypted IS NOT NULL AND j.pixel_id = ? AND j.test_event_code = ? AND j.event_time > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 47 HOUR) AND c.granted = 1 AND c.expires_at > CURRENT_TIMESTAMP(3)`, [settings.pixelId, settings.testEventCode], connection);
  return result.affectedRows;
}
export async function processTikTokQueue(limit = 10): Promise<number> {
  await executeMutation("UPDATE tiktok_event_jobs SET status = 'FAILED', payload_encrypted = NULL, last_error = 'Delivery window expired' WHERE status IN ('PENDING','PROCESSING','FAILED') AND event_time < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 47 HOUR)");
  await syncTikTokOrderDiagnostics();
  await executeMutation("DELETE FROM tiktok_event_jobs WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 DAY)");
  await executeMutation("DELETE FROM tiktok_order_contexts WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY)");
  await executeMutation("UPDATE meta_consents SET tiktok_matching_encrypted = NULL WHERE granted = 0 OR expires_at <= CURRENT_TIMESTAMP(3)");
  const settings = await getTikTokSettings();
  if (!tiktokServerReady(settings)) return 0;
  const token = decryptSecret(settings.accessTokenEncrypted);
  const paid = await selectRows<RowDataPacket & { order_id: string }>(`SELECT CAST(t.order_id AS CHAR) AS order_id FROM tiktok_order_contexts t JOIN orders o ON o.id = t.order_id JOIN stripe_checkouts c ON c.order_id = o.id JOIN meta_consents m ON m.id = t.consent_id AND m.granted = 1 AND m.expires_at > CURRENT_TIMESTAMP(3)
    LEFT JOIN tiktok_event_jobs j ON j.pixel_id = t.pixel_id AND j.event_name = 'Purchase' AND j.event_id = CONCAT('n7_tiktok_purchase_', t.order_id)
    WHERE o.source = 'LIVE' AND o.payment_status = 'PAID' AND t.server_enabled = 1 AND t.pixel_id = ? AND t.test_event_code = ? AND (c.stripe_mode = 'live' OR t.test_event_code <> '') AND j.id IS NULL AND t.created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY) AND o.paid_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 47 HOUR) LIMIT 50`, [settings.pixelId, settings.testEventCode]);
  for (const row of paid) await withTransaction(connection => queueTikTokPurchase(row.order_id, connection));
  let sent = 0;
  for (let index = 0; index < limit; index++) {
    const job = await withTransaction(async connection => {
      const row = await selectOne<Job>("SELECT * FROM tiktok_event_jobs WHERE status IN ('PENDING','PROCESSING') AND next_attempt_at <= CURRENT_TIMESTAMP(3) ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED", [], connection);
      if (!row) return null;
      row.lease_token = randomUUID(); row.attempts++;
      await executeMutation("UPDATE tiktok_event_jobs SET status = 'PROCESSING', attempts = ?, lease_token = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 2 MINUTE) WHERE id = ?", [row.attempts, row.lease_token, row.id], connection);
      return row;
    });
    if (!job) break;
    if ((await getTikTokSettings()).revision !== settings.revision) {
      await executeMutation("UPDATE tiktok_event_jobs SET status = 'PENDING', next_attempt_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'", [job.id, job.lease_token]);
      break;
    }
    if (job.pixel_id !== settings.pixelId || job.test_event_code !== settings.testEventCode || !await consentGranted(job.consent_id)) {
      await executeMutation("UPDATE tiktok_event_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'Settings changed or consent withdrawn' WHERE id = ? AND lease_token = ?", [job.id, job.lease_token]);
      continue;
    }
    try {
      const event: TikTokServerEvent = JSON.parse(decryptSecret(job.payload_encrypted));
      const result = await tiktokRequest(token, { event_source: "web", event_source_id: settings.pixelId, ...(settings.testEventCode ? { test_event_code: settings.testEventCode } : {}), data: [event] });
      await executeMutation("UPDATE tiktok_event_jobs SET status = 'SENT', sent_at = CURRENT_TIMESTAMP(3), request_id = ?, payload_encrypted = NULL, last_error = NULL WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'", [result.requestId || null, job.id, job.lease_token]);
      sent++;
    } catch (error) {
      const retry = error instanceof TikTokApiError && error.retryable && job.attempts < 12;
      const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts - 1, 7));
      await executeMutation("UPDATE tiktok_event_jobs SET status = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND), last_error = ? WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'", [retry ? "PENDING" : "FAILED", delay, error instanceof TikTokApiError ? error.message : "Unable to read event; check the application encryption key.", job.id, job.lease_token]);
    }
  }
  await syncTikTokOrderDiagnostics();
  return sent;
}
