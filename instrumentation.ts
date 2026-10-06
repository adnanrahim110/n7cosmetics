export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "development") {
    const { startMetaDevelopmentWorker } = await import("./lib/meta/development-worker");
    startMetaDevelopmentWorker();
  }
}
