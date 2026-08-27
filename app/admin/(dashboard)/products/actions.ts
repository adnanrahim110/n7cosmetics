"use server";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString, formStringList, isDatabaseId, nullableFormString, poundsToPence, slugify } from "@/lib/admin/form";
import { cleanupUnreferencedMediaUrls, MediaUploadError, mergeMediaSubmission, removeStoredMediaFiles, storeMediaFiles, submittedMediaFiles, type StoredMediaAsset } from "@/lib/admin/media";
import { productListReturnToWithToast } from "@/lib/admin/product-navigation";
import { getGlobalLowStockThreshold } from "@/lib/admin/product-defaults";
import { automatedProductSku } from "@/lib/admin/product-identifiers";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const noteListSchema = z.array(z.string().min(1).max(100)).max(20);
const productInputSchema = z.object({
  name: z.string().min(2).max(190),
  productType: z.literal("STANDARD"),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  shortDescription: z.string().max(500).nullable(),
  description: z.string().max(30000).nullable(),
  brand: z.string().max(150).nullable(),
  inspiredBy: z.string().max(190).nullable(),
  productCode: z.string().max(100).nullable(),
  audience: z.enum(["MEN", "WOMEN", "UNISEX", "UNSPECIFIED"]),
  fragranceNotes: z.object({ top: noteListSchema, heart: noteListSchema, base: noteListSchema }),
  featured: z.boolean(),
  seoTitle: z.string().max(70).nullable(),
  seoDescription: z.string().max(160).nullable(),
  sizeLabel: z.string().min(1).max(150),
  pricePence: z.number().int().nonnegative(),
  compareAtPricePence: z.number().int().nonnegative().nullable(),
  costPence: z.number().int().nonnegative().nullable(),
  stockOnHand: z.number().int().min(0).max(1000000),
  weightGrams: z.number().int().positive().nullable(),
  categoryIds: z.array(z.string().regex(/^[1-9]\d*$/)).max(100),
  collectionIds: z.array(z.string().regex(/^[1-9]\d*$/)).max(100),
}).superRefine((product, context) => {
  if (product.compareAtPricePence !== null && product.compareAtPricePence <= product.pricePence) {
    context.addIssue({ code: "custom", path: ["compareAtPricePence"], message: "Compare-at price must be higher than the selling price." });
  }
});

const recreationFieldsSchema = z.object({
  inspiredBy: z.string().min(1, "Inspired by is required.").max(190),
  productCode: z.string().min(1, "Product code is required.").max(100),
});

export interface ProductActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

interface ExistingProductRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
}

interface ExistingVariantRow extends RowDataPacket {
  id: string;
}

interface ExistingMediaRow extends RowDataPacket {
  url: string;
}

interface SlugRow extends RowDataPacket {
  slug: string;
}

interface RecreationCollectionRow extends RowDataPacket {
  id: string;
}

function parseOptionalMoney(value: string): number | null | undefined {
  if (!value) return null;
  return poundsToPence(value) ?? undefined;
}

function parseNoteList(value: string): string[] {
  return value.split(/[,\n]/).map((note) => note.trim()).filter(Boolean);
}

function parseProductForm(formData: FormData) {
  const pricePence = poundsToPence(formString(formData, "price"));
  const weight = formString(formData, "weightGrams");
  return productInputSchema.safeParse({
    name: formString(formData, "name"),
    productType: formString(formData, "productType"),
    status: formString(formData, "status"),
    shortDescription: nullableFormString(formData, "shortDescription"),
    description: nullableFormString(formData, "description"),
    brand: nullableFormString(formData, "brand"),
    inspiredBy: nullableFormString(formData, "inspiredBy"),
    productCode: nullableFormString(formData, "productCode"),
    audience: formString(formData, "audience"),
    fragranceNotes: {
      top: parseNoteList(formString(formData, "topNotes")),
      heart: parseNoteList(formString(formData, "heartNotes")),
      base: parseNoteList(formString(formData, "baseNotes")),
    },
    featured: formCheckbox(formData, "featured"),
    seoTitle: nullableFormString(formData, "seoTitle"),
    seoDescription: nullableFormString(formData, "seoDescription"),
    sizeLabel: formString(formData, "sizeLabel"),
    pricePence,
    compareAtPricePence: parseOptionalMoney(formString(formData, "compareAtPrice")),
    costPence: parseOptionalMoney(formString(formData, "cost")),
    stockOnHand: Number(formString(formData, "stockOnHand")),
    weightGrams: weight ? Number(weight) : null,
    categoryIds: formStringList(formData, "categoryIds"),
    collectionIds: formStringList(formData, "collectionIds"),
  });
}

