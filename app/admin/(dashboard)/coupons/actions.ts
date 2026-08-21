"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formCheckbox, formString, isDatabaseId, nullableFormString } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";

const schema = z.object({ discountId: z.string().regex(/^[1-9]\d*$/), code: z.string().regex(/^[A-Z0-9_-]+$/).max(80), usageLimit: z.number().int().positive().nullable(), perEmailLimit: z.number().int().positive().nullable(), isActive: z.boolean() });
function optionalPositive(value: string | null) { if (!value) return null; return Number(value); }
function parse(formData: FormData) { return schema.safeParse({ discountId: formString(formData, "discountId"), code: formString(formData, "code").toUpperCase(), usageLimit: optionalPositive(nullableFormString(formData, "usageLimit")), perEmailLimit: optionalPositive(nullableFormString(formData, "perEmailLimit")), isActive: formCheckbox(formData, "isActive") }); }
async function audit(id: string, action: string, summary: string) { const [admin, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]); await writeAuditLog({ administratorId: admin.id, action, entityType: "coupon", entityId: id, summary, ipAddress: metadata.ipAddress }); }
export async function createCouponAction(formData: FormData): Promise<void> { await requireAdministrator(["OWNER", "MANAGER"]); const parsed = parse(formData); if (!parsed.success) redirect("/admin/coupons?error=invalid"); const item = parsed.data; const result = await executeMutation("INSERT INTO coupons (discount_id, code, usage_limit, per_email_limit, is_active) VALUES (?, ?, ?, ?, ?)", [item.discountId, item.code, item.usageLimit, item.perEmailLimit, item.isActive]).catch(() => null); if (!result) redirect("/admin/coupons?error=duplicate"); await audit(String(result.insertId), "COUPON_CREATE", `Created coupon ${item.code}`); revalidatePath("/admin/coupons"); redirect("/admin/coupons?saved=1"); }
export async function updateCouponAction(id: string, formData: FormData): Promise<void> { await requireAdministrator(["OWNER", "MANAGER"]); if (!isDatabaseId(id)) return; const parsed = parse(formData); if (!parsed.success) redirect("/admin/coupons?error=invalid"); const item = parsed.data; const result = await executeMutation("UPDATE coupons SET discount_id = ?, code = ?, usage_limit = ?, per_email_limit = ?, is_active = ? WHERE id = ?", [item.discountId, item.code, item.usageLimit, item.perEmailLimit, item.isActive, id]).catch(() => null); if (!result) redirect("/admin/coupons?error=duplicate"); await audit(id, "COUPON_UPDATE", `Updated coupon ${item.code}`); revalidatePath("/admin/coupons"); redirect("/admin/coupons?saved=1"); }
