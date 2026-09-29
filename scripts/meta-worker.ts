import "./load-env";
import { setTimeout } from "node:timers/promises";
import { getPool } from "../lib/db/pool";
import { processMetaQueue } from "../lib/meta/queue";

const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => controller.abort());
async function run() {
  try {
    do {
      try { await processMetaQueue(25); }
      catch { console.error("Meta delivery unavailable; check database, encryption key and Meta settings."); }
      if (process.argv.includes("--once") || controller.signal.aborted) break;
      await setTimeout(10000, undefined, { signal: controller.signal }).catch(() => undefined);
    } while (!controller.signal.aborted);
  } finally { await getPool().end(); }
}
void run();