async function hasRecreationsCollection(collectionIds: string[]): Promise<boolean> {
  if (!collectionIds.length) return false;
  const placeholders = collectionIds.map(() => "?").join(", ");
  const recreation = await selectOne<RecreationCollectionRow>(
    `SELECT CAST(id AS CHAR) AS id
     FROM collections
     WHERE slug = 'recreations' AND id IN (${placeholders})
     LIMIT 1`,
    collectionIds,
  );
  return Boolean(recreation);
}

async function applyCollectionFieldRules(product: z.infer<typeof productInputSchema>) {
  const isRecreationsProduct = await hasRecreationsCollection(product.collectionIds);
  if (!isRecreationsProduct) return { success: true as const, data: { ...product, inspiredBy: null, productCode: null } };

  const recreationFields = recreationFieldsSchema.safeParse({ inspiredBy: product.inspiredBy ?? "", productCode: product.productCode ?? "" });
  if (!recreationFields.success) return { success: false as const, error: recreationFields.error };
  return { success: true as const, data: { ...product, ...recreationFields.data } };
}

function validationState(error: z.ZodError): ProductActionState {
  return { error: "Review the highlighted product details and try again.", fieldErrors: error.flatten().fieldErrors };
}

function databaseErrorState(error: unknown): ProductActionState {
  if (error instanceof MediaUploadError) return { error: error.message };
  if (typeof error === "object" && error && "code" in error && error.code === "ER_DUP_ENTRY") {
    return { error: "A product with the same details already exists. Change the product name and try again." };
  }
  console.error("Unable to save product", error);
  return { error: "The product could not be saved. Your previous product information is unchanged, so please try again." };
}

async function uniqueProductSlug(name: string, connection: PoolConnection, ignoredProductId?: string): Promise<string> {
  const base = slugify(name) || "product";
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
  throw new Error("Could not generate a unique product URL.");
}

function allSubmittedFiles(formData: FormData): File[] {
  return ["primaryMedia", "galleryMedia", "videoMedia"].flatMap((field) => submittedMediaFiles(formData, field));
}

function fileLimitState(formData: FormData): ProductActionState | null {
  const total = allSubmittedFiles(formData).reduce((sum, file) => sum + file.size, 0);
  return total > 300 * 1024 * 1024 ? { error: "The selected media exceeds the 300 MB limit for one save." } : null;
}

async function auditProduct(administratorId: string, action: string, productId: string, summary: string): Promise<void> {
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId, action, entityType: "product", entityId: productId, summary, ipAddress: metadata.ipAddress });
}

