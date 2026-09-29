import { META_API_VERSION } from "./shared";

export class MetaApiError extends Error {
  constructor(message: string, public retryable: boolean) { super(message); }
}
export async function metaRequest(path: string, token: string, body?: unknown): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${path}`, {
      method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(10000), redirect: "error",
    });
  } catch { throw new MetaApiError("Meta could not be reached. Delivery will retry automatically.", true); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const code = Number(data.error?.code);
    const retryable = response.status === 429 || response.status >= 500 || data.error?.is_transient === true || [1, 2, 4, 17, 32, 613].includes(code);
    // Meta error text may echo credentials or customer values. Keep only the numeric code.
    const reason = code === 190 ? "The access token is invalid or expired." : [10, 200, 294].includes(code) ? "The token does not have access to this Meta asset." : retryable ? "Meta is temporarily unavailable or rate limited." : "Meta rejected the request. Check the ID, token and permissions.";
    throw new MetaApiError(`${reason}${Number.isFinite(code) ? ` (Code ${code})` : ""}`, retryable);
  }
  return data;
}
