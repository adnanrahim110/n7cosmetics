"use server";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString, formStringList, isDatabaseId, nullableFormString, poundsToPence, slugify } from "@/lib/admin/form";
import { cleanupUnreferencedMediaUrls, MediaUploadError, mergeMediaSubmission, removeStoredMediaFiles, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { getGlobalLowStockThreshold } from "@/lib/admin/product-defaults";
import { automatedProductSku } from "@/lib/admin/product-identifiers";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const bundleInputSchema = z.object({
  name: z.string().min(2).max(190),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  shortDescription: z.string().max(500).nullable(),
  description: z.string().max(30000).nullable(),
  featured: z.boolean(),
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(160).nullable(),
  sizeLabel: z.string().min(1).max(150),
  pricePence: z.number().int().nonnegative(),
  compareAtPricePence: z.number().int().nonnegative().nullable(),
  costPence: z.number().int().nonnegative().nullable(),
  stockOnHand: z.number().int().min(0).max(1000000),
  weightGrams: z.number().int().positive().nullable(),
  componentVariantIds: z.array(z.string().regex(/^[1-9]\d*$/)).min(1, "Select at least one product.").max(20),
}).superRefine((bundle, context) => {
  if (bundle.compareAtPricePence !== null && bundle.compareAtPricePence <= bundle.pricePence) {
    context.addIssue({ code: "custom", path: ["compareAtPricePence"], message: "Compare-at price must be higher than the selling price." });
  }
  if (new Set(bundle.componentVariantIds).size !== bundle.componentVariantIds.length) {
    context.addIssue({ code: "custom", path: ["componentVariantIds"], message: "Each product can only be included once." });
  }
});

export interface BundleActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

interface ExistingBundleRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
}

interface ExistingVariantRow extends RowDataPacket { id: string }
interface ExistingMediaRow extends RowDataPacket { url: string }
interface SlugRow extends RowDataPacket { slug: string }
interface ComponentVariantRow extends RowDataPacket { id: string }

class BundleSelectionError extends Error {}

function parseOptionalMoney(value: string): number | null | undefined {
  if (!value) return null;
  return poundsToPence(value) ?? undefined;
}

function parseBundleForm(formData: FormData) {
  const weight = formString(formData, "weightGrams");
  return bundleInputSchema.safeParse({
    name: formString(formData, "name"),
    status: formString(formData, "status"),
    shortDescription: nullableFormString(formData, "shortDescription"),
    description: nullableFormString(formData, "description"),
    featured: formCheckbox(formData, "featured"),
    seoTitle: nullableFormString(formData, "seoTitle"),
    seoDescription: nullableFormString(formData, "seoDescription"),
    sizeLabel: formString(formData, "sizeLabel"),
    pricePence: poundsToPence(formString(formData, "price")),
    compareAtPricePence: parseOptionalMoney(formString(formData, "compareAtPrice")),
    costPence: parseOptionalMoney(formString(formData, "cost")),
    stockOnHand: Number(formString(formData, "stockOnHand")),
    weightGrams: weight ? Number(weight) : null,
    componentVariantIds: formStringList(formData, "componentVariantIds"),
  });
}

function validationState(error: z.ZodError): BundleActionState {
  return { error: "Review the highlighted bundle details and try again.", fieldErrors: error.flatten().fieldErrors };
}

function databaseErrorState(error: unknown): BundleActionState {
  if (error instanceof MediaUploadError || error instanceof BundleSelectionError) return { error: error.message };
  if (typeof error === "object" && error && "code" in error && error.code === "ER_DUP_ENTRY") {
    return { error: "A bundle with the same details already exists. Change the title and try again." };
  }
  console.error("Unable to save bundle", error);
  return { error: "The bundle could not be saved. Your previous information is unchanged, so please try again." };
}

