import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { selectOne } from "@/lib/db/query";

export const GLOBAL_LOW_STOCK_SETTING_KEY = "inventory.low_stock_threshold";
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

interface InventorySettingRow extends RowDataPacket { value_json: unknown }

function settingNumber(value: unknown): number | null {
  let parsed = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value) as unknown; } catch { parsed = Number(value); }
  }
  const number = Number(parsed);
  return Number.isInteger(number) && number >= 0 && number <= 1_000_000 ? number : null;
}

export async function getGlobalLowStockThreshold(connection?: PoolConnection): Promise<number> {
  const row = await selectOne<InventorySettingRow>(
    "SELECT value_json FROM site_settings WHERE setting_key = ? LIMIT 1",
    [GLOBAL_LOW_STOCK_SETTING_KEY],
    connection,
  );
  return settingNumber(row?.value_json) ?? DEFAULT_LOW_STOCK_THRESHOLD;
}
