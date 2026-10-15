import { after } from "next/server";
import { processTikTokQueue } from "./queue";
export function kickTikTokQueue(): void {
  after(async () => { await processTikTokQueue(3).catch(() => console.error("TikTok delivery deferred to the worker.")); });
}
