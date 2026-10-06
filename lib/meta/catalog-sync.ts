import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { metaRequest, MetaApiError } from "./api";
import { catalogReady, catalogToken, getMetaCatalogSettings, type MetaCatalogSettings } from "./catalog-settings";
import { getCatalogSnapshot } from "./catalog-data";
import { catalogBatchHandlesSchema, catalogBatchStatus, catalogDeleteRequest, catalogItemSchema, catalogPayloadHash, type CatalogRequest } from "./catalog-product";

interface CatalogState extends RowDataPacket {
  verified_revision: string | null; last_scanned_at: Date | null; last_full_sync_at: Date | null; force_sync: number;
}
interface CatalogJob extends RowDataPacket {
  id: string; retailer_id: string; product_name: string; desired_hash: string; sent_hash: string | null;
  desired_payload: unknown; request_handle: string | null; submitted_hash: string | null;
  submitted_at: Date | null; status: string; operation: "UPSERT" | "DELETE"; exclusion_reason: string | null; attempts: number;
}
const requestSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("UPDATE"), data: catalogItemSchema }),
  z.object({ method: z.literal("DELETE"), data: z.object({ id: z.string().regex(/^n7_variant_[1-9]\d*$/) }) }),
]);
const safeError = (error: unknown) => error instanceof MetaApiError ? error.message : "Catalogue sync unavailable. Check database migrations, APP_URL and the encryption key.";

export async function verifyMetaCatalog(settings: MetaCatalogSettings): Promise<string> {
  const result = await metaRequest(`${settings.catalogId}?fields=id,name,vertical`, catalogToken(settings));
  const parsed = z.object({ id: z.string(), name: z.string(), vertical: z.string().optional() }).safeParse(result);
  if (!parsed.success || parsed.data.id !== settings.catalogId) throw new MetaApiError("Meta did not return the configured catalogue. Check its ID and asset access.", false);
  if (parsed.data.vertical && !["commerce", "generic"].includes(parsed.data.vertical)) throw new MetaApiError("Choose an ecommerce product catalogue for N7’s products.", false);
  return parsed.data.name.slice(0, 190);
}
export async function requestCatalogSync(settings: MetaCatalogSettings): Promise<void> {
  if (!/^\d{5,30}$/.test(settings.catalogId)) return;
  await executeMutation(`INSERT INTO meta_catalog_state (catalog_id, force_sync) VALUES (?, 1)
    ON DUPLICATE KEY UPDATE force_sync = 1, next_run_at = CURRENT_TIMESTAMP(3)`, [settings.catalogId]);
}

async function reconcile(settings: MetaCatalogSettings, full: boolean): Promise<void> {
  // Finish both queries before changing anything: a failed scan never deletes items.
  const [snapshot, previous] = await Promise.all([
    getCatalogSnapshot(), selectRows<CatalogJob>("SELECT * FROM meta_catalog_items WHERE catalog_id = ?", [settings.catalogId]),
  ]);
  const byId = new Map(previous.map(row => [row.retailer_id, row]));
  const seen = new Set<string>();
  for (const product of snapshot) {
    seen.add(product.id);
    const old = byId.get(product.id);
    const request: CatalogRequest = product.item ? { method: "UPDATE", data: product.item } : catalogDeleteRequest(product.id);
    const hash = catalogPayloadHash(request);
    const remotePossible = Boolean(old?.sent_hash || old?.submitted_hash || old?.request_handle);
    const excluded = !product.item && !remotePossible;
    if (old?.desired_hash === hash && old.product_name === product.name && old.exclusion_reason === (product.error ?? null) && !(full && product.item)) continue;
    await executeMutation(`INSERT INTO meta_catalog_items (catalog_id, retailer_id, product_name, operation, desired_payload, desired_hash, status, exclusion_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE product_name = VALUES(product_name), operation = VALUES(operation),
      desired_payload = VALUES(desired_payload), desired_hash = VALUES(desired_hash), exclusion_reason = VALUES(exclusion_reason),
      status = IF(status IN ('PROCESSING','SUBMITTED'), status, VALUES(status)), attempts = IF(status IN ('PROCESSING','SUBMITTED'), attempts, 0),
      next_attempt_at = CURRENT_TIMESTAMP(3), last_error = NULL`,
    [settings.catalogId, product.id, product.name, product.item ? "UPSERT" : "DELETE", JSON.stringify(request), hash, excluded ? "EXCLUDED" : "QUEUED", product.error ?? null]);
  }
  for (const old of previous) {
    if (seen.has(old.retailer_id) || old.operation === "DELETE") continue;
    const request = catalogDeleteRequest(old.retailer_id);
    // Only IDs previously managed by this integration are ever deleted.
    await executeMutation(`UPDATE meta_catalog_items SET operation = 'DELETE', desired_payload = ?, desired_hash = ?, exclusion_reason = NULL,
      status = IF(status IN ('PROCESSING','SUBMITTED'), status, 'QUEUED'), attempts = 0, next_attempt_at = CURRENT_TIMESTAMP(3), last_error = NULL WHERE id = ?`,
    [JSON.stringify(request), catalogPayloadHash(request), old.id]);
  }
}

