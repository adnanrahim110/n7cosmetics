import { createHash } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectRows } from "../db/query";
import { readSetting } from "./settings";

export async function readSmtpValues(connection?: PoolConnection, lock = false): Promise<Record<string, unknown>> {
  const rows = await selectRows<RowDataPacket & { setting_key: string; value_json: unknown }>(`SELECT setting_key, value_json FROM site_settings WHERE setting_key LIKE 'smtp.%' ORDER BY setting_key${lock ? " FOR UPDATE" : ""}`, [], connection);
  return Object.fromEntries(rows.map((row) => [row.setting_key, readSetting(row.value_json)]));
}

export function settingsRevision(values: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)))).digest("hex");
}

export async function saveEmailSetting(key: string, value: unknown, administratorId: string | null, connection?: PoolConnection): Promise<void> {
  await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public, updated_by) VALUES (?, ?, ?, 0, ?) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), is_public = 0, updated_by = VALUES(updated_by)", [key, key.split(".")[0], JSON.stringify(value), administratorId], connection);
}