async function uniqueBundleSlug(name: string, connection: PoolConnection, ignoredProductId?: string): Promise<string> {
  const base = slugify(name) || "bundle";
  const rows = await selectRows<SlugRow>(
    `SELECT slug FROM products WHERE (slug = ? OR slug LIKE ?) ${ignoredProductId ? "AND id != ?" : ""}`,
    ignoredProductId ? [base, `${base}-%`, ignoredProductId] : [base, `${base}-%`],
    connection,
  );
  const used = new Set(rows.map((row) => row.slug));
  if (!used.has(base)) return base;
  for (let suffix = 2; suffix < 10000; suffix += 1) {
    const candidate = `${base.slice(0, 190 - String(suffix).length - 1)}-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error("Could not generate a unique bundle URL.");
}

function allSubmittedFiles(formData: FormData): File[] {
  return ["primaryMedia", "galleryMedia", "videoMedia"].flatMap((field) => submittedMediaFiles(formData, field));
}

function fileLimitState(formData: FormData): BundleActionState | null {
  const total = allSubmittedFiles(formData).reduce((sum, file) => sum + file.size, 0);
  return total > 300 * 1024 * 1024 ? { error: "The selected media exceeds the 300 MB limit for one save." } : null;
}

async function validateComponentVariants(ids: string[], requireActive: boolean, connection: PoolConnection): Promise<void> {
  const placeholders = ids.map(() => "?").join(",");
  const rows = await selectRows<ComponentVariantRow>(
    `SELECT CAST(v.id AS CHAR) AS id
     FROM product_variants v
     INNER JOIN products p ON p.id = v.product_id
     WHERE v.id IN (${placeholders})
       AND v.is_default = 1
       AND v.status = 'ACTIVE'
       AND p.product_type = 'STANDARD'
       AND p.status ${requireActive ? "= 'ACTIVE'" : "!= 'ARCHIVED'"}`,
    ids,
    connection,
  );
  if (rows.length !== ids.length) throw new BundleSelectionError("One or more selected products are no longer available. Review the bundle products and try again.");
}

async function auditBundle(administratorId: string, action: string, bundleId: string, summary: string): Promise<void> {
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId, action, entityType: "bundle", entityId: bundleId, summary, ipAddress: metadata.ipAddress });
}

export async function createBundleAction(_previousState: BundleActionState, formData: FormData): Promise<BundleActionState> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseBundleForm(formData);
  if (!parsed.success) return validationState(parsed.error);
  const limitError = fileLimitState(formData);
  if (limitError) return limitError;
  const bundle = parsed.data;
  const writtenAssets: StoredMediaAsset[] = [];
  let bundleId = "";

  try {
    bundleId = await withTransaction(async (connection) => {
      await validateComponentVariants(bundle.componentVariantIds, bundle.status === "ACTIVE", connection);
      const slug = await uniqueBundleSlug(bundle.name, connection);
      const lowStockThreshold = await getGlobalLowStockThreshold(connection);
      const primaryStored = await storeMediaFiles(submittedMediaFiles(formData, "primaryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "bundles/images", altTexts: [`${bundle.name} bundle image`], maximumFiles: 1 });
      writtenAssets.push(...primaryStored);
      const galleryStored = await storeMediaFiles(submittedMediaFiles(formData, "galleryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "bundles/images", maximumFiles: 12 });
      writtenAssets.push(...galleryStored);
      const videoStored = await storeMediaFiles(submittedMediaFiles(formData, "videoMedia"), { uploadedBy: administrator.id, connection, expectedType: "video", folder: "bundles/videos", maximumFiles: 6 });
      writtenAssets.push(...videoStored);

      const primaryUrls = mergeMediaSubmission(formData, "primaryMedia", primaryStored, new Set());
      const galleryUrls = mergeMediaSubmission(formData, "galleryMedia", galleryStored, new Set());
      const videoUrls = mergeMediaSubmission(formData, "videoMedia", videoStored, new Set());
      if (primaryUrls.length > 1 || galleryUrls.length > 12 || videoUrls.length > 6) throw new MediaUploadError("Too many files were submitted.");
      if (bundle.status === "ACTIVE" && primaryUrls.length !== 1) throw new MediaUploadError("An active bundle requires a primary image.");

      const created = await executeMutation(
        `INSERT INTO products
           (name, slug, product_type, status, short_description, description, brand, audience,
            fragrance_notes_json, featured, track_inventory, seo_title, seo_description, published_at)
         VALUES (?, ?, 'BUNDLE', ?, ?, ?, 'N7 Cosmetics', 'UNSPECIFIED', ?, ?, 1, ?, ?, IF(? = 'ACTIVE', CURRENT_TIMESTAMP(3), NULL))`,
        [bundle.name, slug, bundle.status, bundle.shortDescription, bundle.description, JSON.stringify({ top: [], heart: [], base: [] }), bundle.featured, bundle.seoTitle, bundle.seoDescription, bundle.status],
        connection,
      );
      const id = String(created.insertId);
      await executeMutation(
        `INSERT INTO product_variants
           (product_id, title, sku, price_pence, compare_at_price_pence, cost_pence, stock_on_hand,
            low_stock_threshold, weight_grams, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, bundle.sizeLabel, automatedProductSku(id), bundle.pricePence, bundle.compareAtPricePence, bundle.costPence, bundle.stockOnHand, lowStockThreshold, bundle.weightGrams],
        connection,
      );
      for (const [index, componentVariantId] of bundle.componentVariantIds.entries()) {
        await executeMutation("INSERT INTO bundle_items (bundle_product_id, component_variant_id, quantity, sort_order) VALUES (?, ?, 1, ?)", [id, componentVariantId, index], connection);
      }
      for (const [index, url] of [...primaryUrls, ...galleryUrls].entries()) {
        const alt = index === 0 ? `${bundle.name} bundle image` : `${bundle.name} bundle gallery image ${index}`;
        await executeMutation("INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)", [id, url, alt, index], connection);
      }
      for (const [index, url] of videoUrls.entries()) {
        await executeMutation("INSERT INTO product_videos (product_id, url, title, sort_order) VALUES (?, ?, ?, ?)", [id, url, `${bundle.name} bundle video ${index + 1}`, index], connection);
      }
      return id;
    });
  } catch (error) {
    await removeStoredMediaFiles(writtenAssets);
    return databaseErrorState(error);
  }

  await auditBundle(administrator.id, "BUNDLE_CREATE", bundleId, `Created bundle ${bundle.name}`);
  revalidatePath("/admin/bundles");
  revalidatePath("/bundles");
  redirect("/admin/bundles?saved=created");
}

