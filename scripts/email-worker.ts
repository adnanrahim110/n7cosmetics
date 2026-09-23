import "./load-env";
import { setTimeout } from "node:timers/promises";
import { getPool } from "../lib/db/pool";
import { processEmailQueue } from "../lib/email/queue";
import { enqueueLowStockAlerts } from "../lib/email/alerts";

let stopping = false;
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => { stopping = true; controller.abort(); });

async function run() {
  try {
    do {
      try { await enqueueLowStockAlerts(); }
      catch (error) { console.error("Low-stock email check:", error instanceof Error ? error.message : "Inventory check failed."); }
      try { const count = await processEmailQueue(10); if (count) console.log(`Processed ${count} N7 email jobs.`); }
      catch (error) { console.error("Email worker:", error instanceof Error ? error.message : "Delivery check failed."); }
      if (process.argv.includes("--once") || stopping) break;
      await setTimeout(30_000, undefined, { signal: controller.signal }).catch(() => undefined);
    } while (!stopping);
  } finally { await getPool().end(); }
}
void run();
