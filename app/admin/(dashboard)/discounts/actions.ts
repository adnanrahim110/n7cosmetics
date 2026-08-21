"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString, formStringList, isDatabaseId, nullableFormString, poundsToPence } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

const schema = z.object({
  name: z.string().min(2).max(190), method: z.enum(["AUTOMATIC", "COUPON"]),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.number().int().min(0), appliesTo: z.enum(["ALL", "PRODUCTS", "CATEGORIES", "COLLECTIONS"]),
  minimumSubtotalPence: z.number().int().nonnegative().nullable(), maximumDiscountPence: z.number().int().nonnegative().nullable(),
  priority: z.number().int().min(-100000).max(100000), startsAt: z.date().nullable(), endsAt: z.date().nullable(), isActive: z.boolean(),
  productIds: z.array(z.string().regex(/^[1-9]\d*$/)), categoryIds: z.array(z.string().regex(/^[1-9]\d*$/)), collectionIds: z.array(z.string().regex(/^[1-9]\d*$/)),
}).refine((item) => !item.startsAt || !item.endsAt || item.endsAt > item.startsAt, { message: "End must follow start" });

function optionalMoney(formData: FormData, key: string): number | null | undefined { const raw = formString(formData, key); return raw ? (poundsToPence(raw) ?? undefined) : null; }
function optionalDate(value: string | null): Date | null { if (!value) return null; const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
function parse(formData: FormData) {
  const type = formString(formData, "discountType"); const rawValue = formString(formData, "value");
  const value = type === "FIXED_AMOUNT" ? poundsToPence(rawValue) : type === "FREE_SHIPPING" ? 0 : Number(rawValue);
  return schema.safeParse({ name: formString(formData, "name"), method: formString(formData, "method"), discountType: type, value,
    appliesTo: formString(formData, "appliesTo"), minimumSubtotalPence: optionalMoney(formData, "minimumSubtotal"), maximumDiscountPence: optionalMoney(formData, "maximumDiscount"),
    priority: Number(formString(formData, "priority")), startsAt: optionalDate(nullableFormString(formData, "startsAt")), endsAt: optionalDate(nullableFormString(formData, "endsAt")), isActive: formCheckbox(formData, "isActive"),
    productIds: formStringList(formData, "productIds"), categoryIds: formStringList(formData, "categoryIds"), collectionIds: formStringList(formData, "collectionIds") });
}
async function syncTargets(id: string, item: z.infer<typeof schema>, connection: Parameters<typeof executeMutation>[2]) { await executeMutation("DELETE FROM discount_products WHERE discount_id = ?", [id], connection); await executeMutation("DELETE FROM discount_categories WHERE discount_id = ?", [id], connection); await executeMutation("DELETE FROM discount_collections WHERE discount_id = ?", [id], connection); if (item.appliesTo === "PRODUCTS") for (const target of item.productIds) await executeMutation("INSERT INTO discount_products (discount_id, product_id) VALUES (?, ?)", [id, target], connection); if (item.appliesTo === "CATEGORIES") for (const target of item.categoryIds) await executeMutation("INSERT INTO discount_categories (discount_id, category_id) VALUES (?, ?)", [id, target], connection); if (item.appliesTo === "COLLECTIONS") for (const target of item.collectionIds) await executeMutation("INSERT INTO discount_collections (discount_id, collection_id) VALUES (?, ?)", [id, target], connection); }
async function audit(id: string, action: string, summary: string) { const [admin, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]); await writeAuditLog({ administratorId: admin.id, action, entityType: "discount", entityId: id, summary, ipAddress: metadata.ipAddress }); }

export async function createDiscountAction(formData: FormData): Promise<void> { await requireAdministrator(["OWNER", "MANAGER"]); const parsed = parse(formData); if (!parsed.success) redirect("/admin/discounts?error=invalid"); const item = parsed.data; const id = await withTransaction(async (connection) => { const result = await executeMutation(`INSERT INTO discounts (name, method, discount_type, value, applies_to, minimum_subtotal_pence, maximum_discount_pence, priority, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [item.name, item.method, item.discountType, item.value, item.appliesTo, item.minimumSubtotalPence, item.maximumDiscountPence, item.priority, item.startsAt, item.endsAt, item.isActive], connection); const id = String(result.insertId); await syncTargets(id, item, connection); return id; }); await audit(id, "DISCOUNT_CREATE", `Created discount ${item.name}`); revalidatePath("/admin/discounts"); redirect("/admin/discounts?saved=1"); }
export async function updateDiscountAction(id: string, formData: FormData): Promise<void> { await requireAdministrator(["OWNER", "MANAGER"]); if (!isDatabaseId(id)) return; const parsed = parse(formData); if (!parsed.success) redirect("/admin/discounts?error=invalid"); const item = parsed.data; await withTransaction(async (connection) => { await executeMutation(`UPDATE discounts SET name = ?, method = ?, discount_type = ?, value = ?, applies_to = ?, minimum_subtotal_pence = ?, maximum_discount_pence = ?, priority = ?, starts_at = ?, ends_at = ?, is_active = ? WHERE id = ?`, [item.name, item.method, item.discountType, item.value, item.appliesTo, item.minimumSubtotalPence, item.maximumDiscountPence, item.priority, item.startsAt, item.endsAt, item.isActive, id], connection); await syncTargets(id, item, connection); }); await audit(id, "DISCOUNT_UPDATE", `Updated discount ${item.name}`); revalidatePath("/admin/discounts"); redirect("/admin/discounts?saved=1"); }