async function failJobs(jobs: CatalogJob[], error: unknown): Promise<void> {
  for (const job of jobs) {
    const retry = error instanceof MetaApiError && error.retryable && job.attempts < 8;
    await executeMutation(`UPDATE meta_catalog_items SET status = IF(desired_hash <> submitted_hash, 'QUEUED', ?),
      last_error = ?, request_handle = NULL, submitted_at = NULL, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND)
      WHERE id = ? AND submitted_hash = ?`,
    [retry ? "QUEUED" : "FAILED", safeError(error), retry ? Math.min(3600, 30 * 2 ** Math.min(job.attempts - 1, 7)) : 0, job.id, job.submitted_hash]);
  }
}
async function confirmBatches(settings: MetaCatalogSettings): Promise<number> {
  const handles = await selectRows<RowDataPacket & { request_handle: string }>(`SELECT DISTINCT request_handle FROM meta_catalog_items
    WHERE catalog_id = ? AND status = 'SUBMITTED' AND next_attempt_at <= CURRENT_TIMESTAMP(3) AND request_handle IS NOT NULL LIMIT 2`, [settings.catalogId]);
  let confirmed = 0;
  for (const { request_handle: handle } of handles) {
    if ((await getMetaCatalogSettings()).revision !== settings.revision) break;
    const jobs = await selectRows<CatalogJob>("SELECT * FROM meta_catalog_items WHERE catalog_id = ? AND request_handle = ? AND status = 'SUBMITTED'", [settings.catalogId, handle]);
    try {
      let remaining = catalogBatchHandlesSchema.parse(JSON.parse(handle));
      // Meta can return multiple handles. Persist unfinished handles and bound
      // polling work so a large receipt cannot outlive the catalogue lease.
      for (const current of remaining.slice(0, 2)) {
        const params = new URLSearchParams({ handle: current, fields: "handle,status,errors,errors_total_count,ids_of_invalid_requests" });
        const result = await metaRequest(`${settings.catalogId}/check_batch_request_status?${params}`, catalogToken(settings));
        const state = catalogBatchStatus(result, current);
        if (state === "failed") throw new MetaApiError("Meta could not confirm this batch because some items were rejected. Review their required fields and catalogue permissions, then retry sync.", false);
        if (state === "finished") remaining = remaining.filter(value => value !== current);
      }
      if (remaining.length) {
        if (jobs.some(job => job.submitted_at && Date.now() - new Date(job.submitted_at).getTime() > 30 * 60000)) throw new MetaApiError("Meta’s batch confirmation timed out. The same product IDs will retry safely.", true);
        await executeMutation("UPDATE meta_catalog_items SET request_handle = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 15 SECOND) WHERE catalog_id = ? AND request_handle = ? AND status = 'SUBMITTED'", [JSON.stringify(remaining), settings.catalogId, handle]);
        continue;
      }
      await executeMutation(`UPDATE meta_catalog_items SET sent_hash = submitted_hash,
        status = IF(desired_hash <> submitted_hash, 'QUEUED', IF(operation = 'DELETE', IF(exclusion_reason IS NULL, 'DELETED', 'EXCLUDED'), 'SYNCED')),
        synced_at = CURRENT_TIMESTAMP(3), request_handle = NULL, submitted_at = NULL, next_attempt_at = CURRENT_TIMESTAMP(3), last_error = NULL
        WHERE catalog_id = ? AND request_handle = ? AND status = 'SUBMITTED'`, [settings.catalogId, handle]);
      await executeMutation("UPDATE meta_catalog_state SET last_success_at = CURRENT_TIMESTAMP(3), last_error = NULL WHERE catalog_id = ?", [settings.catalogId]);
      confirmed += jobs.length;
    } catch (error) {
      // A polling outage retains the handle; resubmitting before confirmation
      // would obscure whether Meta processed the original batch.
      if (error instanceof MetaApiError && error.retryable && !error.message.includes("timed out")) {
        await executeMutation("UPDATE meta_catalog_items SET last_error = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 60 SECOND) WHERE catalog_id = ? AND request_handle = ? AND status = 'SUBMITTED'", [safeError(error), settings.catalogId, handle]);
      } else await failJobs(jobs, error);
    }
  }
  return confirmed;
}

