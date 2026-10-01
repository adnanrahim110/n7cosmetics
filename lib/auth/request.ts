import { headers } from "next/headers";
import type { RequestMetadata } from "./types";
import { clientIpAddress } from "../http/client-ip";

export async function getRequestMetadata(): Promise<RequestMetadata> {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 255) ?? null;
  const ipAddress = clientIpAddress(requestHeaders) ?? "unknown";

  return { ipAddress, userAgent };
}
