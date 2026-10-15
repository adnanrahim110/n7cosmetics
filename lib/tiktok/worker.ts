import { setTimeout } from "node:timers/promises";
import { executeMutation } from "../db/query";
import { processTikTokQueue } from "./queue";

export async function runTikTokWorker(signal: AbortSignal, options: { once?: boolean; unref?: boolean } = {}): Promise<void> {
  while (!signal.aborted) {
    let success = false;
    try { await processTikTokQueue(25); success = true; }
    catch { console.error("TikTok delivery unavailable; check migrations, credentials and encryption key."); }
    await executeMutation("INSERT INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES ('tiktok.worker', 'tiktok', ?, 0) ON DUPLICATE KEY UPDATE value_json = VALUES(value_json)", [JSON.stringify({ success, checkedAt: new Date().toISOString() })]).catch(() => undefined);
    if (options.once || signal.aborted) break;
    await setTimeout(10000, undefined, { signal, ref: !options.unref }).catch(() => undefined);
  }
}
