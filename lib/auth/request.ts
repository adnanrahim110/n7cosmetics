import { headers } from "next/headers";
import type { RequestMetadata } from "./types";

function normalizeIp(value: string | null): string {
  const firstAddress = value?.split(",")[0]?.trim();
  return firstAddress && firstAddress.length <= 45 ? firstAddress : "unknown";
}

export async function getRequestMetadata(): Promise<RequestMetadata> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 255) ?? null;
  const ipAddress = normalizeIp(
    requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
  );

  return { ipAddress, userAgent };
}
