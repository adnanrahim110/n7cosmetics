import path from "node:path";
import { getApplicationConfig } from "@/lib/env";

export const MEDIA_URL_PREFIX = "/media";
export const MEDIA_TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const folderPattern = /^[a-z0-9]+(?:\/[a-z0-9-]+)*$/;

export function getMediaStorageRoot(): string {
  const configuredPath = getApplicationConfig().mediaStorageDirectory;
  return path.isAbsolute(configuredPath)
    ? path.resolve(/*turbopackIgnore: true*/ configuredPath)
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), configuredPath);
}

export function validateMediaFolder(folder: string): boolean {
  return folderPattern.test(folder);
}

export function resolveMediaStoragePath(storageKey: string): string | null {
  if (!storageKey || storageKey.includes("\\") || storageKey.includes("\0")) return null;
  const segments = storageKey.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  const root = getMediaStorageRoot();
  const resolved = path.resolve(/*turbopackIgnore: true*/ root, ...segments);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return resolved;
}

export function mediaDeliveryUrl(token: string): string {
  if (!MEDIA_TOKEN_PATTERN.test(token)) throw new Error("Invalid media delivery token.");
  return `${MEDIA_URL_PREFIX}/${token}`;
}
