import "./load-env";
import { setTimeout } from "node:timers/promises";
import { getPool } from "../lib/db/pool";
import { reconcileStripeCheckouts } from "../lib/payments/stripe";

const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => controller.abort());
async function run() {
  try {
    do {
      try { await reconcileStripeCheckouts(); }
      catch { console.error("Payment reconciliation unavailable; check Stripe settings in admin."); }
      if (process.argv.includes("--once") || controller.signal.aborted) break;
      await setTimeout(30_000, undefined, { signal: controller.signal }).catch(() => undefined);
    } while (!controller.signal.aborted);
  } finally { await getPool().end(); }
}
void run();