export async function createProductAction(returnTo: string, _previousState: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseProductForm(formData);
  if (!parsed.success) return validationState(parsed.error);
  const limitError = fileLimitState(formData);
  if (limitError) return limitError;
  const checked = await applyCollectionFieldRules(parsed.data);
  if (!checked.success) return validationState(checked.error);
  const product = checked.data;
  const writtenAssets: StoredMediaAsset[] = [];
  let productId = "";

  try {
    productId = await withTransaction(async (connection) => {
      const slug = await uniqueProductSlug(product.name, connection);
      const lowStockThreshold = await getGlobalLowStockThreshold(connection);
      const primaryStored = await storeMediaFiles(submittedMediaFiles(formData, "primaryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "products/images", altTexts: [`${product.name} product image`], maximumFiles: 1 });
      writtenAssets.push(...primaryStored);
      const galleryStored = await storeMediaFiles(submittedMediaFiles(formData, "galleryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "products/images", maximumFiles: 12 });
      writtenAssets.push(...galleryStored);
      const videoStored = await storeMediaFiles(submittedMediaFiles(formData, "videoMedia"), { uploadedBy: administrator.id, connection, expectedType: "video", folder: "products/videos", maximumFiles: 6 });
      writtenAssets.push(...videoStored);

      const primaryUrls = mergeMediaSubmission(formData, "primaryMedia", primaryStored, new Set());
      const galleryUrls = mergeMediaSubmission(formData, "galleryMedia", galleryStored, new Set());
      const videoUrls = mergeMediaSubmission(formData, "videoMedia", videoStored, new Set());
      if (primaryUrls.length > 1 || galleryUrls.length > 12 || videoUrls.length > 6) throw new MediaUploadError("Too many files were submitted.");
      if (product.status === "ACTIVE" && primaryUrls.length !== 1) throw new MediaUploadError("An active product requires a primary product image.");

      const created = await executeMutation(
        `INSERT INTO products
           (name, slug, product_type, status, short_description, description, brand, inspired_by, product_code,
            audience, fragrance_notes_json, featured, track_inventory, seo_title, seo_description, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, IF(? = 'ACTIVE', CURRENT_TIMESTAMP(3), NULL))`,
        [product.name, slug, product.productType, product.status, product.shortDescription, product.description,
         product.brand, product.inspiredBy, product.productCode, product.audience, JSON.stringify(product.fragranceNotes), product.featured,
         product.seoTitle, product.seoDescription, product.status],
        connection,
      );
      const id = String(created.insertId);
      const sku = automatedProductSku(id);
      await executeMutation(
        `INSERT INTO product_variants
           (product_id, title, sku, price_pence, compare_at_price_pence, cost_pence, stock_on_hand,
            low_stock_threshold, weight_grams, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [id, product.sizeLabel, sku, product.pricePence, product.compareAtPricePence, product.costPence,
         product.stockOnHand, lowStockThreshold, product.weightGrams],
        connection,
      );
      const imageUrls = [...primaryUrls, ...galleryUrls];
      for (const [index, url] of imageUrls.entries()) {
        const alt = index === 0 ? `${product.name} product image` : `${product.name} product gallery image ${index}`;
        await executeMutation("INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)", [id, url, alt, index], connection);
      }
      for (const [index, url] of videoUrls.entries()) {
        await executeMutation("INSERT INTO product_videos (product_id, url, title, sort_order) VALUES (?, ?, ?, ?)", [id, url, `${product.name} product video ${index + 1}`, index], connection);
      }
      for (const categoryId of product.categoryIds) await executeMutation("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [id, categoryId], connection);
      for (const collectionId of product.collectionIds) await executeMutation("INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)", [id, collectionId], connection);
      return id;
    });
  } catch (error) {
    await removeStoredMediaFiles(writtenAssets);
    return databaseErrorState(error);
  }

  await auditProduct(administrator.id, "PRODUCT_CREATE", productId, `Created product ${product.name}`);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect(productListReturnToWithToast(returnTo, "product-created"));
}

export async function updateProductAction(productId: string, returnTo: string, _previousState: ProductActionState, formData: FormData): Promise<ProductActionState> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(productId)) return { error: "This product can no longer be edited. Return to the product list and try again." };
  const parsed = parseProductForm(formData);
  if (!parsed.success) return validationState(parsed.error);
  const limitError = fileLimitState(formData);
  if (limitError) return limitError;
  const checked = await applyCollectionFieldRules(parsed.data);
  if (!checked.success) return validationState(checked.error);
  const product = checked.data;
  const writtenAssets: StoredMediaAsset[] = [];
  let removedUrls: string[] = [];
  let savedSlug = "";

  try {
    await withTransaction(async (connection) => {
      const existing = await selectOne<ExistingProductRow>("SELECT CAST(id AS CHAR) AS id, name, slug FROM products WHERE id = ? FOR UPDATE", [productId], connection);
      if (!existing) throw new Error("Product not found.");
      savedSlug = existing.name === product.name ? existing.slug : await uniqueProductSlug(product.name, connection, productId);
      const sku = automatedProductSku(productId);
      const lowStockThreshold = await getGlobalLowStockThreshold(connection);

      const [existingImages, existingVideos] = await Promise.all([
        selectRows<ExistingMediaRow>("SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order, id", [productId], connection),
        selectRows<ExistingMediaRow>("SELECT url FROM product_videos WHERE product_id = ? ORDER BY sort_order, id", [productId], connection),
      ]);
      const primaryAllowed = new Set(existingImages.slice(0, 1).map((row) => row.url));
      const galleryAllowed = new Set(existingImages.slice(1).map((row) => row.url));
      const videoAllowed = new Set(existingVideos.map((row) => row.url));

      const primaryStored = await storeMediaFiles(submittedMediaFiles(formData, "primaryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "products/images", altTexts: [`${product.name} product image`], maximumFiles: 1 });
      writtenAssets.push(...primaryStored);
      const galleryStored = await storeMediaFiles(submittedMediaFiles(formData, "galleryMedia"), { uploadedBy: administrator.id, connection, expectedType: "image", folder: "products/images", maximumFiles: 12 });
      writtenAssets.push(...galleryStored);
      const videoStored = await storeMediaFiles(submittedMediaFiles(formData, "videoMedia"), { uploadedBy: administrator.id, connection, expectedType: "video", folder: "products/videos", maximumFiles: 6 });
      writtenAssets.push(...videoStored);

      const primaryUrls = mergeMediaSubmission(formData, "primaryMedia", primaryStored, primaryAllowed);
      const galleryUrls = mergeMediaSubmission(formData, "galleryMedia", galleryStored, galleryAllowed);
      const videoUrls = mergeMediaSubmission(formData, "videoMedia", videoStored, videoAllowed);
      if (primaryUrls.length > 1 || galleryUrls.length > 12 || videoUrls.length > 6) throw new MediaUploadError("Too many files were submitted.");
      if (product.status === "ACTIVE" && primaryUrls.length !== 1) throw new MediaUploadError("An active product requires a primary product image.");
      const finalUrls = new Set([...primaryUrls, ...galleryUrls, ...videoUrls]);
      removedUrls = [...existingImages, ...existingVideos].map((row) => row.url).filter((url) => !finalUrls.has(url));

      await executeMutation(
        `UPDATE products SET
           name = ?, slug = ?, product_type = ?, status = ?, short_description = ?, description = ?,
           brand = ?, inspired_by = ?, product_code = ?, audience = ?, fragrance_notes_json = ?, featured = ?,
           track_inventory = 1, seo_title = ?, seo_description = ?,
           published_at = CASE WHEN ? = 'ACTIVE' THEN COALESCE(published_at, CURRENT_TIMESTAMP(3)) ELSE published_at END
         WHERE id = ?`,
        [product.name, savedSlug, product.productType, product.status, product.shortDescription, product.description,
         product.brand, product.inspiredBy, product.productCode, product.audience, JSON.stringify(product.fragranceNotes), product.featured,
         product.seoTitle, product.seoDescription, product.status, productId],
        connection,
      );

      const variant = await selectOne<ExistingVariantRow>("SELECT CAST(id AS CHAR) AS id FROM product_variants WHERE product_id = ? AND is_default = 1 LIMIT 1", [productId], connection);
      if (variant) {
        await executeMutation(
          `UPDATE product_variants SET title = ?, sku = ?, price_pence = ?, compare_at_price_pence = ?, cost_pence = ?,
             stock_on_hand = ?, low_stock_threshold = ?, weight_grams = ? WHERE id = ?`,
          [product.sizeLabel, sku, product.pricePence, product.compareAtPricePence, product.costPence,
           product.stockOnHand, lowStockThreshold, product.weightGrams, variant.id], connection,
        );
      } else {
        await executeMutation(
          `INSERT INTO product_variants
             (product_id, title, sku, price_pence, compare_at_price_pence, cost_pence, stock_on_hand, low_stock_threshold, weight_grams, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [productId, product.sizeLabel, sku, product.pricePence, product.compareAtPricePence, product.costPence,
           product.stockOnHand, lowStockThreshold, product.weightGrams], connection,
        );
      }

      await executeMutation("DELETE FROM product_categories WHERE product_id = ?", [productId], connection);
      await executeMutation("DELETE FROM product_collections WHERE product_id = ?", [productId], connection);
      await executeMutation("DELETE FROM product_images WHERE product_id = ?", [productId], connection);
      await executeMutation("DELETE FROM product_videos WHERE product_id = ?", [productId], connection);
      for (const categoryId of product.categoryIds) await executeMutation("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [productId, categoryId], connection);
      for (const collectionId of product.collectionIds) await executeMutation("INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)", [productId, collectionId], connection);
      const imageUrls = [...primaryUrls, ...galleryUrls];
      for (const [index, url] of imageUrls.entries()) {
        const alt = index === 0 ? `${product.name} product image` : `${product.name} product gallery image ${index}`;
        await executeMutation("INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?)", [productId, url, alt, index], connection);
      }
      for (const [index, url] of videoUrls.entries()) {
        await executeMutation("INSERT INTO product_videos (product_id, url, title, sort_order) VALUES (?, ?, ?, ?)", [productId, url, `${product.name} product video ${index + 1}`, index], connection);
      }
    });
  } catch (error) {
    await removeStoredMediaFiles(writtenAssets);
    return databaseErrorState(error);
  }

  await cleanupUnreferencedMediaUrls(removedUrls).catch((error) => console.error("Unable to remove replaced product media", error));
  await auditProduct(administrator.id, "PRODUCT_UPDATE", productId, `Updated product ${product.name}`);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/products/${savedSlug}`);
  redirect(productListReturnToWithToast(returnTo, "product-updated"));
}

export async function archiveProductAction(productId: string): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(productId)) return;
  await executeMutation("UPDATE products SET status = 'ARCHIVED' WHERE id = ?", [productId]);
  await auditProduct(administrator.id, "PRODUCT_ARCHIVE", productId, "Archived product");
  revalidatePath("/admin/products");
}
