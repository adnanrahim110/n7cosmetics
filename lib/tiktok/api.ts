import { TIKTOK_API_URL } from "./shared";

export class TikTokApiError extends Error {
  constructor(message: string, public readonly retryable: boolean) { super(message); }
}
export async function tiktokRequest(token: string, body: unknown): Promise<{ requestId: string }> {
  let response: Response;
  try {
    response = await fetch(TIKTOK_API_URL, { method: "POST", headers: { "Content-Type": "application/json", "Access-Token": token }, body: JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000) });
  } catch { throw new TikTokApiError("TikTok connection unavailable; delivery will retry.", true); }
  const value: unknown = await response.json().catch(() => null);
  const code = value && typeof value === "object" && "code" in value ? value.code : undefined;
  if (!response.ok || code !== 0) {
    const retryable = response.status === 429 || response.status >= 500 || code === 40100 || code === 50000 || code === 50001;
    // Provider messages can echo submitted data or credentials. Keep only codes.
    throw new TikTokApiError(`TikTok rejected the event (HTTP ${response.status}, code ${typeof code === "number" ? code : "unavailable"}).${retryable ? " Delivery will retry." : " Check credentials, pixel permissions and event configuration."}`, retryable);
  }
  const requestId = value && typeof value === "object" && "request_id" in value && typeof value.request_id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value.request_id) ? value.request_id : "";
  return { requestId };
}
