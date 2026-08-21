"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import {
  formCheckbox,
  formString,
  formStringList,
  isDatabaseId,
  nullableFormString,
  poundsToPence,
  slugify,
} from "@/lib/admin/form";
import type { RowDataPacket } from "mysql2/promise";

const mediaUrlSchema = z.string().max(1000).refine((value) => value.startsWith("/") || z.url().safeParse(value).success);
const productInputSchema = z.object({
  name: z.string().min(2).max(190),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
  productType: z.enum(["STANDARD", "BUNDLE"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  shortDescription: z.string().max(500).nullable(),
  description: z.string().max(30000).nullable(),
  brand: z.string().max(150).nullable(),
  inspiredBy: z.string().max(190).nullable(),
  audience: z.enum(["MEN", "WOMEN", "UNISEX", "UNSPECIFIED"]),
  notes: z.array(z.string().max(100)).max(30),
  featured: z.boolean(),
  trackInventory: z.boolean(),
  seoTitle: z.string().max(190).nullable(),
  seoDescription: z.string().max(320).nullable(),
  variantTitle: z.string().min(1).max(150),
  sku: z.string().min(1).max(100),
  pricePence: z.number().int().nonnegative(),
  compareAtPricePence: z.number().int().nonnegative().nullable(),
  stockOnHand: z.number().int().min(-100000).max(1000000),
  lowStockThreshold: z.number().int().min(0).max(1000000),
  weightGrams: z.number().int().positive().nullable(),
  imageUrl: mediaUrlSchema.nullable(),
  videoUrl: mediaUrlSchema.nullable(),
  imageAlt: z.string().max(255).nullable(),
  categoryIds: z.array(z.string().regex(/^[1-9]\d*$/)).max(100),
  collectionIds: z.array(z.string().regex(/^[1-9]\d*$/)).max(100),
});

interface ExistingProductRow extends RowDataPacket { id: string }

function parseOptionalMoney(value: string): number | null | undefined {
  if (!value) return null;
  return poundsToPence(value) ?? undefined;
}

function parseProductForm(formData: FormData) {
  const name = formString(formData, "name");
  const pricePence = poundsToPence(formString(formData, "price"));
  const compareAtPricePence = parseOptionalMoney(formString(formData, "compareAtPrice"));
  const weight = formString(formData, "weightGrams");
  const parsedWeight = weight ? Number(weight) : null;

  return productInputSchema.safeParse({
    name,
    slug: slugify(formString(formData, "slug") || name),
    productType: formString(formData, "productType"),
    status: formString(formData, "status"),
    shortDescription: nullableFormString(formData, "shortDescription"),
    description: nullableFormString(formData, "description"),
    brand: nullableFormString(formData, "brand"),
    inspiredBy: nullableFormString(formData, "inspiredBy"),
    audience: formString(formData, "audience"),
    notes: formString(formData, "notes").split(",").map((note) => note.trim()).filter(Boolean),
    featured: formCheckbox(formData, "featured"),
    trackInventory: formCheckbox(formData, "trackInventory"),
    seoTitle: nullableFormString(formData, "seoTitle"),
    seoDescription: nullableFormString(formData, "seoDescription"),
    variantTitle: formString(formData, "variantTitle"),
    sku: formString(formData, "sku").toUpperCase(),
    pricePence,
    compareAtPricePence,
    stockOnHand: Number(formString(formData, "stockOnHand")),
    lowStockThreshold: Number(formString(formData, "lowStockThreshold")),
    weightGrams: parsedWeight,
    imageUrl: nullableFormString(formData, "imageUrl"),
    videoUrl: nullableFormString(formData, "videoUrl"),
    imageAlt: nullableFormString(formData, "imageAlt"),
    categoryIds: formStringList(formData, "categoryIds"),
    collectionIds: formStringList(formData, "collectionIds"),
  });
}

async function hasCatalogConflict(slug: string, sku: string, ignoredProductId?: string): Promise<boolean> {
  const existing = await selectOne<ExistingProductRow>(
    `SELECT CAST(p.id AS CHAR) AS id
     FROM products p
     LEFT JOIN product_variants v ON v.product_id = p.id
     WHERE (p.slug = ? OR v.sku = ?) ${ignoredProductId ? "AND p.id != ?" : ""}
     LIMIT 1`,
    ignoredProductId ? [slug, sku, ignoredProductId] : [slug, sku],
  );
  return Boolean(existing);
}

export async function createProductAction(formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseProductForm(formData);
  if (!parsed.success) redirect("/admin/products/new?error=invalid");
  const product = parsed.data;
  if (await hasCatalogConflict(product.slug, product.sku)) redirect("/admin/products/new?error=duplicate");

  const productId = await withTransaction(async (connection) => {
    const created = await executeMutation(
      `INSERT INTO products
         (name, slug, product_type, status, short_description, description, brand, inspired_by,
          audience, fragrance_notes_json, featured, track_inventory, seo_title, seo_description, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, IF(? = 'ACTIVE', CURRENT_TIMESTAMP(3), NULL))`,
      [product.name, product.slug, product.productType, product.status, product.shortDescription,
       product.description, product.brand, product.inspiredBy, product.audience, JSON.stringify(product.notes),
       product.featured, product.trackInventory, product.seoTitle, product.seoDescription, product.status],
      connection,
    );
    const id = String(created.insertId);
    await executeMutation(
      `INSERT INTO product_variants
         (product_id, title, sku, price_pence, compare_at_price_pence, stock_on_hand,
          low_stock_threshold, weight_grams, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [id, product.variantTitle, product.sku, product.pricePence, product.compareAtPricePence,
       product.stockOnHand, product.lowStockThreshold, product.weightGrams],
      connection,
    );
    if (product.imageUrl) {
      await executeMutation(
        "INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, 0)",
        [id, product.imageUrl, product.imageAlt], connection,
      );
    }
    if (product.videoUrl) await executeMutation("INSERT INTO product_videos (product_id, url, sort_order) VALUES (?, ?, 0)", [id, product.videoUrl], connection);
    for (const categoryId of product.categoryIds) {
      await executeMutation("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [id, categoryId], connection);
    }
    for (const collectionId of product.collectionIds) {
      await executeMutation("INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)", [id, collectionId], connection);
    }
    return id;
  });

  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: administrator.id, action: "PRODUCT_CREATE", entityType: "product", entityId: productId, summary: `Created product ${product.name}`, ipAddress: metadata.ipAddress });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function updateProductAction(productId: string, formData: FormData): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(productId)) redirect("/admin/products");
  const parsed = parseProductForm(formData);
  if (!parsed.success) redirect(`/admin/products/${productId}?error=invalid`);
  const product = parsed.data;
  if (await hasCatalogConflict(product.slug, product.sku, productId)) redirect(`/admin/products/${productId}?error=duplicate`);

  await withTransaction(async (connection) => {
    await executeMutation(
      `UPDATE products SET
         name = ?, slug = ?, product_type = ?, status = ?, short_description = ?, description = ?,
         brand = ?, inspired_by = ?, audience = ?, fragrance_notes_json = ?, featured = ?,
         track_inventory = ?, seo_title = ?, seo_description = ?,
         published_at = CASE WHEN ? = 'ACTIVE' THEN COALESCE(published_at, CURRENT_TIMESTAMP(3)) ELSE published_at END
       WHERE id = ?`,
      [product.name, product.slug, product.productType, product.status, product.shortDescription,
       product.description, product.brand, product.inspiredBy, product.audience, JSON.stringify(product.notes),
       product.featured, product.trackInventory, product.seoTitle, product.seoDescription, product.status, productId],
      connection,
    );
    await executeMutation(
      `UPDATE product_variants SET title = ?, sku = ?, price_pence = ?, compare_at_price_pence = ?,
         stock_on_hand = ?, low_stock_threshold = ?, weight_grams = ?
       WHERE product_id = ? AND is_default = 1`,
      [product.variantTitle, product.sku, product.pricePence, product.compareAtPricePence,
       product.stockOnHand, product.lowStockThreshold, product.weightGrams, productId], connection,
    );
    await executeMutation("DELETE FROM product_categories WHERE product_id = ?", [productId], connection);
    await executeMutation("DELETE FROM product_collections WHERE product_id = ?", [productId], connection);
    for (const categoryId of product.categoryIds) {
      await executeMutation("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", [productId, categoryId], connection);
    }
    for (const collectionId of product.collectionIds) {
      await executeMutation("INSERT INTO product_collections (product_id, collection_id) VALUES (?, ?)", [productId, collectionId], connection);
    }
    const firstImage = await selectOne<ExistingProductRow>("SELECT CAST(id AS CHAR) AS id FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1", [productId], connection);
    if (product.imageUrl && firstImage) {
      await executeMutation("UPDATE product_images SET url = ?, alt_text = ? WHERE id = ?", [product.imageUrl, product.imageAlt, firstImage.id], connection);
    } else if (product.imageUrl) {
      await executeMutation("INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, 0)", [productId, product.imageUrl, product.imageAlt], connection);
    } else if (firstImage) {
      await executeMutation("DELETE FROM product_images WHERE id = ?", [firstImage.id], connection);
    }
    const firstVideo = await selectOne<ExistingProductRow>("SELECT CAST(id AS CHAR) AS id FROM product_videos WHERE product_id = ? ORDER BY sort_order, id LIMIT 1", [productId], connection);
    if (product.videoUrl && firstVideo) await executeMutation("UPDATE product_videos SET url = ? WHERE id = ?", [product.videoUrl, firstVideo.id], connection);
    else if (product.videoUrl) await executeMutation("INSERT INTO product_videos (product_id, url, sort_order) VALUES (?, ?, 0)", [productId, product.videoUrl], connection);
    else if (firstVideo) await executeMutation("DELETE FROM product_videos WHERE id = ?", [firstVideo.id], connection);
  });

  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: administrator.id, action: "PRODUCT_UPDATE", entityType: "product", entityId: productId, summary: `Updated product ${product.name}`, ipAddress: metadata.ipAddress });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function archiveProductAction(productId: string): Promise<void> {
  const administrator = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(productId)) return;
  await executeMutation("UPDATE products SET status = 'ARCHIVED' WHERE id = ?", [productId]);
  const metadata = await getRequestMetadata();
  await writeAuditLog({ administratorId: administrator.id, action: "PRODUCT_ARCHIVE", entityType: "product", entityId: productId, summary: "Archived product", ipAddress: metadata.ipAddress });
  revalidatePath("/admin/products");
}
