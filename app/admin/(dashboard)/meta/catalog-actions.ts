"use server";
import { requireAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { encryptSecret } from "@/lib/security/encryption";
import { catalogReady, getMetaCatalogSettings, metaCatalogSettingsSchema } from "@/lib/meta/catalog-settings";
import { processMetaCatalog, requestCatalogSync, verifyMetaCatalog } from "@/lib/meta/catalog-sync";
import { MetaApiError } from "@/lib/meta/api";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

export interface MetaCatalogFormState { error?: string; success?: string; revision?: string }
export async function saveMetaCatalogSettings(_previous: MetaCatalogFormState, form: FormData): Promise<MetaCatalogFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  const parsed = metaCatalogSettingsSchema.safeParse({ catalogId: String(form.get("catalogId") ?? ""), enabled: form.get("catalogEnabled") === "on", accessToken: String(form.get("catalogToken") ?? ""), clearToken: form.get("clearCatalogToken") === "on", revision: String(form.get("revision") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues.map(issue => issue.message).join(" ") };
  try {
    const value = parsed.data;
    const saved = await withTransaction(async connection => {
      await executeMutation("INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES ('meta.catalog.configuration', 'meta', '{}', 0)", [], connection);
      await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'meta.catalog.configuration' FOR UPDATE", [], connection);
      const current = await getMetaCatalogSettings(connection);
      if (current.revision !== value.revision) throw new Error("changed");
      const next = { catalogId: value.catalogId, enabled: value.enabled, tokenEncrypted: value.clearToken ? "" : value.accessToken ? encryptSecret(value.accessToken) : current.tokenEncrypted };
      // Never reuse a token for a different catalogue without an explicit choice.
      if (current.catalogId && current.catalogId !== next.catalogId && !value.accessToken) next.tokenEncrypted = "";
      await executeMutation("UPDATE site_settings SET value_json = ?, is_public = 0, updated_by = ? WHERE setting_key = 'meta.catalog.configuration'", [JSON.stringify(next), admin.id], connection);
      if (next.catalogId) await executeMutation(`INSERT INTO meta_catalog_state (catalog_id, force_sync) VALUES (?, 1)
        ON DUPLICATE KEY UPDATE verified_revision = NULL, force_sync = 1, next_run_at = CURRENT_TIMESTAMP(3), last_error = NULL`, [next.catalogId], connection);
      await writeAuditLog({ administratorId: admin.id, action: "META_CATALOG_SETTINGS_UPDATE", entityType: "site_settings", entityId: "meta.catalog.configuration", summary: "Updated Meta catalogue connection", metadata: { enabled: next.enabled, catalogId: next.catalogId } }, connection);
      return getMetaCatalogSettings(connection);
    });
    after(() => processMetaCatalog().catch(() => console.error("Catalogue sync deferred to the Meta worker.")));
    revalidatePath("/admin/meta");
    return { success: "Catalogue settings saved. Automatic sync starts when the ID, token and enabled connection are ready.", revision: saved.revision };
  } catch (error) {
    return { error: error instanceof Error && error.message === "changed" ? "Catalogue settings changed in another session. Reload before saving." : "Unable to save catalogue settings. Check migration 033 and the application encryption key." };
  }
}
export async function controlMetaCatalog(_previous: MetaCatalogFormState, form: FormData): Promise<MetaCatalogFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  const kind = form.get("kind");
  if (kind !== "check" && kind !== "sync") return { error: "Choose a catalogue action." };
  const settings = await getMetaCatalogSettings();
  if (!catalogReady(settings)) return { error: "Save a catalogue ID and token, and enable automatic sync first." };
  try {
    if (kind === "check") {
      const name = await verifyMetaCatalog(settings);
      await withTransaction(async connection => {
        await selectOne("SELECT setting_key FROM site_settings WHERE setting_key = 'meta.catalog.configuration' FOR UPDATE", [], connection);
        if ((await getMetaCatalogSettings(connection)).revision !== settings.revision) throw new Error("changed");
        await executeMutation(`INSERT INTO meta_catalog_state (catalog_id, catalog_name, verified_revision, last_checked_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP(3))
          ON DUPLICATE KEY UPDATE catalog_name = VALUES(catalog_name), verified_revision = VALUES(verified_revision), last_checked_at = VALUES(last_checked_at), last_error = NULL, next_run_at = CURRENT_TIMESTAMP(3)`, [settings.catalogId, name, settings.revision], connection);
      });
    } else {
      await requestCatalogSync(settings);
      after(() => processMetaCatalog().catch(() => console.error("Catalogue sync deferred to the Meta worker.")));
    }
    await writeAuditLog({ administratorId: admin.id, action: "META_CATALOG_CONTROL", entityType: "meta_catalog", entityId: settings.catalogId, summary: kind === "check" ? "Checked catalogue read access" : "Requested catalogue reconciliation" });
    revalidatePath("/admin/meta");
    return { success: kind === "check" ? "Catalogue read access verified. Write access is confirmed when Meta processes the first product batch." : "Full sync requested, including retrying failed items. Progress updates automatically below." };
  } catch (error) {
    return { error: error instanceof MetaApiError ? error.message : error instanceof Error && error.message === "changed" ? "Settings changed during this check. Run it again for the saved connection." : "Catalogue action unavailable. Check the database and saved credentials." };
  }
}
