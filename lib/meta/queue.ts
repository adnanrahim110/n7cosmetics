import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { decryptSecret } from "../security/encryption";
import { MetaApiError, metaRequest } from "./api";
import { consentGranted } from "./consent";
import { capiReady, getMetaSettings, metaToken } from "./settings";
import { queueMetaPurchase } from "./orders";
import { syncMetaDeliveryDiagnostics } from "./diagnostics";
import { metaMatchingCoverage } from "./matching-coverage";

interface Job extends RowDataPacket { id: string; pixel_id: string; consent_id: string | null; test_event_code: string; payload_encrypted: string; attempts: number; lease_token: string }
export async function processMetaQueue(limit = 10): Promise<number> {
  const settings = await getMetaSettings();
  // Keep a short retention period and remove personal identifiers on completion/expiry.
  await executeMutation("UPDATE meta_event_jobs SET status = 'FAILED', payload_encrypted = NULL, last_error = 'Delivery window expired' WHERE status IN ('PENDING','PROCESSING') AND event_time < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 47 HOUR)");
  await syncMetaDeliveryDiagnostics();
  await executeMutation("DELETE FROM meta_event_jobs WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 DAY)");
  await executeMutation("DELETE FROM meta_order_contexts WHERE created_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY)");
  await executeMutation("DELETE FROM meta_consents WHERE expires_at < CURRENT_TIMESTAMP(3)");
  await executeMutation("DELETE FROM meta_rate_limits WHERE expires_at < CURRENT_TIMESTAMP(3)");
  if (!capiReady(settings)) return 0;
  const token = metaToken(settings, "capi");
  // Discover committed payments independently of the payment transaction. A Meta
  // outage cannot fail checkout, and the worker recovers missed after() executions.
  const paid = await selectRows<RowDataPacket & { order_id: string }>(`SELECT CAST(m.order_id AS CHAR) AS order_id FROM meta_order_contexts m JOIN orders o ON o.id = m.order_id
    JOIN meta_consents consent ON consent.id = m.consent_id AND consent.granted = 1 AND consent.expires_at > CURRENT_TIMESTAMP(3)
    JOIN stripe_checkouts checkout ON checkout.order_id = m.order_id
    LEFT JOIN meta_event_jobs j ON j.pixel_id = m.pixel_id AND j.event_name = 'Purchase' AND j.event_id = CONCAT('n7_purchase_', m.order_id)
    WHERE o.payment_status = 'PAID' AND o.source = 'LIVE' AND m.server_enabled = 1 AND m.pixel_id = ? AND m.test_event_code = ?
    AND (checkout.stripe_mode = 'live' OR m.test_event_code <> '') AND j.id IS NULL AND o.paid_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 47 HOUR)
    AND m.created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 DAY) LIMIT 50`, [settings.pixelId, settings.testEventCode]);
  for (const row of paid) await withTransaction(connection => queueMetaPurchase(row.order_id, connection));
  let processed = 0;
  for (let index = 0; index < limit; index++) {
    const job = await withTransaction(async connection => {
      const row = await selectOne<Job>(`SELECT * FROM meta_event_jobs WHERE status IN ('PENDING','PROCESSING') AND next_attempt_at <= CURRENT_TIMESTAMP(3) ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`, [], connection);
      if (!row) return null;
      row.lease_token = randomUUID(); row.attempts++;
      await executeMutation("UPDATE meta_event_jobs SET status = 'PROCESSING', attempts = ?, last_attempt_at = CURRENT_TIMESTAMP(3), lease_token = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 2 MINUTE) WHERE id = ?", [row.attempts, row.lease_token, row.id], connection);
      return row;
    });
    if (!job) break;
    if ((await getMetaSettings()).revision !== settings.revision) {
      await executeMutation("UPDATE meta_event_jobs SET status = 'PENDING', next_attempt_at = CURRENT_TIMESTAMP(3) WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'", [job.id, job.lease_token]);
      break;
    }
    if (job.pixel_id !== settings.pixelId || job.test_event_code !== settings.testEventCode || (job.consent_id && !(await consentGranted(job.consent_id)))) {
      await executeMutation("UPDATE meta_event_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'Settings changed or consent withdrawn' WHERE id = ? AND lease_token = ?", [job.id, job.lease_token]);
      continue;
    }
    try {
      const event = JSON.parse(decryptSecret(job.payload_encrypted));
      const result = await metaRequest(`${job.pixel_id}/events`, token, { data: [event], ...(job.test_event_code ? { test_event_code: job.test_event_code } : {}) });
      if (Number(result.events_received) !== 1) throw new MetaApiError("Meta did not acknowledge this event.", true);
      await executeMutation("UPDATE meta_event_jobs SET status = 'SENT', sent_at = CURRENT_TIMESTAMP(3), payload_encrypted = NULL, matching_fields_json = ?, last_error = NULL WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'", [JSON.stringify(metaMatchingCoverage(event.user_data ?? {})), job.id, job.lease_token]);
      processed++;
    } catch (error) {
      const retry = error instanceof MetaApiError && error.retryable && job.attempts < 12;
      const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts - 1, 7));
      await executeMutation(`UPDATE meta_event_jobs SET status = ?, last_error = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND), payload_encrypted = IF(?, payload_encrypted, NULL) WHERE id = ? AND lease_token = ? AND status = 'PROCESSING'`, [retry ? "PENDING" : "FAILED", error instanceof MetaApiError ? error.message : "Unable to read the encrypted event. Check the application encryption key.", delay, retry, job.id, job.lease_token]);
    }
  }
  await syncMetaDeliveryDiagnostics();
  return processed;
}
