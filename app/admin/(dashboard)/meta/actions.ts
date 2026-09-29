"use server";
import { writeAuditLog } from "@/lib/auth/audit";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { MetaApiError, metaRequest } from "@/lib/meta/api";
import { makeMetaEvent } from "@/lib/meta/events";
import { hashMetaValue } from "@/lib/meta/identity";
import {
  capiReady,
  getMetaSettings,
  metaToken,
  reportingReady,
} from "@/lib/meta/settings";
import { metaSettingsSchema } from "@/lib/meta/shared";
import { encryptSecret } from "@/lib/security/encryption";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

export interface MetaFormState {
  error?: string;
  success?: string;
  revision?: string;
}
export async function saveMetaSettings(
  _previous: MetaFormState,
  form: FormData,
): Promise<MetaFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  const value = (key: string) => String(form.get(key) ?? "");
  const checked = (key: string) => form.get(key) === "on";
  const parsed = metaSettingsSchema.safeParse({
    pixelId: value("pixelId"),
    pixelEnabled: checked("pixelEnabled"),
    capiEnabled: checked("capiEnabled"),
    adAccountId: value("adAccountId"),
    reportingEnabled: checked("reportingEnabled"),
    testEventCode: value("testEventCode"),
    capiToken: value("capiToken"),
    reportingToken: value("reportingToken"),
    clearCapiToken: checked("clearCapiToken"),
    clearReportingToken: checked("clearReportingToken"),
    revision: value("revision"),
  });
  if (!parsed.success) {
    const labels: Record<string, string> = {
      pixelId: "Pixel / dataset ID",
      adAccountId: "Ad account ID",
      capiToken: "Conversions API token",
      reportingToken: "Reporting token",
      testEventCode: "Test Events code",
      revision: "Settings version",
    };
    return {
      error: parsed.error.issues
        .map(
          (issue) =>
            `${labels[String(issue.path[0])] ?? "Settings"}: ${issue.message}`,
        )
        .join(" "),
    };
  }
  const p = parsed.data;
  try {
    await withTransaction(async (connection) => {
      await selectOne(
        "SELECT setting_key FROM site_settings WHERE setting_key = 'meta.configuration' FOR UPDATE",
        [],
        connection,
      );
      const current = await getMetaSettings(connection);
      if (current.revision !== p.revision) throw new Error("changed");
      const next = {
        pixelId: p.pixelId,
        pixelEnabled: p.pixelEnabled,
        capiEnabled: p.capiEnabled,
        adAccountId: p.adAccountId,
        reportingEnabled: p.reportingEnabled,
        testEventCode: p.testEventCode,
        capiTokenEncrypted: p.clearCapiToken
          ? ""
          : p.capiToken
            ? encryptSecret(p.capiToken)
            : current.capiTokenEncrypted,
        reportingTokenEncrypted: p.clearReportingToken
          ? ""
          : p.reportingToken
            ? encryptSecret(p.reportingToken)
            : current.reportingTokenEncrypted,
      };
      await executeMutation(
        "INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES ('meta.configuration', 'meta', ?, 0, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), is_public = 0, updated_by = VALUES(updated_by)",
        [JSON.stringify(next), admin.id],
        connection,
      );
      // Never reroute an already captured event to another dataset or from test to live.
      if (
        current.pixelId !== next.pixelId ||
        current.testEventCode !== next.testEventCode ||
        !next.capiEnabled ||
        p.clearCapiToken
      ) {
        await executeMutation(
          "UPDATE meta_event_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'Meta settings changed' WHERE status IN ('PENDING','PROCESSING')",
          [],
          connection,
        );
      }
      await executeMutation(
        "DELETE FROM site_settings WHERE setting_key LIKE 'meta.check.%'",
        [],
        connection,
      );
      await writeAuditLog(
        {
          administratorId: admin.id,
          action: "META_SETTINGS_UPDATE",
          entityType: "site_settings",
          entityId: "meta.configuration",
          summary: "Updated Meta integration settings",
          metadata: {
            pixelEnabled: next.pixelEnabled,
            capiEnabled: next.capiEnabled,
            reportingEnabled: next.reportingEnabled,
          },
        },
        connection,
      );
    });
    revalidatePath("/admin/meta");
    return {
      success:
        "Meta settings saved. Each configured feature applies independently; storefronts refresh their settings within one minute.",
      revision: (await getMetaSettings()).revision,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message === "changed"
          ? "These settings changed in another session. Reload before saving."
          : "Unable to save settings. Check the database migration and application encryption key.",
    };
  }
}

export async function checkMetaConnection(
  _previous: MetaFormState,
  form: FormData,
): Promise<MetaFormState> {
  const admin = await requireAdministrator(["OWNER"]);
  const kind = form.get("kind");
  if (kind !== "capi" && kind !== "reporting")
    return { error: "Choose a connection to check." };
  const s = await getMetaSettings();
  let message: string;
  let success = false;
  try {
    if (kind === "capi") {
      if (!capiReady(s) || !s.testEventCode)
        return {
          error:
            "Save a dataset ID, Conversions API token and Test Events code first. This check only sends a test event.",
        };
      const event = makeMetaEvent(
        "PageView",
        `n7_test_${randomUUID()}`,
        "/",
        {
          external_id: [hashMetaValue(`n7-test-${randomUUID()}`)],
          client_user_agent: "N7 integration check",
        },
        {},
      );
      const result = await metaRequest(
        `${s.pixelId}/events`,
        metaToken(s, "capi"),
        { data: [event], test_event_code: s.testEventCode },
      );
      if (Number(result.events_received) !== 1)
        throw new MetaApiError(
          "Meta did not acknowledge the test event.",
          false,
        );
      message =
        "Meta accepted the server test event. Check Events Manager → Test events to inspect it. This confirms receipt, not attribution or match quality.";
    } else {
      if (!reportingReady(s))
        return {
          error:
            "Save an ad account ID and reporting token, and enable the reporting connection first.",
        };
      await metaRequest(
        `act_${s.adAccountId}/insights?fields=spend,impressions&date_preset=today&limit=1`,
        metaToken(s, "reporting"),
      );
      message =
        "Ad account reporting access verified. Advertising charts will be added with the dashboard phase.";
    }
    success = true;
  } catch (error) {
    message =
      error instanceof MetaApiError
        ? error.message
        : "Unable to decrypt the saved token. Check the application encryption key or replace the token.";
  }
  await withTransaction(async (connection) => {
    await selectOne(
      "SELECT setting_key FROM site_settings WHERE setting_key = 'meta.configuration' FOR UPDATE",
      [],
      connection,
    );
    if ((await getMetaSettings(connection)).revision !== s.revision) return;
    await executeMutation(
      "INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES (?, 'meta', ?, 0, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_by = VALUES(updated_by)",
      [
        `meta.check.${kind}`,
        JSON.stringify({
          success,
          message,
          checkedAt: new Date().toISOString(),
        }),
        admin.id,
      ],
      connection,
    );
    await writeAuditLog(
      {
        administratorId: admin.id,
        action: "META_CONNECTION_CHECK",
        entityType: "site_settings",
        summary: `Checked Meta ${kind} connection: ${success ? "accepted" : "failed"}`,
      },
      connection,
    );
  });
  revalidatePath("/admin/meta");
  return success ? { success: message } : { error: message };
}
