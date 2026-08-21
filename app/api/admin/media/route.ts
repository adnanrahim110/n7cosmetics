import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";
import { getApplicationConfig } from "@/lib/env";

const formats = [
  { mime: "image/jpeg", ext: "jpg", type: "image" as const, max: 10 * 1024 * 1024, matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", ext: "png", type: "image" as const, max: 10 * 1024 * 1024, matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  { mime: "image/gif", ext: "gif", type: "image" as const, max: 10 * 1024 * 1024, matches: (b: Buffer) => b.subarray(0, 6).toString("ascii") === "GIF87a" || b.subarray(0, 6).toString("ascii") === "GIF89a" },
  { mime: "image/webp", ext: "webp", type: "image" as const, max: 10 * 1024 * 1024, matches: (b: Buffer) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "image/avif", ext: "avif", type: "image" as const, max: 10 * 1024 * 1024, matches: (b: Buffer) => b.subarray(4, 12).toString("ascii").includes("ftypavif") || b.subarray(4, 12).toString("ascii").includes("ftypavis") },
  { mime: "video/mp4", ext: "mp4", type: "video" as const, max: 75 * 1024 * 1024, matches: (b: Buffer) => b.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/quicktime", ext: "mov", type: "video" as const, max: 75 * 1024 * 1024, matches: (b: Buffer) => b.subarray(4, 8).toString("ascii") === "ftyp" },
  { mime: "video/webm", ext: "webm", type: "video" as const, max: 75 * 1024 * 1024, matches: (b: Buffer) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
];

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function POST(request: Request) {
  const administrator = await getCurrentAdministrator();
  if (!administrator) return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  if (administrator.role !== "OWNER" && administrator.role !== "MANAGER") return NextResponse.json({ error: "You do not have upload permission." }, { status: 403 });
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 76 * 1024 * 1024) return NextResponse.json({ error: "The upload is too large." }, { status: 413 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "Invalid upload." }, { status: 400 }); }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const format = formats.find((candidate) => candidate.mime === file.type && candidate.matches(buffer));
  if (!format) return NextResponse.json({ error: "Unsupported or invalid media file." }, { status: 415 });
  if (file.size > format.max) return NextResponse.json({ error: `${format.type === "image" ? "Images" : "Videos"} cannot exceed ${format.max / 1024 / 1024} MB.` }, { status: 413 });

  const config = getApplicationConfig();
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), config.uploadDirectory);
  const now = new Date();
  const segment = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const directory = path.resolve(/*turbopackIgnore: true*/ root, segment);
  if (directory !== root && !directory.startsWith(`${root}${path.sep}`)) return NextResponse.json({ error: "Invalid upload directory." }, { status: 500 });
  const filename = `${randomUUID()}.${format.ext}`;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ directory, filename), buffer, { flag: "wx" });
  const storageKey = `${segment}/${filename}`;
  const publicUrl = `${config.uploadPublicPath}/${storageKey}`;
  const safeName = file.name.slice(0, 255) || filename;
  const result = await executeMutation(
    "INSERT INTO media_assets (storage_key, public_url, original_name, mime_type, size_bytes, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
    [storageKey, publicUrl, safeName, format.mime, file.size, administrator.id],
  );
  return NextResponse.json({ id: String(result.insertId), url: publicUrl, name: safeName, mimeType: format.mime, type: format.type }, { status: 201 });
}
