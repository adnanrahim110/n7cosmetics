import type { RowDataPacket } from "mysql2/promise";
import { selectOne, selectRows } from "../db/query";
import { getCatalogSnapshot } from "./catalog-data";
import { catalogReady, getMetaCatalogSettings } from "./catalog-settings";
import { getCatalogRemoteSummary, type CatalogRemoteSummary } from "./catalog-remote-status";

export interface MetaCatalogSummary {
  ready: boolean; enabled: boolean; catalogId: string; name: string | null;
  accessVerified: boolean; eligible: number; excluded: number;
  counts: Record<string, number>; lastScan: string | null; lastSuccess: string | null;
  lastChecked: string | null; error: string | null; workerRecent: boolean;
  issues: { id: string; name: string; message: string; status: string }[];
  remote: CatalogRemoteSummary;
}
const date = (value: Date | string | null) => value ? new Date(value).toISOString() : null;
export async function getMetaCatalogSummary(): Promise<MetaCatalogSummary> {
  const settings = await getMetaCatalogSettings();
  const [snapshot, state, counts, problems, worker] = await Promise.all([
    getCatalogSnapshot(),
    settings.catalogId ? selectOne<RowDataPacket & { catalog_name: string | null; verified_revision: string | null; last_scanned_at: Date | null; last_success_at: Date | null; last_checked_at: Date | null; last_error: string | null }>("SELECT * FROM meta_catalog_state WHERE catalog_id = ?", [settings.catalogId]) : null,
    settings.catalogId ? selectRows<RowDataPacket & { status: string; total: number }>("SELECT status, COUNT(*) AS total FROM meta_catalog_items WHERE catalog_id = ? GROUP BY status", [settings.catalogId]) : [],
    settings.catalogId ? selectRows<RowDataPacket & { retailer_id: string; product_name: string; last_error: string | null; exclusion_reason: string | null; status: string }>("SELECT retailer_id, product_name, last_error, exclusion_reason, status FROM meta_catalog_items WHERE catalog_id = ? AND (status = 'FAILED' OR exclusion_reason IS NOT NULL OR last_error IS NOT NULL) ORDER BY updated_at DESC LIMIT 8", [settings.catalogId]) : [],
    selectOne<RowDataPacket & { fresh: number }>("SELECT checked_at >= DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE) AS fresh FROM meta_worker_health WHERE id = 1"),
  ]);
  const issues = problems.map(row => ({ id: row.retailer_id, name: row.product_name, message: row.last_error || row.exclusion_reason || "Review this catalogue item.", status: row.status }));
  const recorded = new Set(issues.map(issue => issue.id));
  for (const item of snapshot) if (item.error && !recorded.has(item.id) && issues.length < 8) issues.push({ id: item.id, name: item.name, message: item.error, status: "EXCLUDED" });
  return {
    ready: catalogReady(settings), enabled: settings.enabled, catalogId: settings.catalogId, name: state?.catalog_name ?? null,
    accessVerified: state?.verified_revision === settings.revision, eligible: snapshot.filter(item => item.item).length,
    excluded: snapshot.filter(item => item.error).length, counts: Object.fromEntries(counts.map(row => [row.status, Number(row.total)])),
    lastScan: date(state?.last_scanned_at ?? null), lastSuccess: date(state?.last_success_at ?? null), lastChecked: date(state?.last_checked_at ?? null),
    error: state?.last_error ?? null, workerRecent: Boolean(worker?.fresh), issues,
    remote: await getCatalogRemoteSummary(settings, snapshot),
  };
}
