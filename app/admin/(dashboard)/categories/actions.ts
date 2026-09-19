"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { isCategoryCollectionSlug } from "@/lib/commerce/category-config";
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
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
  description: z.string().max(5000).nullable(),
  imageUrl: mediaUrlSchema.nullable(),
  status: z.enum(["ACTIVE", "HIDDEN"]),
  sortOrder: z.number().int().min(-100000).max(100000),
  collectionId: z.string().regex(/^[1-9]\d*$/),
  seoTitle: z.string().max(190).nullable(),
  seoDescription: z.string().max(320).nullable(),
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
    collectionId: formString(formData, "collectionId"),
    seoTitle: nullableFormString(formData, "seoTitle"),
    seoDescription: nullableFormString(formData, "seoDescription"),
  });
}

interface ExistingCategoryRow extends RowDataPacket { image_url: string | null }

class CategoryCollectionError extends Error {}

async function validateCollection(collectionId: string, connection: PoolConnection, categoryId?: string) {
  const collection = await selectOne<RowDataPacket>("SELECT slug FROM collections WHERE id = ? AND status != 'ARCHIVED' FOR UPDATE", [collectionId], connection);
  if (!collection || !isCategoryCollectionSlug(collection.slug)) throw new CategoryCollectionError();
  if (categoryId) {
    const outside = await selectOne<RowDataPacket>(
      `SELECT pc.product_id FROM product_categories pc WHERE pc.category_id = ?
       AND NOT EXISTS (SELECT 1 FROM product_collections pcl WHERE pcl.product_id = pc.product_id AND pcl.collection_id = ?) LIMIT 1`,
      [categoryId, collectionId], connection,
    );
    if (outside) throw new CategoryCollectionError();
  }
}

function refreshCategoryPages() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/pages");
}

function categorySaveError(error: unknown): "duplicate" | "media" | "save" | "collection" {
  if (error instanceof CategoryCollectionError) return "collection";
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
  let errorCode: ReturnType<typeof categorySaveError> | null = null;
  try {
    categoryId = await withTransaction(async (connection) => {
      await validateCollection(category.collectionId, connection);
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "imageUrl"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "categories/images", altTexts: [`${category.name} category image`], maximumFiles: 1 });
      written.push(...stored);
      const [imageUrl = null] = mergeMediaSubmission(formData, "imageUrl", stored, new Set());
      const result = await executeMutation(
        `INSERT INTO categories (collection_id, name, slug, description, image_url, status, sort_order, seo_title, seo_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [category.collectionId, category.name, category.slug, category.description, imageUrl, category.status, category.sortOrder, category.seoTitle, category.seoDescription],
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
  refreshCategoryPages();
  redirect(`/admin/categories?saved=1&edit=${categoryId}#category-form`);
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(categoryId)) return;
  const parsed = parseCategory(formData);
  if (!parsed.success) redirect("/admin/categories?error=invalid");
  const category = parsed.data;
  const written: StoredMediaAsset[] = [];
  let removedUrl: string | null = null;
  let errorCode: ReturnType<typeof categorySaveError> | null = null;
  try {
    await withTransaction(async (connection) => {
      const existing = await selectOne<ExistingCategoryRow>("SELECT image_url FROM categories WHERE id = ? FOR UPDATE", [categoryId], connection);
      if (!existing) throw new Error("Category not found.");
      await validateCollection(category.collectionId, connection, categoryId);
      const stored = await storeMediaFiles(submittedMediaFiles(formData, "imageUrl"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "categories/images", altTexts: [`${category.name} category image`], maximumFiles: 1 });
      written.push(...stored);
      const allowed = new Set(existing.image_url ? [existing.image_url] : []);
      const [imageUrl = null] = mergeMediaSubmission(formData, "imageUrl", stored, allowed);
      if (existing.image_url && existing.image_url !== imageUrl) removedUrl = existing.image_url;
      await executeMutation(
        `UPDATE categories SET collection_id = ?, name = ?, slug = ?, description = ?, image_url = ?, status = ?, sort_order = ?, seo_title = ?, seo_description = ? WHERE id = ?`,
        [category.collectionId, category.name, category.slug, category.description, imageUrl, category.status, category.sortOrder, category.seoTitle, category.seoDescription, categoryId],
        connection,
      );
    });
  } catch (error) {
    await removeStoredMediaFiles(written);
    errorCode = categorySaveError(error);
  }
  if (errorCode) redirect(`/admin/categories?error=${errorCode}&edit=${categoryId}#category-form`);
  if (removedUrl) await cleanupUnreferencedMediaUrls([removedUrl]).catch((error) => console.error("Unable to remove replaced category media", error));
  await audit(categoryId, "CATEGORY_UPDATE", `Updated category ${category.name}`);
  refreshCategoryPages();
  redirect(`/admin/categories?saved=1&edit=${categoryId}#category-form`);
}

export async function setCategoryStatusAction(categoryId: string, nextStatus: "ACTIVE" | "HIDDEN"): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(categoryId) || !categorySchema.shape.status.safeParse(nextStatus).success) return;
  await executeMutation("UPDATE categories SET status = ? WHERE id = ?", [nextStatus, categoryId]);
  await audit(categoryId, "CATEGORY_STATUS_UPDATE", `${nextStatus === "ACTIVE" ? "Activated" : "Hid"} category`);
  refreshCategoryPages();
}