export async function updateBundleAction(bundleId: string, _previousState: BundleActionState, formData: FormData): Promise<BundleActionState> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(bundleId)) return { error: "This bundle can no longer be edited. Return to the bundle list and try again." };
  const parsed = parseBundleForm(formData);
  if (!parsed.success) return validationState(parsed.error);
  const limitError = fileLimitState(formData);
  if (limitError) return limitError;
  const bundle = parsed.data;
  const writtenAssets: StoredMediaAsset[] = [];
  let removedUrls: string[] = [];
  let savedSlug = "";
  let previousSlug = "";

  try {
    await withTransaction(async (connection) => {
      const existing = await selectOne<ExistingBundleRow>("SELECT CAST(id AS CHAR) AS id, name, slug FROM products WHERE id = ? AND product_type = 'BUNDLE' FOR UPDATE", [bundleId], connection);
      if (!existing) throw new BundleSelectionError("Bundle not found.");
      previousSlug = existing.slug;
      savedSlug = existing.name === bundle.name ? existing.slug : await uniqueBundleSlug(bundle.name, connection, bundleId);
      await validateComponentVariants(bundle.componentVariantIds, bundle.status === "ACTIVE", connection);
      const lowStockThreshold = await getGlobalLowStockThreshold(connection);
      const [existingImages, existingVideos] = await Promise.all([
        selectRows<ExistingMediaRow>("SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order, id", [bundleId], connection),
        selectRows<ExistingMediaRow>("SELECT url FROM product_videos WHERE product_id = ? ORDER BY sort_order, id", [bundleId], connection),
      ]);
      const primaryAllowed = new Set(existingImages.slice(0, 1).map((row) => row.url));
      const galleryAllowed = new Set(existingImages.slice(1).map((row) => row.url));
      const videoAllowed = new Set(existingVideos.map((row) => row.url));

      const primaryStored = await storeMediaFiles(submittedMediaFiles(formData, "primaryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "bundles/images", altTexts: [`${bundle.name} bundle image`], maximumFiles: 1 });
      writtenAssets.push(...primaryStored);
      const galleryStored = await storeMediaFiles(submittedMediaFiles(formData, "galleryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "bundles/images", maximumFiles: 12 });
      writtenAssets.push(...galleryStored);
      const videoStored = await storeMediaFiles(submittedMediaFiles(formData, "videoMedia"), { uploadedBy: administrator.id, connection, expectedType: "video", folder: "bundles/videos", maximumFiles: 6 });
      writtenAssets.push(...videoStored);

      const primaryUrls = mergeMediaSubmission(formData, "primaryMedia", primaryStored, primaryAllowed);
      const galleryUrls = mergeMediaSubmission(formData, "galleryMedia", galleryStored, galleryAllowed);
      const videoUrls = mergeMediaSubmission(formData, "videoMedia", videoStored, videoAllowed);
      if (primaryUrls.length > 1 || galleryUrls.length > 12 || videoUrls.length > 6) throw new MediaUploadError("Too many files were submitted.");
      if (bundle.status === "ACTIVE" && primaryUrls.length !== 1) throw new MediaUploadError("An active bundle requires a primary image.");
      const finalUrls = new Set([...primaryUrls, ...galleryUrls, ...videoUrls]);
      removedUrls = [...existingImages, ...existingVideos].map((row) => row.url).filter((url) => !finalUrls.has(url));

      await executeMutation(
        `UPDATE products SET
           name = ?, slug = ?, status = ?, short_description = ?, description = ?, brand = 'N7 Cosmetics',
           audience = 'UNSPECIFIED', fragrance_notes_json = ?, featured = ?, track_inventory = 1,
           seo_title = ?, seo_description = ?,
           published_at = CASE WHEN ? = 'ACTIVE' THEN COALESCE(published_at, CURRENT_TIMESTAMP(3)) ELSE published_at END
         WHERE id = ? AND product_type = 'BUNDLE'`,
        [bundle.name, savedSlug, bundle.status, bundle.shortDescription, bundle.description, JSON.stringify({ top: [], heart: [], base: [] }), bundle.featured, bundle.seoTitle, bundle.seoDescription, bundle.status, bundleId],
        connection,
      );

      const variant = await selectOne<ExistingVariantRow>("SELECT CAST(id AS CHAR) AS id FROM product_variants WHERE product_id = ? AND is_default = 1 LIMIT 1", [bundleId], connection);
      if (variant) {
        await executeMutation(
          `UPDATE product_variants SET title = ?, sku = ?, price_pence = ?, compare_at_price_pence = ?, cost_pence = ?, stock_on_hand = ?, low_stock_threshold = ?, weight_grams = ? WHERE id = ?`,
          [bundle.sizeLabel, automatedProductSku(bundleId), bundle.pricePence, bundle.compareAtPricePence, bundle.costPence, bundle.stockOnHand, lowStockThreshold, bundle.weightGrams, variant.id],
          connection,
        );
      } else {
        await executeMutation(
          `INSERT INTO product_variants (product_id, title, sku, price_pence, compare_at_price_pence, cost_pence, stock_on_hand, low_stock_threshold, weight_grams, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [bundleId, bundle.sizeLabel, automatedProductSku(bundleId), bundle.pricePence, bundle.compareAtPricePence, bundle.costPence, bundle.stockOnHand, lowStockThreshold, bundle.weightGrams],
          connection,
        );
      }

      await executeMutation("DELETE FROM bundle_items WHERE bundle_product_id = ?", [bundleId], connection);
      await executeMutation("DELETE FROM product_images WHERE product_id = ?", [bundleId], connection);
      await executeMutation("DELETE FROM product_videos WHERE product_id = ?", [bundleId], connection);
      for (const [index, componentVariantId] of bundle.componentVariantIds.entries()) {
        await executeMutation("INSERT INTO bundle_items (bundle_product_id, component_variant_id, quantity, sort_order) VALUES (?, ?, 1, ?)", [bundleId, componentVariantId, index], connection);
      }
      for (const [index, url] of [...primaryUrls, ...galleryUrls].entries()) {
        const alt = index === 0 ? `${bundle.name} bundle image` : `${bundle.name} bundle gallery image ${index}`;
        await executeMutation("INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)", [bundleId, url, alt, index], connection);
      }
      for (const [index, url] of videoUrls.entries()) {
        await executeMutation("INSERT INTO product_videos (product_id, url, title, sort_order) VALUES (?, ?, ?, ?)", [bundleId, url, `${bundle.name} bundle video ${index + 1}`, index], connection);
      }
    });
  } catch (error) {
    await removeStoredMediaFiles(writtenAssets);
    return databaseErrorState(error);
  }

  await cleanupUnreferencedMediaUrls(removedUrls).catch((error) => console.error("Unable to remove replaced bundle media", error));
  await auditBundle(administrator.id, "BUNDLE_UPDATE", bundleId, `Updated bundle ${bundle.name}`);
  revalidatePath("/admin/bundles");
  revalidatePath(`/admin/bundles/${bundleId}`);
  revalidatePath("/bundles");
  revalidatePath(`/bundles/${previousSlug}`);
  revalidatePath(`/bundles/${savedSlug}`);
  redirect("/admin/bundles?saved=updated");
}

export async function archiveBundleAction(bundleId: string): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(bundleId)) return;
  await executeMutation("UPDATE products SET status = 'ARCHIVED' WHERE id = ? AND product_type = 'BUNDLE'", [bundleId]);
  await auditBundle(administrator.id, "BUNDLE_ARCHIVE", bundleId, "Archived bundle");
  revalidatePath("/admin/bundles");
  revalidatePath("/bundles");
}
