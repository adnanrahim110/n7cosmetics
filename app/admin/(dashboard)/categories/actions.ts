"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { formString, isDatabaseId, nullableFormString, slugify } from "@/lib/admin/form";
import { cleanupUnreferencedMediaUrls, MediaUploadError, mergeMediaSubmission, removeStoredMediaFiles, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const mediaUrlSchema = z.string().max(1000).refine((value) => value.startsWith("/") || z.url().safeParse(value).success);
const categorySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190).refine((value) => value !== "bundles", "Bundles is reserved for the dedicated bundle manager."),
  description: z.string().max(5000).nullable(),
  imageUrl: mediaUrlSchema.nullable(),
  status: z.enum(["ACTIVE", "HIDDEN"]),
  sortOrder: z.number().int().min(-100000).max(100000),
  parentId: z.string().regex(/^[1-9]\d*$/).nullable(),
});

function parseCategory(formData: FormData) {
  const name = formString(formData, "name");
  return categorySchema.safeParse({
    name,
    slug: slugify(formString(formData, "slug") || name),
    description: nullableFormString(formData, "description"),
    imageUrl: null,
    status: formString(formData, "status"),
    sortOrder: Number(formString(formData, "sortOrder")),
    parentId: nullableFormString(formData, "parentId"),
  });
}

interface ExistingCategoryRow extends RowDataPacket { image_url: string | null }

function categorySaveError(error: unknown): "duplicate" | "media" | "save" {
  if (error instanceof MediaUploadError) return "media";
  if (typeof error === "object" && error && "code" in error && error.code === "ER_DUP_ENTRY") return "duplicate";
  console.error("Unable to save category", error);
  return "save";
}

async function audit(categoryId: string, action: string, summary: string): Promise<void> {
  const [administrator, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]);
  await writeAuditLog({ administratorId: administrator.id, action, entityType: "category", entityId: categoryId, summary, ipAddress: metadata.ipAddress });
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseCategory(formData);
  if (!parsed.success) redirect("/admin/categories?error=invalid");
  const category = parsed.data;
  const written: StoredMediaAsset[] = [];
  let categoryId = "";
  let errorCode: "duplicate" | "media" | "save" | null = null;
  try {
    categoryId = await withTransaction(async (connection) => {
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "imageUrl"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "categories/images", altTexts: [`${category.name} category image`], maximumFiles: 1 });
      written.push(...stored);
      const [imageUrl = null] = mergeMediaSubmission(formData, "imageUrl", stored, new Set());
      const result = await executeMutation(
        `INSERT INTO categories (parent_id, name, slug, description, image_url, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [category.parentId, category.name, category.slug, category.description, imageUrl, category.status, category.sortOrder],
        connection,
      );
      return String(result.insertId);
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    errorCode = categorySaveError(error);
  }
  if (errorCode) redirect(`/admin/categories?error=${errorCode}`);
  await audit(categoryId, "CATEGORY_CREATE", `Created category ${category.name}`);
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(categoryId)) return;
  const parsed = parseCategory(formData);
  if (!parsed.success || parsed.data.parentId === categoryId) redirect("/admin/categories?error=invalid");
  const category = parsed.data;
  const written: StoredMediaAsset[] = [];
  let removedUrl: string | null = null;
  let errorCode: "duplicate" | "media" | "save" | null = null;
  try {
    await withTransaction(async (connection) => {
      const existing = await selectOne<ExistingCategoryRow>("SELECT image_url FROM categories WHERE id = ? FOR UPDATE", [categoryId], connection);
      if (!existing) throw new Error("Category not found.");
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "imageUrl"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "categories/images", altTexts: [`${category.name} category image`], maximumFiles: 1 });
      written.push(...stored);
      const allowed = new Set(existing.image_url ? [existing.image_url] : []);
      const [imageUrl = null] = mergeMediaSubmission(formData, "imageUrl", stored, allowed);
      if (existing.image_url && existing.image_url !== imageUrl) removedUrl = existing.image_url;
      await executeMutation(
        `UPDATE categories SET parent_id = ?, name = ?, slug = ?, description = ?, image_url = ?, status = ?, sort_order = ? WHERE id = ?`,
        [category.parentId, category.name, category.slug, category.description, imageUrl, category.status, category.sortOrder, categoryId],
        connection,
      );
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    errorCode = categorySaveError(error);
  }
  if (errorCode) redirect(`/admin/categories?error=${errorCode}`);
  if (removedUrl) await cleanupUnreferencedMediaUrls([removedUrl]).catch((error) => console.error("Unable to remove replaced category media", error));
  await audit(categoryId, "CATEGORY_UPDATE", `Updated category ${category.name}`);
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function setCategoryStatusAction(categoryId: string, nextStatus: "ACTIVE" | "HIDDEN"): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(categoryId) || !categorySchema.shape.status.safeParse(nextStatus).success) return;
  await executeMutation("UPDATE categories SET status = ? WHERE id = ?", [nextStatus, categoryId]);
  await audit(categoryId, "CATEGORY_STATUS_UPDATE", `${nextStatus === "ACTIVE" ? "Activated" : "Hid"} category`);
  revalidatePath("/admin/categories");
}
