import { setTimeout } from "node:timers/promises";
import { processMetaQueue } from "./queue";
import { processMetaCatalog } from "./catalog-sync";
import { recordMetaWorkerHealth } from "./diagnostics";

export interface MetaWorkerTasks {
  events: () => Promise<number>;
  catalogue: () => Promise<number>;
  health: (success: boolean) => Promise<void>;
  report: (source: "events" | "catalogue") => void;
}
const tasks: MetaWorkerTasks = {
  events: () => processMetaQueue(25), catalogue: processMetaCatalog, health: recordMetaWorkerHealth,
  report: source => console.error(source === "events" ? "Meta delivery unavailable; check database, encryption key and Meta settings." : "Meta catalogue sync unavailable; check migrations and catalogue settings."),
};

export async function runMetaWorker(signal: AbortSignal, options: { once?: boolean; unref?: boolean } = {}, operations: MetaWorkerTasks = tasks): Promise<void> {
  async function poll(work: () => Promise<void>) {
    while (!signal.aborted) {
      await work();
      if (options.once || signal.aborted) break;
      await setTimeout(10000, undefined, { signal, ref: !options.unref }).catch(() => undefined);
    }
  }
  await Promise.all([
    poll(async () => {
      try { await operations.events(); await operations.health(true); }
      catch { await operations.health(false).catch(() => undefined); operations.report("events"); }
    }),
    poll(async () => {
      try { await operations.catalogue(); }
      catch { operations.report("catalogue"); }
    }),
  ]);
}
