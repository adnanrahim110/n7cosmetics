import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { z } from "zod";
export interface TikTokDeliveryJob { id: string; name: string; status: string; attempts: number; test: boolean; error: string | null; requestId: string | null; createdAt: string; sentAt: string | null }
export interface TikTokDeliveryStatus { worker: { success: boolean; checkedAt: string } | null; workerRunning: boolean; jobs: TikTokDeliveryJob[] }
export async function getTikTokDeliveryStatus(): Promise<TikTokDeliveryStatus> {
  const [worker, jobs] = await Promise.all([
    selectOne<RowDataPacket & { value_json: unknown }>("SELECT value_json FROM site_settings WHERE setting_key = 'tiktok.worker'"),
    selectRows<RowDataPacket & { id: string; event_name: string; status: string; attempts: number; test_event_code: string; last_error: string | null; request_id: string | null; created_at: Date; sent_at: Date | null }>("SELECT CAST(id AS CHAR) AS id, event_name, status, attempts, test_event_code, last_error, request_id, created_at, sent_at FROM tiktok_event_jobs ORDER BY id DESC LIMIT 30"),
  ]);
  const raw = typeof worker?.value_json === "string" ? JSON.parse(worker.value_json) : worker?.value_json;
  const parsed = z.object({ success: z.boolean(), checkedAt: z.iso.datetime() }).safeParse(raw);
  return { worker: parsed.success ? parsed.data : null, workerRunning: parsed.success && parsed.data.success && Date.now() - Date.parse(parsed.data.checkedAt) < 300000, jobs: jobs.map(row => ({ id: row.id, name: row.event_name, status: row.status, attempts: row.attempts, test: Boolean(row.test_event_code), error: row.last_error, requestId: row.request_id, createdAt: new Date(row.created_at).toISOString(), sentAt: row.sent_at ? new Date(row.sent_at).toISOString() : null })) };
}
export async function getTikTokOrderDelivery(orderId: string) {
  return selectOne<RowDataPacket & { capture_reason: string; status: string | null; attempts: number; last_error: string | null; sent_at: Date | null; test_mode: number; payment_status: string; stripe_mode: string; test_event_code: string | null }>("SELECT d.capture_reason, d.delivery_status AS status, d.attempts, d.last_error, d.sent_at, d.test_mode, o.payment_status, c.stripe_mode, t.test_event_code FROM tiktok_order_diagnostics d JOIN orders o ON o.id = d.order_id JOIN stripe_checkouts c ON c.order_id = o.id LEFT JOIN tiktok_order_contexts t ON t.order_id = d.order_id WHERE d.order_id = ?", [orderId]);
}
export async function syncTikTokOrderDiagnostics(): Promise<void> {
  await executeMutation("UPDATE tiktok_order_diagnostics d JOIN tiktok_event_jobs j ON j.event_name = 'Purchase' AND j.event_id = CONCAT('n7_tiktok_purchase_', d.order_id) SET d.delivery_status = j.status, d.test_mode = (j.test_event_code <> ''), d.attempts = j.attempts, d.sent_at = COALESCE(j.sent_at, d.sent_at), d.last_error = j.last_error");
}
