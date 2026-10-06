import { hasDatabaseConfig } from "../env";
import { runMetaWorker } from "./worker";

declare global { var n7MetaDevelopmentWorker: AbortController | undefined; }

export function startMetaDevelopmentWorker(): void {
  if (process.env.NODE_ENV !== "development" || !hasDatabaseConfig() || globalThis.n7MetaDevelopmentWorker) return;
  const controller = new AbortController();
  globalThis.n7MetaDevelopmentWorker = controller;
  void runMetaWorker(controller.signal, { unref: true }).catch(() => {
    controller.abort();
    globalThis.n7MetaDevelopmentWorker = undefined;
    console.error("Local Meta worker stopped. Check database and Meta configuration.");
  });
}
