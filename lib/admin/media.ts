import { randomUUID } from "node:crypto";
import { mkdir, realpath, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { getMediaStorageRoot, mediaDeliveryUrl, resolveMediaStoragePath, validateMediaFolder } from "@/lib/media/storage";

const MEGABYTE = 1024 * 1024;

const formats = [
  { mime: "image/jpeg", ext: "jpg", type: "image" as const, max: 10 * MEGABYTE, matches: (buffer: Buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  { mime: "image/png", ext: "png", type: "image" as const, max: 10 * MEGABYTE, matches: (buffer: Buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { mime: "image/gif", ext: "gif", type: "image" as const, max: 10 * MEGABYTE, matches: (buffer: Buffer) => ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii")) },
  { mime: "image/webp", ext: "webp", type: "image" as const, max: 10 * MEGABYTE, matches: (buffer: Buffer) => buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "image/avif", ext: "avif", type: "image" as const, max: 10 * MEGABYTE, matches: (buffer: Buffer) => ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii")) && buffer.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/mp4", ext: "mp4", type: "video" as const, max: 75 * MEGABYTE, matches: (buffer: Buffer) => buffer.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/quicktime", ext: "mov", type: "video" as const, max: 75 * MEGABYTE, matches: (buffer: Buffer) => buffer.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/webm", ext: "webm", type: "video" as const, max: 75 * MEGABYTE, matches: (buffer: Buffer) => buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
];

type MediaFormat = (typeof formats)[number];

export interface StoredMediaAsset {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  type: "image" | "video";
  storageKey: string;
  absolutePath: string;
}

interface MediaAssetRow extends RowDataPacket {
  id: string;
  storage_key: string;
  public_url: string;
}

interface ReferenceCountRow extends RowDataPacket {
  reference_count: number | string;
}

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

export function submittedMediaFiles(formData: FormData, fieldName: string): File[] {
  return formData
    .getAll(`${fieldName}Files`)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export function retainedMediaUrls(formData: FormData, fieldName: string): string[] {
  return formData
    .getAll(fieldName)
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readOrder(formData: FormData, fieldName: string): Array<{ kind: "existing"; url: string } | { kind: "new"; index: number }> {
  const raw = formData.get(`${fieldName}Order`);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const order: Array<{ kind: "existing"; url: string } | { kind: "new"; index: number }> = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const candidate = entry as Record<string, unknown>;
      if (candidate.kind === "existing" && typeof candidate.url === "string") order.push({ kind: "existing", url: candidate.url });
      else if (candidate.kind === "new" && Number.isInteger(candidate.index) && Number(candidate.index) >= 0) order.push({ kind: "new", index: Number(candidate.index) });
    }
    return order;
  } catch {
    return [];
  }
}

export function mergeMediaSubmission(
  formData: FormData,
  fieldName: string,
  storedAssets: StoredMediaAsset[],
  allowedExistingUrls: ReadonlySet<string>,
): string[] {
  const retained = retainedMediaUrls(formData, fieldName).filter((url) => allowedExistingUrls.has(url));
  const retainedSet = new Set(retained);
  const order = readOrder(formData, fieldName);
  const merged = order.length
    ? order.flatMap((entry) => {
        if (entry.kind === "existing") return retainedSet.has(entry.url) ? [entry.url] : [];
        return storedAssets[entry.index]?.url ? [storedAssets[entry.index].url] : [];
      })
    : [...retained, ...storedAssets.map((asset) => asset.url)];
  return [...new Set(merged)];
}

async function inspectFile(file: File, expectedType?: "image" | "video"): Promise<{ format: MediaFormat; buffer: Buffer }> {
  if (!file.size) throw new MediaUploadError("One of the selected files is empty.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const format = formats.find((candidate) => candidate.mime === file.type && candidate.matches(buffer));
  if (!format || (expectedType && format.type !== expectedType)) {
    throw new MediaUploadError(expectedType === "image" ? "Choose a valid JPG, PNG, GIF, WebP, or AVIF image." : expectedType === "video" ? "Choose a valid MP4, MOV, or WebM video." : "One of the selected media files is invalid or unsupported.");
  }
  if (file.size > format.max) {
    throw new MediaUploadError(`${format.type === "image" ? "Images" : "Videos"} cannot exceed ${format.max / MEGABYTE} MB each.`);
  }
  return { format, buffer };
}

export async function storeMediaFiles(
  files: File[],
  options: {
    uploadedBy: string | null;
    connection: PoolConnection;
    expectedType?: "image" | "video";
    folder: string;
    altTexts?: Array<string | null>;
    maximumFiles?: number;
  },
): Promise<StoredMediaAsset[]> {
  if (options.maximumFiles !== undefined && files.length > options.maximumFiles) {
    throw new MediaUploadError(`Choose no more than ${options.maximumFiles} files in this media area.`);
  }
  if (files.reduce((total, file) => total + file.size, 0) > 300 * MEGABYTE) {
    throw new MediaUploadError("The selected media exceeds the 300 MB limit for one save.");
  }
  if (!validateMediaFolder(options.folder)) throw new MediaUploadError("The media folder is invalid.");

  const now = new Date();
  const segment = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const directoryTarget = resolveMediaStoragePath(`${options.folder}/${segment}/placeholder`);
  if (!directoryTarget) throw new MediaUploadError("The media storage location is invalid.");
  const directory = path.dirname(/*turbopackIgnore: true*/ directoryTarget);
  await mkdir(directory, { recursive: true });
  const [canonicalRoot, canonicalDirectory] = await Promise.all([realpath(getMediaStorageRoot()), realpath(directory)]);
  const relativeDirectory = path.relative(canonicalRoot, canonicalDirectory);
  if (!relativeDirectory || relativeDirectory.startsWith("..") || path.isAbsolute(relativeDirectory)) {
    throw new MediaUploadError("The media storage location is invalid.");
  }

  const stored: StoredMediaAsset[] = [];
  try {
    for (const [index, file] of files.entries()) {
      const { format, buffer } = await inspectFile(file, options.expectedType);
      const filename = `${randomUUID()}.${format.ext}`;
      const storageKey = `${options.folder}/${segment}/${filename}`;
      const absolutePath = resolveMediaStoragePath(storageKey);
      if (!absolutePath) throw new MediaUploadError("The media storage location is invalid.");
      const publicUrl = mediaDeliveryUrl(randomUUID());
      const safeName = file.name.slice(0, 255) || filename;
      await writeFile(absolutePath, buffer, { flag: "wx" });
      try {
        const result = await executeMutation(
          `INSERT INTO media_assets
             (storage_key, public_url, original_name, mime_type, size_bytes, alt_text, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [storageKey, publicUrl, safeName, format.mime, file.size, options.altTexts?.[index] ?? null, options.uploadedBy],
          options.connection,
        );
        stored.push({ id: String(result.insertId), url: publicUrl, name: safeName, mimeType: format.mime, type: format.type, storageKey, absolutePath });
      } catch (error) {
        await unlink(absolutePath).catch(() => undefined);
        throw error;
      }
    }
    return stored;
  } catch (error) {
    await removeStoredMediaFiles(stored);
    throw error;
  }
}

export async function removeStoredMediaFiles(assets: StoredMediaAsset[]): Promise<void> {
  await Promise.all(assets.map((asset) => unlink(asset.absolutePath).catch(() => undefined)));
}

async function mediaReferenceCount(url: string): Promise<number> {
  const row = await selectOne<ReferenceCountRow>(
    `SELECT
       (SELECT COUNT(*) FROM product_images WHERE url = ?) +
       (SELECT COUNT(*) FROM product_videos WHERE url = ?) +
       (SELECT COUNT(*) FROM product_review_media prm INNER JOIN media_assets review_asset ON review_asset.id = prm.media_asset_id WHERE review_asset.public_url = ?) +
       (SELECT COUNT(*) FROM categories WHERE image_url = ?) +
       (SELECT COUNT(*) FROM collections WHERE image_url = ?) +
       (SELECT COUNT(*) FROM page_sections WHERE JSON_SEARCH(content_json, 'one', ?) IS NOT NULL) +
       (SELECT COUNT(*) FROM site_settings WHERE JSON_SEARCH(value_json, 'one', ?) IS NOT NULL)
       AS reference_count`,
    [url, url, url, url, url, url, url],
  );
  return Number(row?.reference_count ?? 0);
}

export async function cleanupUnreferencedMediaUrls(urls: Iterable<string>): Promise<void> {
  const uniqueUrls = [...new Set(urls)].filter(Boolean);
  if (!uniqueUrls.length) return;
  const placeholders = uniqueUrls.map(() => "?").join(", ");
  const assets = await selectRows<MediaAssetRow>(
    `SELECT CAST(id AS CHAR) AS id, storage_key, public_url FROM media_assets WHERE public_url IN (${placeholders})`,
    uniqueUrls,
  );
  for (const asset of assets) {
    if (await mediaReferenceCount(asset.public_url)) continue;
    const absolutePath = resolveMediaStoragePath(asset.storage_key);
    if (absolutePath) await unlink(absolutePath).catch(() => undefined);
    await executeMutation("DELETE FROM media_assets WHERE id = ?", [asset.id]);
  }
}
