import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import { capiReady, getMetaSettings, metaToken } from "./settings";

export interface MetaDeliveryIssue { id: string; name: string; message: string; attemptedAt: string | null; status: "PENDING" | "PROCESSING" | "FAILED" }
export interface MetaDeliveryHealthSummary {
  worker: { state: "running" | "overdue" | "missing" | "error"; seenAt: string | null; error: string | null };
  waiting: number; failed: number; historyTotal: number; acceptedAt: string | null; credentialError: string | null;
  activeIssues: MetaDeliveryIssue[]; history: MetaDeliveryIssue[]; local: boolean;
}
interface IssueRow extends RowDataPacket { id: string; event_name: string; last_error: string; last_attempt_at: Date | null; status: MetaDeliveryIssue["status"] }
const date = (value: Date | null | undefined): string | null => value ? new Date(value).toISOString() : null;
export async function getMetaDeliveryHealth(): Promise<MetaDeliveryHealthSummary> {
  const settings = await getMetaSettings();
  const [worker, totals, active, history, accepted] = await Promise.all([
    selectOne<RowDataPacket & { checked_at: Date; last_error: string | null; fresh: number }>("SELECT checked_at,last_error,checked_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE) AS fresh FROM meta_worker_health WHERE id=1"),
    selectOne<RowDataPacket & { waiting: number; failed: number; historic: number }>("SELECT SUM(status IN ('PENDING','PROCESSING')) AS waiting,SUM(status='FAILED') AS failed,SUM(status='FAILED' AND (last_attempt_at IS NULL OR last_attempt_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE))) AS historic FROM meta_event_jobs WHERE pixel_id=?", [settings.pixelId]),
    selectRows<IssueRow>("SELECT CAST(id AS CHAR) AS id,event_name,last_error,last_attempt_at,status FROM meta_event_jobs WHERE pixel_id=? AND last_error IS NOT NULL AND (status IN ('PENDING','PROCESSING') OR (status='FAILED' AND last_attempt_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE))) ORDER BY id DESC LIMIT 3", [settings.pixelId]),
    selectRows<IssueRow>("SELECT CAST(id AS CHAR) AS id,event_name,last_error,last_attempt_at,status FROM meta_event_jobs WHERE pixel_id=? AND status='FAILED' AND last_error IS NOT NULL AND (last_attempt_at IS NULL OR last_attempt_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE)) ORDER BY id DESC LIMIT 3", [settings.pixelId]),
    selectOne<RowDataPacket & { sent_at: Date }>("SELECT sent_at FROM meta_event_jobs WHERE pixel_id=? AND status='SENT' AND test_event_code='' ORDER BY sent_at DESC LIMIT 1", [settings.pixelId]),
  ]);
  let credentialError: string | null = null;
  if (capiReady(settings)) {
    try { metaToken(settings, "capi"); }
    catch { credentialError = "The saved Conversions API token cannot be decrypted. Restore the original application encryption key, or save the token again using the current key."; }
  }
  const issue = (row: IssueRow): MetaDeliveryIssue => ({ id: row.id, name: row.event_name, message: row.last_error, attemptedAt: date(row.last_attempt_at), status: row.status });
  return {
    worker: { state: !worker ? "missing" : !worker.fresh ? "overdue" : worker.last_error ? "error" : "running", seenAt: date(worker?.checked_at), error: worker?.last_error ?? null },
    waiting: Number(totals?.waiting ?? 0), failed: Number(totals?.failed ?? 0), historyTotal: Number(totals?.historic ?? 0), acceptedAt: date(accepted?.sent_at), credentialError,
    activeIssues: active.map(issue), history: history.map(issue), local: process.env.NODE_ENV === "development",
  };
}
