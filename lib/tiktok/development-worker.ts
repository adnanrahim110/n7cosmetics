import { hasDatabaseConfig } from "../env";
import { runTikTokWorker } from "./worker";
declare global { var n7TikTokDevelopmentWorker: AbortController | undefined; }
export function startTikTokDevelopmentWorker(): void {
  if (process.env.NODE_ENV !== "development" || !hasDatabaseConfig() || globalThis.n7TikTokDevelopmentWorker) return;
  const controller = new AbortController();
  globalThis.n7TikTokDevelopmentWorker = controller;
  void runTikTokWorker(controller.signal, { unref: true }).catch(() => {
    controller.abort(); globalThis.n7TikTokDevelopmentWorker = undefined;
    console.error("Local TikTok worker stopped; check the database and configuration.");
  });
}
