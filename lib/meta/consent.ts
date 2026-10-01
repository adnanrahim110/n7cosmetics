import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { hashMetaValue, readCookie } from "./identity";
import { META_CONSENT_COOKIE } from "./shared";
import { clientIpAddress } from "../http/client-ip";

export async function consentGranted(id: string, connection?: PoolConnection): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return false;
  const row = await selectOne<RowDataPacket>(`SELECT granted FROM meta_consents WHERE id = ? AND expires_at > CURRENT_TIMESTAMP(3)${connection ? " FOR UPDATE" : ""}`, [id], connection);
  return Number(row?.granted) === 1;
}
export function consentId(request: Request): string { return readCookie(request, META_CONSENT_COOKIE); }
export async function saveConsent(request: Request, granted: boolean): Promise<string> {
  const previous = consentId(request);
  const id = /^[0-9a-f-]{36}$/.test(previous) ? previous : randomUUID();
  await withTransaction(async connection => {
    await executeMutation("INSERT INTO meta_consents (id, granted, expires_at) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 180 DAY)) ON DUPLICATE KEY UPDATE matching_data_encrypted = IF(granted = 1 AND VALUES(granted) = 1 AND expires_at > CURRENT_TIMESTAMP(3), matching_data_encrypted, NULL), granted = VALUES(granted), updated_at = CURRENT_TIMESTAMP(3), expires_at = VALUES(expires_at)", [id, granted], connection);
    if (!granted) {
      await executeMutation("UPDATE meta_consents SET matching_data_encrypted = NULL WHERE id = ?", [id], connection);
      await executeMutation("UPDATE meta_event_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'Marketing consent withdrawn' WHERE consent_id = ? AND status IN ('PENDING','PROCESSING','FAILED')", [id], connection);
      await executeMutation("UPDATE meta_order_diagnostics d JOIN meta_order_contexts m ON m.order_id = d.order_id SET d.capture_reason = 'CONSENT_WITHDRAWN', d.updated_at = CURRENT_TIMESTAMP(3) WHERE m.consent_id = ?", [id], connection);
      await executeMutation("DELETE FROM meta_order_contexts WHERE consent_id = ?", [id], connection);
    }
  });
  return id;
}
export async function allowMetaRequest(request: Request, limit = 120): Promise<boolean> {
  const ip = clientIpAddress(request.headers) ?? "unknown";
  const bucket = hashMetaValue(`${ip}:${Math.floor(Date.now() / 60000)}`);
  await executeMutation("INSERT INTO meta_rate_limits (bucket, expires_at) VALUES (?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 2 MINUTE)) ON DUPLICATE KEY UPDATE hits = hits + 1", [bucket]);
  const row = await selectOne<RowDataPacket>("SELECT hits FROM meta_rate_limits WHERE bucket = ?", [bucket]);
  return Number(row?.hits) <= limit;
}
