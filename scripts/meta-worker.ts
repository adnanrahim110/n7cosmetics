import "./load-env";
import { getPool } from "../lib/db/pool";
import { runMetaWorker } from "../lib/meta/worker";

const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => controller.abort());
async function run() {
  try {
    await runMetaWorker(controller.signal, { once: process.argv.includes("--once") });
  } finally { await getPool().end(); }
}
void run();
