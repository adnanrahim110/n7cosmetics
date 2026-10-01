import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { getMetaSettings, capiReady } from "./settings";
import { purchaseEventId } from "./shared";
import { metaDeliveryStatus, type MetaCaptureReason } from "./delivery-status";

// Contains order delivery metadata only: no match identifiers, cookies, tokens or event payloads.
export async function recordMetaOrderCapture(orderId: string, reason: MetaCaptureReason, connection: PoolConnection): Promise<void> {
  await connection.query("SAVEPOINT meta_diagnostic");
  try {
    await executeMutation("INSERT IGNORE INTO meta_order_diagnostics (order_id, capture_reason) VALUES (?, ?)", [orderId, reason], connection);
  } catch {
    await connection.query("ROLLBACK TO SAVEPOINT meta_diagnostic");
    console.warn("Meta order diagnostics unavailable; check database migrations.");
  }
  await connection.query("RELEASE SAVEPOINT meta_diagnostic");
}

export async function syncMetaDeliveryDiagnostics(connection?: PoolConnection): Promise<void> {
  await executeMutation(`UPDATE meta_order_diagnostics d JOIN meta_event_jobs j ON j.event_name = 'Purchase' AND j.event_id = CONCAT('n7_purchase_', d.order_id)
    LEFT JOIN meta_event_jobs newer ON newer.event_name = 'Purchase' AND newer.event_id = j.event_id AND newer.id > j.id
    SET d.delivery_status = j.status, d.test_mode = (j.test_event_code <> ''), d.attempts = j.attempts,
      d.last_attempt_at = j.last_attempt_at, d.sent_at = j.sent_at, d.last_error = j.last_error, d.updated_at = CURRENT_TIMESTAMP(3)
    WHERE newer.id IS NULL AND (d.delivery_status IS NULL OR d.delivery_status <> j.status OR d.attempts <> j.attempts OR NOT (d.last_error <=> j.last_error))`, [], connection);
}

export async function recordMetaWorkerHealth(success: boolean): Promise<void> {
  await executeMutation(`INSERT INTO meta_worker_health (id, checked_at, last_success_at, last_error) VALUES (1, CURRENT_TIMESTAMP(3), IF(?, CURRENT_TIMESTAMP(3), NULL), ?)
    ON DUPLICATE KEY UPDATE checked_at = VALUES(checked_at), last_success_at = IF(?, VALUES(last_success_at), last_success_at), last_error = VALUES(last_error)`,
  [success, success ? null : "Worker could not process events. Check database, encryption key and Meta credentials.", success]).catch(() => undefined);
}

export async function getMetaOrderDelivery(orderId: string) {
  const [row, settings] = await Promise.all([
    selectOne<RowDataPacket>(`SELECT o.source, o.payment_status, o.paid_at, c.stripe_mode, d.*, m.order_id AS context_id,
      m.server_enabled, m.pixel_id AS context_pixel, m.test_event_code AS context_test,
      consent.granted = 1 AND consent.expires_at > CURRENT_TIMESTAMP(3) AS consent_valid
      FROM orders o LEFT JOIN stripe_checkouts c ON c.order_id = o.id LEFT JOIN meta_order_diagnostics d ON d.order_id = o.id
      LEFT JOIN meta_order_contexts m ON m.order_id = o.id LEFT JOIN meta_consents consent ON consent.id = m.consent_id WHERE o.id = ?`, [orderId]),
    getMetaSettings(),
  ]);
  if (!row) return null;
  const job = await selectOne<RowDataPacket>("SELECT status, attempts, last_error, last_attempt_at, sent_at, test_event_code, created_at FROM meta_event_jobs WHERE event_name = 'Purchase' AND event_id = ? ORDER BY id DESC LIMIT 1", [purchaseEventId(orderId)]);
  const timestamp = (value: unknown) => value ? new Date(String(value)) : null;
  const testMode = job ? Boolean(job.test_event_code) : row.delivery_status ? Boolean(row.test_mode) : Boolean(row.context_test);
  const status = metaDeliveryStatus({ source: row.source, paymentStatus: row.payment_status, stripeMode: row.stripe_mode,
    captureReason: row.capture_reason, hasContext: Boolean(row.context_id),
    serverEnabled: Boolean(row.server_enabled), settingsMatch: row.context_pixel === settings.pixelId && row.context_test === settings.testEventCode,
    consentValid: Boolean(row.consent_valid), capiEnabled: capiReady(settings), testMode,
    status: job?.status ?? row.delivery_status, error: job?.last_error ?? row.last_error, paidAt: timestamp(row.paid_at) });
  return { ...status, testMode, capturedAt: timestamp(row.captured_at), queuedAt: timestamp(job?.created_at),
    lastAttemptAt: timestamp(job?.last_attempt_at ?? row.last_attempt_at), sentAt: timestamp(job?.sent_at ?? row.sent_at), attempts: Number(job?.attempts ?? row.attempts ?? 0) };
}
