import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { RowDataPacket } from "mysql2/promise";
import { selectOne } from "@/lib/db/query";
import { getMediaStorageRoot, MEDIA_TOKEN_PATTERN, mediaDeliveryUrl, resolveMediaStoragePath } from "@/lib/media/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

interface MediaDeliveryRow extends RowDataPacket {
  storage_key: string;
  mime_type: string;
  size_bytes: number | string;
}

interface RouteContext { params: Promise<{ token: string }> }
interface ByteRange { start: number; end: number }

function privateError(status: number): Response {
  return new Response(status === 404 ? "Media not found." : "Media is unavailable.", {
    status,
    headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function parseRange(header: string, size: number): ByteRange | null {
  if (header.includes(",")) return null;
  const match = header.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}

async function canonicalMediaPath(storageKey: string): Promise<{ absolutePath: string; size: number } | null> {
  const resolved = resolveMediaStoragePath(storageKey);
  if (!resolved) return null;
  try {
    const [canonicalRoot, canonicalFile, fileStats] = await Promise.all([
      realpath(getMediaStorageRoot()),
      realpath(resolved),
      stat(resolved),
    ]);
    const relative = path.relative(canonicalRoot, canonicalFile);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative) || !fileStats.isFile()) return null;
    return { absolutePath: canonicalFile, size: fileStats.size };
  } catch {
    return null;
  }
}

async function serveMedia(request: Request, context: RouteContext, headOnly: boolean): Promise<Response> {
  const { token } = await context.params;
  if (!MEDIA_TOKEN_PATTERN.test(token)) return privateError(404);

  let asset: MediaDeliveryRow | null;
  try {
    asset = await selectOne<MediaDeliveryRow>(
      "SELECT storage_key, mime_type, size_bytes FROM media_assets WHERE public_url = ? LIMIT 1",
      [mediaDeliveryUrl(token)],
    );
  } catch (error) {
    console.error("Unable to resolve media", error);
    return privateError(503);
  }
  if (!asset || !supportedMimeTypes.has(asset.mime_type)) return privateError(404);

  const storedFile = await canonicalMediaPath(asset.storage_key);
  if (!storedFile || storedFile.size !== Number(asset.size_bytes)) return privateError(404);
  const etag = `"${token}-${storedFile.size}"`;
  const baseHeaders: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": "inline",
    "Content-Type": asset.mime_type,
    "Cross-Origin-Resource-Policy": "same-site",
    "ETag": etag,
    "X-Content-Type-Options": "nosniff",
  };
  if (!request.headers.get("range") && request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: baseHeaders });
  }

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, storedFile.size);
    if (!range) return new Response(null, { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${storedFile.size}` } });
    const length = range.end - range.start + 1;
    const headers = { ...baseHeaders, "Content-Length": String(length), "Content-Range": `bytes ${range.start}-${range.end}/${storedFile.size}` };
    if (headOnly) return new Response(null, { status: 206, headers });
    const body = Readable.toWeb(createReadStream(storedFile.absolutePath, { start: range.start, end: range.end })) as ReadableStream<Uint8Array>;
    return new Response(body, { status: 206, headers });
  }

  const headers = { ...baseHeaders, "Content-Length": String(storedFile.size) };
  if (headOnly) return new Response(null, { status: 200, headers });
  const body = Readable.toWeb(createReadStream(storedFile.absolutePath)) as ReadableStream<Uint8Array>;
  return new Response(body, { status: 200, headers });
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return serveMedia(request, context, false);
}

export async function HEAD(request: Request, context: RouteContext): Promise<Response> {
  return serveMedia(request, context, true);
}
