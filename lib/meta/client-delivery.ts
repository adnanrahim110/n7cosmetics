import type { MetaBrowserEvent } from "./shared";

// Retry the same event ID so an acknowledged request with a lost response cannot duplicate CAPI.
export async function deliverMetaClientEvent(
  body: string,
  active: () => boolean,
  request: typeof fetch = fetch,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
): Promise<MetaBrowserEvent | undefined> {
  for (let attempt = 0; attempt < 3 && active(); attempt++) {
    if (attempt) await pause(attempt === 1 ? 500 : 1500);
    if (!active()) return;
    try {
      const response = await request("/api/meta/events", {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
        keepalive: true, signal: AbortSignal.timeout(8000),
      });
      if (!active()) return;
      if (response.status === 200) return await response.json() as MetaBrowserEvent;
      if (response.status !== 429 && response.status < 500) return;
    } catch { /* Network/response failures can retry while consent still applies. */ }
  }
}
