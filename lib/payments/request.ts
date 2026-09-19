import { getApplicationConfig } from "../env";

export function isPaymentRequestOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  // Behind Traefik request.url can contain the container's internal origin.
  const allowed = new Set([new URL(getApplicationConfig().appUrl).origin]);
  if (process.env.NODE_ENV !== "production") allowed.add(new URL(request.url).origin);
  return allowed.has(origin);
}
