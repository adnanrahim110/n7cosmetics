"use server";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString, formStringList, isDatabaseId, slugify } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne, selectRows } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const productId = z.string().regex(/^[1-9]\d*$/);
const saleSchema = z.object({
  name: z.string().trim().min(2).max(190),
  offerType: z.literal("BUY_X_GET_Y_FREE"),
  buyQuantity: z.number().int().min(2).max(99),
  freeQuantity: z.number().int().min(1).max(98),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  sortOrder: z.number().int().min(-100000).max(100000),
  productIds: z.array(productId).min(1).max(100),
}).superRefine((value, context) => {
  if (value.freeQuantity >= value.buyQuantity) {
    context.addIssue({
      code: "custom",
      path: ["freeQuantity"],
      message: "The free quantity must be lower than the qualifying quantity.",
    });
  }
  if (new Set(value.productIds).size !== value.productIds.length) {
    context.addIssue({
      code: "custom",
      path: ["productIds"],
      message: "Products cannot be selected more than once.",
    });
  }
});

interface ProductIdRow extends RowDataPacket { id: string }
interface SlugRow extends RowDataPacket { id: string }

function parse(formData: FormData) {
  return saleSchema.safeParse({
    name: formString(formData, "name"),
    offerType: formString(formData, "offerType"),
    buyQuantity: Number(formString(formData, "buyQuantity")),
    freeQuantity: Number(formString(formData, "freeQuantity")),
    status: formString(formData, "status"),
    sortOrder: Number(formString(formData, "sortOrder")),
    productIds: formStringList(formData, "productIds"),
  });
}

async function validateProducts(ids: string[]): Promise<boolean> {
  const rows = await selectRows<ProductIdRow>(
    `SELECT CAST(id AS CHAR) AS id FROM products
     WHERE product_type = 'STANDARD' AND status != 'ARCHIVED'
       AND id IN (${ids.map(() => "?").join(", ")})`,
    ids,
  );
  const found = new Set(rows.map((row) => row.id));
  return ids.every((id) => found.has(id));
}

async function uniqueSlug(name: string, excludedId?: string): Promise<string> {
  const base = slugify(name) || "sale";
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const value = suffix ? `${base.slice(0, 185)}-${suffix + 1}` : base;
    const existing = await selectOne<SlugRow>(
      `SELECT CAST(id AS CHAR) AS id FROM sales WHERE slug = ?${excludedId ? " AND id != ?" : ""} LIMIT 1`,
      excludedId ? [value, excludedId] : [value],
    );
    if (!existing) return value;
  }
  throw new Error("Unable to generate a unique sale address.");
}

async function syncProducts(
  saleId: string,
  productIds: string[],
  connection: PoolConnection,
): Promise<void> {
  await executeMutation("DELETE FROM sale_products WHERE sale_id = ?", [saleId], connection);
  for (const [index, id] of productIds.entries()) {
    await executeMutation(
      "INSERT INTO sale_products (sale_id, product_id, sort_order) VALUES (?, ?, ?)",
      [saleId, id, index],
      connection,
    );
  }
}

async function audit(id: string, action: string, summary: string): Promise<void> {
  const [administrator, metadata] = await Promise.all([
    requireAdministrator(["OWNER", "MANAGER"]),
    getRequestMetadata(),
  ]);
  await writeAuditLog({
    administratorId: administrator.id,
    action,
    entityType: "sale",
    entityId: id,
    summary,
    ipAddress: metadata.ipAddress,
  });
}

function revalidateSaleSurfaces(id?: string): void {
  revalidatePath("/sale/[slug]", "page");
  revalidatePath("/", "layout");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/pages");
  revalidatePath("/admin/homepage");
  if (id) revalidatePath(`/admin/pages/sale-${id}`);
}

export async function createSaleAction(formData: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parse(formData);
  if (!parsed.success || !(await validateProducts(parsed.data.productIds))) {
    redirect("/admin/sales?error=invalid");
  }
  const item = parsed.data;
  const slug = await uniqueSlug(item.name);
  let saleId = "";
  try {
    saleId = await withTransaction(async (connection) => {
      const result = await executeMutation(
        `INSERT INTO sales (name, slug, status, offer_type, buy_quantity, free_quantity, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.name, slug, item.status, item.offerType, item.buyQuantity, item.freeQuantity, item.sortOrder],
        connection,
      );
      const id = String(result.insertId);
      await syncProducts(id, item.productIds, connection);
      return id;
    });
  } catch (error) {
    console.error("Unable to create sale", error);
    redirect("/admin/sales?error=save");
  }
  await audit(saleId, "SALE_CREATE", `Created sale ${item.name}`);
  revalidateSaleSurfaces(saleId);
  redirect(`/admin/sales?saved=created&sale=${saleId}`);
}

export async function updateSaleAction(id: string, formData: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(id)) return;
  const parsed = parse(formData);
  if (!parsed.success || !(await validateProducts(parsed.data.productIds))) {
    redirect(`/admin/sales?error=invalid&sale=${id}`);
  }
  const item = parsed.data;
  const slug = await uniqueSlug(item.name, id);
  try {
    await withTransaction(async (connection) => {
      const updated = await executeMutation(
        `UPDATE sales SET name = ?, slug = ?, status = ?, offer_type = ?,
           buy_quantity = ?, free_quantity = ?, sort_order = ? WHERE id = ?`,
        [item.name, slug, item.status, item.offerType, item.buyQuantity, item.freeQuantity, item.sortOrder, id],
        connection,
      );
      if (updated.affectedRows !== 1) throw new Error("Sale not found.");
      await syncProducts(id, item.productIds, connection);
    });
  } catch (error) {
    console.error("Unable to update sale", error);
    redirect(`/admin/sales?error=save&sale=${id}`);
  }
  await audit(id, "SALE_UPDATE", `Updated sale ${item.name}`);
  revalidateSaleSurfaces(id);
  redirect(`/admin/sales?saved=updated&sale=${id}`);
}
