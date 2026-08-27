"use server";

import type { RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString, isDatabaseId, nullableFormString, slugify } from "@/lib/admin/form";
import { cleanupUnreferencedMediaUrls, MediaUploadError, mergeMediaSubmission, removeStoredMediaFiles, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const mediaUrlSchema = z.string().max(1000).refine((value) => value.startsWith("/") || z.url().safeParse(value).success);
const collectionSchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190).refine((value) => value !== "bundles", "Bundles is reserved for the dedicated bundle manager."),
  description: z.string().max(10000).nullable(),
  imageUrl: mediaUrlSchema.nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  sortOrder: z.number().int().min(-100000).max(100000),
  seoTitle: z.string().max(190).nullable(),
  seoDescription: z.string().max(320).nullable(),
});

interface ExistingCollectionRow extends RowDataPacket { image_url: string | null }

function parseCollection(formData: FormData) {
  const name = formString(formData, "name");
  return collectionSchema.safeParse({
    name,
    slug: slugify(formString(formData, "slug") || name),
    description: nullableFormString(formData, "description"),
    imageUrl: null,
    status: formString(formData, "status"),
    sortOrder: Number(formString(formData, "sortOrder")),
    seoTitle: nullableFormString(formData, "seoTitle"),
    seoDescription: nullableFormString(formData, "seoDescription"),
  });
}

async function audit(id: string, action: string, summary: string): Promise<void> {
  const [administrator, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]);
  await writeAuditLog({ administratorId: administrator.id, action, entityType: "collection", entityId: id, summary, ipAddress: metadata.ipAddress });
}

function collectionSaveError(error: unknown): "duplicate" | "media" | "save" {
  if (error instanceof MediaUploadError) return "media";
  if (typeof error === "object" && error && "code" in error && error.code === "ER_DUP_ENTRY") return "duplicate";
  console.error("Unable to save collection", error);
  return "save";
}

export async function createCollectionAction(formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseCollection(formData);
  if (!parsed.success) redirect("/admin/collections?error=invalid");
  const item = parsed.data;
  const written: StoredMediaAsset[] = [];
  let collectionId = "";
  let errorCode: "duplicate" | "media" | "save" | null = null;
  try {
    collectionId = await withTransaction(async (connection) => {
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "imageUrl"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "collections/images", altTexts: [`${item.name} collection image`], maximumFiles: 1 });
      written.push(...stored);
      const [imageUrl = null] = mergeMediaSubmission(formData, "imageUrl", stored, new Set());
      const result = await executeMutation(
        `INSERT INTO collections (name, slug, description, image_url, status, sort_order, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.name, item.slug, item.description, imageUrl, item.status, item.sortOrder, item.seoTitle, item.seoDescription],
        connection,
      );
      return String(result.insertId);
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    errorCode = collectionSaveError(error);
  }
  if (errorCode) redirect(`/admin/collections?error=${errorCode}`);
  await audit(collectionId, "COLLECTION_CREATE", `Created collection ${item.name}`);
  revalidatePath("/admin/collections");
  revalidatePath("/collections");
  redirect("/admin/collections?saved=1");
}

export async function updateCollectionAction(id: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(id)) return;
  const parsed = parseCollection(formData);
  if (!parsed.success) redirect("/admin/collections?error=invalid");
  const item = parsed.data;
  const written: StoredMediaAsset[] = [];
  let removedUrl: string | null = null;
  let errorCode: "duplicate" | "media" | "save" | null = null;
  try {
    await withTransaction(async (connection) => {
      const existing = await selectOne<ExistingCollectionRow>("SELECT image_url FROM collections WHERE id = ? FOR UPDATE", [id], connection);
      if (!existing) throw new Error("Collection not found.");
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "imageUrl"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "collections/images", altTexts: [`${item.name} collection image`], maximumFiles: 1 });
      written.push(...stored);
      const allowed = new Set(existing.image_url ? [existing.image_url] : []);
      const [imageUrl = null] = mergeMediaSubmission(formData, "imageUrl", stored, allowed);
      if (existing.image_url && existing.image_url !== imageUrl) removedUrl = existing.image_url;
      await executeMutation(
        `UPDATE collections SET name = ?, slug = ?, description = ?, image_url = ?, status = ?, sort_order = ?, seo_title = ?, seo_description = ? WHERE id = ?`,
        [item.name, item.slug, item.description, imageUrl, item.status, item.sortOrder, item.seoTitle, item.seoDescription, id],
        connection,
      );
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    errorCode = collectionSaveError(error);
  }
  if (errorCode) redirect(`/admin/collections?error=${errorCode}`);
  if (removedUrl) await cleanupUnreferencedMediaUrls([removedUrl]).catch((error) => console.error("Unable to remove replaced collection media", error));
  await audit(id, "COLLECTION_UPDATE", `Updated collection ${item.name}`);
  revalidatePath("/admin/collections");
  revalidatePath(`/collections/${item.slug}`);
  redirect("/admin/collections?saved=1");
}

export async function setCollectionStatusAction(id: string, nextStatus: "DRAFT" | "ARCHIVED"): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(id) || !collectionSchema.shape.status.safeParse(nextStatus).success) return;
  await executeMutation("UPDATE collections SET status = ? WHERE id = ?", [nextStatus, id]);
  await audit(id, "COLLECTION_STATUS_UPDATE", `${nextStatus === "ARCHIVED" ? "Archived" : "Restored"} collection`);
  revalidatePath("/admin/collections");
}
