"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formString, isDatabaseId, nullableFormString, slugify } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation } from "@/lib/db/query";

const mediaUrlSchema = z.string().max(1000).refine((value) => value.startsWith("/") || z.url().safeParse(value).success);
const categorySchema = z.object({
  name: z.string().min(2).max(150),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
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
    imageUrl: nullableFormString(formData, "imageUrl"),
    status: formString(formData, "status"),
    sortOrder: Number(formString(formData, "sortOrder")),
    parentId: nullableFormString(formData, "parentId"),
  });
}

async function audit(categoryId: string, action: string, summary: string): Promise<void> {
  const [administrator, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]);
  await writeAuditLog({ administratorId: administrator.id, action, entityType: "category", entityId: categoryId, summary, ipAddress: metadata.ipAddress });
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = parseCategory(formData);
  if (!parsed.success) redirect("/admin/categories?error=invalid");
  const category = parsed.data;
  const result = await executeMutation(
    `INSERT INTO categories (parent_id, name, slug, description, image_url, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [category.parentId, category.name, category.slug, category.description, category.imageUrl, category.status, category.sortOrder],
  ).catch(() => null);
  if (!result) redirect("/admin/categories?error=duplicate");
  await audit(String(result.insertId), "CATEGORY_CREATE", `Created category ${category.name}`);
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}

export async function updateCategoryAction(categoryId: string, formData: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(categoryId)) return;
  const parsed = parseCategory(formData);
  if (!parsed.success || parsed.data.parentId === categoryId) redirect("/admin/categories?error=invalid");
  const category = parsed.data;
  const result = await executeMutation(
    `UPDATE categories SET parent_id = ?, name = ?, slug = ?, description = ?, image_url = ?, status = ?, sort_order = ? WHERE id = ?`,
    [category.parentId, category.name, category.slug, category.description, category.imageUrl, category.status, category.sortOrder, categoryId],
  ).catch(() => null);
  if (!result) redirect("/admin/categories?error=duplicate");
  await audit(categoryId, "CATEGORY_UPDATE", `Updated category ${category.name}`);
  revalidatePath("/admin/categories");
  redirect("/admin/categories?saved=1");
}
