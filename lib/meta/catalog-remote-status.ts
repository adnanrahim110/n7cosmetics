import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import { catalogEligibility, catalogImageState, catalogObservationSchema, type CatalogEligibility, type CatalogImageState, type CatalogObservation } from "./catalog-observation";
import type { CatalogSnapshotItem } from "./catalog-data";
import type { MetaCatalogSettings } from "./catalog-settings";

export interface CatalogRemoteItem {
  id: string; name: string; sync: string; checkedAt: string | null; stale: boolean;
  image: CatalogImageState; imageStatus: string | null; adReview: string | null;
  eligibility: CatalogEligibility; issues: CatalogObservation["issues"];
}
export interface CatalogRemoteSummary {
  total: number; checked: number; lastChecked: string | null; error: string | null;
  imagesReady: number; imagesPending: number; imageFailures: number;
  adsEligible: number; adsBlocked: number; adsPending: number; adsUnknown: number;
  items: CatalogRemoteItem[];
}
interface RemoteRow extends RowDataPacket {
  retailer_id: string; status: string; desired_hash: string; sent_hash: string | null;
  meta_observed_hash: string | null; meta_checked_at: Date | null; meta_observation: unknown; fresh: number;
}
export async function getCatalogRemoteSummary(settings: MetaCatalogSettings, snapshot: CatalogSnapshotItem[]): Promise<CatalogRemoteSummary> {
  const [rows, state] = settings.catalogId ? await Promise.all([
    selectRows<RemoteRow>(`SELECT retailer_id,status,desired_hash,sent_hash,meta_observed_hash,meta_checked_at,meta_observation,
      meta_checked_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 2 MINUTE) AS fresh
      FROM meta_catalog_items WHERE catalog_id = ? AND operation = 'UPSERT'`, [settings.catalogId]),
    selectOne<RowDataPacket & { checked_at: Date | null; last_error: string | null; configuration_revision: string | null }>("SELECT checked_at,last_error,configuration_revision FROM meta_catalog_remote_checks WHERE catalog_id = ?", [settings.catalogId]),
  ]) : [[], null];
  const byId = new Map(rows.map(row => [row.retailer_id, row]));
  let checked = 0;
  const items = snapshot.filter(product => product.item).map(product => {
    const row = byId.get(product.id);
    let observation: CatalogObservation | null = null;
    if (row?.meta_observation) {
      try {
        const parsed = catalogObservationSchema.safeParse(typeof row.meta_observation === "string" ? JSON.parse(row.meta_observation) : row.meta_observation);
        if (parsed.success) observation = parsed.data;
      } catch { /* Invalid cached observations are unconfirmed, never approved. */ }
    }
    const current = Boolean(row?.fresh && observation?.configurationRevision === settings.revision && row.status === "SYNCED" && row.sent_hash === row.desired_hash && row.meta_observed_hash === row.desired_hash);
    if (current) checked++;
    const confirmed = current ? observation : null;
    return { id: product.id, name: product.name, sync: row?.status ?? "NOT_QUEUED", checkedAt: row?.meta_checked_at ? new Date(row.meta_checked_at).toISOString() : null, stale: Boolean(observation && !current), image: catalogImageState(confirmed), imageStatus: confirmed?.imageStatus ?? null, adReview: confirmed?.adReview ?? null, eligibility: catalogEligibility(confirmed), issues: confirmed?.issues ?? [] };
  });
  const count = (test: (item: CatalogRemoteItem) => boolean) => items.filter(test).length;
  return {
    total: items.length, checked, lastChecked: state?.configuration_revision === settings.revision && state.checked_at ? new Date(state.checked_at).toISOString() : null,
    error: state?.configuration_revision === settings.revision ? state.last_error : null,
    imagesReady: count(item => item.image === "READY"), imagesPending: count(item => item.image === "PENDING" || item.image === "UNKNOWN"), imageFailures: count(item => item.image === "FAILED"),
    adsEligible: count(item => item.eligibility === "ELIGIBLE"), adsBlocked: count(item => item.eligibility === "BLOCKED"), adsPending: count(item => item.eligibility === "PENDING"), adsUnknown: count(item => item.eligibility === "UNKNOWN"), items,
  };
}