async function submitBatch(settings: MetaCatalogSettings): Promise<number> {
  const jobs = await withTransaction(async connection => {
    const rows = await selectRows<CatalogJob>(`SELECT * FROM meta_catalog_items WHERE catalog_id = ? AND status = 'QUEUED'
      AND next_attempt_at <= CURRENT_TIMESTAMP(3) ORDER BY id LIMIT 50 FOR UPDATE SKIP LOCKED`, [settings.catalogId], connection);
    for (const job of rows) {
      job.submitted_hash = job.desired_hash; job.attempts++;
      await executeMutation("UPDATE meta_catalog_items SET status = 'PROCESSING', submitted_hash = desired_hash, attempts = ?, next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 3 MINUTE) WHERE id = ?", [job.attempts, job.id], connection);
    }
    return rows;
  });
  if (!jobs.length) return 0;
  try {
    const requests = jobs.map(job => requestSchema.parse(typeof job.desired_payload === "string" ? JSON.parse(job.desired_payload) : job.desired_payload));
    if ((await getMetaCatalogSettings()).revision !== settings.revision) throw new MetaApiError("Catalogue settings changed. Updates will retry with the saved configuration.", true);
    const result = await metaRequest(`${settings.catalogId}/items_batch`, catalogToken(settings), { item_type: "PRODUCT_ITEM", allow_upsert: true, requests });
    const receipt = z.object({ handles: catalogBatchHandlesSchema }).safeParse(result);
    if (!receipt.success) throw new MetaApiError("Meta did not return a batch confirmation handle. Check product fields and retry sync.", false);
    for (const job of jobs) await executeMutation(`UPDATE meta_catalog_items SET status = 'SUBMITTED', request_handle = ?, submitted_at = CURRENT_TIMESTAMP(3),
      next_attempt_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 15 SECOND), last_error = NULL WHERE id = ? AND submitted_hash = ? AND status = 'PROCESSING'`, [JSON.stringify([...new Set(receipt.data.handles)]), job.id, job.submitted_hash]);
    return jobs.length;
  } catch (error) { await failJobs(jobs, error); return 0; }
}

export async function processMetaCatalog(): Promise<number> {
  const settings = await getMetaCatalogSettings();
  if (!catalogReady(settings)) return 0;
  const lease = randomUUID();
  await executeMutation("INSERT IGNORE INTO meta_catalog_state (catalog_id) VALUES (?)", [settings.catalogId]);
  const state = await withTransaction(async connection => {
    const row = await selectOne<CatalogState>(`SELECT * FROM meta_catalog_state WHERE catalog_id = ? AND next_run_at <= CURRENT_TIMESTAMP(3)
      AND (lease_expires_at IS NULL OR lease_expires_at <= CURRENT_TIMESTAMP(3)) FOR UPDATE`, [settings.catalogId], connection);
    if (!row) return null;
    await executeMutation("UPDATE meta_catalog_state SET lease_token = ?, lease_expires_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 3 MINUTE), force_sync = 0 WHERE catalog_id = ?", [lease, settings.catalogId], connection);
    return row;
  });
  if (!state) return 0;
  try {
    if (state.verified_revision !== settings.revision) {
      const name = await verifyMetaCatalog(settings);
      if ((await getMetaCatalogSettings()).revision !== settings.revision) return 0;
      await executeMutation("UPDATE meta_catalog_state SET catalog_name = ?, verified_revision = ?, last_checked_at = CURRENT_TIMESTAMP(3), last_error = NULL WHERE catalog_id = ? AND lease_token = ?", [name, settings.revision, settings.catalogId, lease]);
    }
    // Recover a worker stopped between claiming a job and storing its receipt.
    await executeMutation("UPDATE meta_catalog_items SET status = 'QUEUED' WHERE catalog_id = ? AND status = 'PROCESSING' AND next_attempt_at <= CURRENT_TIMESTAMP(3)", [settings.catalogId]);
    const full = Boolean(state.force_sync) || !state.last_full_sync_at || Date.now() - new Date(state.last_full_sync_at).getTime() >= 86400000;
    if (full || !state.last_scanned_at || Date.now() - new Date(state.last_scanned_at).getTime() >= 30000) {
      await reconcile(settings, full);
      await executeMutation(`UPDATE meta_catalog_state SET last_error = NULL, last_scanned_at = CURRENT_TIMESTAMP(3), last_full_sync_at = IF(?, CURRENT_TIMESTAMP(3), last_full_sync_at) WHERE catalog_id = ? AND lease_token = ?`, [full, settings.catalogId, lease]);
    }
    if (state.force_sync) {
      // Explicit retries include tombstones: deleted products no longer appear
      // in the website snapshot, but their remote removals still need delivery.
      await executeMutation("UPDATE meta_catalog_items SET status = 'QUEUED', attempts = 0, next_attempt_at = CURRENT_TIMESTAMP(3), last_error = NULL WHERE catalog_id = ? AND status = 'FAILED'", [settings.catalogId]);
    }
    const confirmed = await confirmBatches(settings);
    for (let index = 0; index < 2; index++) if (!await submitBatch(settings)) break;
    return confirmed;
  } catch (error) {
    await executeMutation("UPDATE meta_catalog_state SET last_error = ?, next_run_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 60 SECOND), force_sync = IF(?, 1, force_sync) WHERE catalog_id = ? AND lease_token = ?", [safeError(error), Boolean(state.force_sync) || !state.last_scanned_at, settings.catalogId, lease]);
    return 0;
  } finally {
    await executeMutation("UPDATE meta_catalog_state SET lease_token = NULL, lease_expires_at = NULL WHERE catalog_id = ? AND lease_token = ?", [settings.catalogId, lease]);
  }
}
