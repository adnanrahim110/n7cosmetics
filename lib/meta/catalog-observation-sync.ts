import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { MetaApiError, metaRequest } from "./api";
import { catalogReady, catalogToken, getMetaCatalogSettings } from "./catalog-settings";
import { catalogObservation, metaProductStatusSchema } from "./catalog-observation";

interface ObservationJob extends RowDataPacket { id: string; retailer_id: string; desired_hash: string; desired_payload: unknown }
const pageSchema = z.object({ data: z.array(metaProductStatusSchema), paging: z.object({ next: z.string().optional(), cursors: z.object({ after: z.string().optional() }).optional() }).optional() });
const imageSchema = z.object({ data: z.object({ image_link: z.string() }) });

export async function refreshMetaCatalogObservations(): Promise<number> {
  const settings = await getMetaCatalogSettings();
  if (!catalogReady(settings)) return 0;
  const lease = randomUUID();
  await executeMutation("INSERT IGNORE INTO meta_catalog_remote_checks (catalog_id) VALUES (?)", [settings.catalogId]);
  const claimed = await withTransaction(async connection => {
    const row = await selectOne<RowDataPacket>(`SELECT catalog_id FROM meta_catalog_remote_checks WHERE catalog_id = ?
      AND (next_check_at <= CURRENT_TIMESTAMP(3) OR NOT (configuration_revision <=> ?))
      AND (lease_expires_at IS NULL OR lease_expires_at <= CURRENT_TIMESTAMP(3)) FOR UPDATE`, [settings.catalogId, settings.revision], connection);
    if (!row) return false;
    await executeMutation("UPDATE meta_catalog_remote_checks SET lease_token = ?, lease_expires_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 2 MINUTE) WHERE catalog_id = ?", [lease, settings.catalogId], connection);
    return true;
  });
  if (!claimed) return 0;
  try {
    // Rotate through large catalogues; never query or adopt other data sources.
    const jobs = await selectRows<ObservationJob>(`SELECT CAST(id AS CHAR) AS id, retailer_id, desired_hash, desired_payload FROM meta_catalog_items
      WHERE catalog_id = ? AND operation = 'UPSERT' AND status = 'SYNCED' AND sent_hash = desired_hash
      AND (meta_checked_at IS NULL OR meta_checked_at <= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 SECOND)
        OR NOT (meta_observed_hash <=> desired_hash) OR NOT (JSON_UNQUOTE(JSON_EXTRACT(meta_observation, '$.configurationRevision')) <=> ?))
      ORDER BY meta_checked_at, id LIMIT 100`, [settings.catalogId, settings.revision]);
    if (!jobs.length) {
      await executeMutation("UPDATE meta_catalog_remote_checks SET configuration_revision = ?, next_check_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 30 SECOND) WHERE catalog_id = ? AND lease_token = ?", [settings.revision, settings.catalogId, lease]);
      return 0;
    }
    const token = catalogToken(settings);
    for (let start = 0; start < jobs.length; start += 50) {
      const group = jobs.slice(start, start + 50), wanted = new Set(group.map(job => job.retailer_id));
      const products = new Map<string, z.infer<typeof metaProductStatusSchema>>();
      let cursor: string | undefined, complete = false;
      for (let page = 0; page < 3; page++) {
        const query = new URLSearchParams({ fields: "id,retailer_id,image_url,image_fetch_status,capability_to_review_status,review_status,review_rejection_reasons,errors", filter: JSON.stringify({ retailer_id: { is_any: [...wanted] } }), limit: "100", ...(cursor ? { after: cursor } : {}) });
        const result = pageSchema.parse(await metaRequest(`${settings.catalogId}/products?${query}`, token));
        for (const product of result.data) if (wanted.has(product.retailer_id)) products.set(product.retailer_id, product);
        if (products.size === wanted.size || !result.data.length || !result.paging?.next) { complete = true; break; }
        const next = result.paging.cursors?.after;
        if (!next || next === cursor) break;
        cursor = next;
      }
      if (!complete) throw new MetaApiError("Meta product status pagination was incomplete. The previous results are retained; the check will retry.", true);
      if ((await getMetaCatalogSettings()).revision !== settings.revision) return 0;
      for (const job of group) {
        const payload = imageSchema.parse(typeof job.desired_payload === "string" ? JSON.parse(job.desired_payload) : job.desired_payload);
        const observation = catalogObservation(products.get(job.retailer_id), payload.data.image_link, settings.revision);
        await executeMutation(`UPDATE meta_catalog_items SET meta_observation = ?, meta_observed_hash = ?, meta_checked_at = CURRENT_TIMESTAMP(3)
          WHERE id = ? AND desired_hash = ? AND sent_hash = ? AND status = 'SYNCED' AND operation = 'UPSERT'`, [JSON.stringify(observation), job.desired_hash, job.id, job.desired_hash, job.desired_hash]);
      }
    }
    await executeMutation("UPDATE meta_catalog_remote_checks SET configuration_revision = ?, checked_at = CURRENT_TIMESTAMP(3), last_error = NULL, next_check_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 30 SECOND) WHERE catalog_id = ? AND lease_token = ?", [settings.revision, settings.catalogId, lease]);
    return jobs.length;
  } catch (error) {
    const message = error instanceof MetaApiError ? error.message : "Unable to check Meta product status. Check migration 034 and the saved catalogue credentials.";
    await executeMutation("UPDATE meta_catalog_remote_checks SET configuration_revision = ?, last_error = ?, next_check_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 60 SECOND) WHERE catalog_id = ? AND lease_token = ?", [settings.revision, message, settings.catalogId, lease]);
    return 0;
  } finally {
    await executeMutation("UPDATE meta_catalog_remote_checks SET lease_token = NULL, lease_expires_at = NULL WHERE catalog_id = ? AND lease_token = ?", [settings.catalogId, lease]);
  }
}
