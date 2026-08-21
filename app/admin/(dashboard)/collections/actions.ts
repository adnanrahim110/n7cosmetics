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
const collectionSchema = z.object({
  name: z.string().min(2).max(150), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(190),
  description: z.string().max(10000).nullable(), imageUrl: mediaUrlSchema.nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]), sortOrder: z.number().int().min(-100000).max(100000),
  seoTitle: z.string().max(190).nullable(), seoDescription: z.string().max(320).nullable(),
});

function parseCollection(formData: FormData) { const name = formString(formData, "name"); return collectionSchema.safeParse({ name, slug: slugify(formString(formData, "slug") || name), description: nullableFormString(formData, "description"), imageUrl: nullableFormString(formData, "imageUrl"), status: formString(formData, "status"), sortOrder: Number(formString(formData, "sortOrder")), seoTitle: nullableFormString(formData, "seoTitle"), seoDescription: nullableFormString(formData, "seoDescription") }); }

async function audit(id: string, action: string, summary: string) { const [admin, metadata] = await Promise.all([requireAdministrator(["OWNER", "MANAGER"]), getRequestMetadata()]); await writeAuditLog({ administratorId: admin.id, action, entityType: "collection", entityId: id, summary, ipAddress: metadata.ipAddress }); }

export async function createCollectionAction(formData: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]); const parsed = parseCollection(formData); if (!parsed.success) redirect("/admin/collections?error=invalid"); const item = parsed.data;
  const result = await executeMutation(`INSERT INTO collections (name, slug, description, image_url, status, sort_order, seo_title, seo_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [item.name, item.slug, item.description, item.imageUrl, item.status, item.sortOrder, item.seoTitle, item.seoDescription]).catch(() => null);
  if (!result) redirect("/admin/collections?error=duplicate"); await audit(String(result.insertId), "COLLECTION_CREATE", `Created collection ${item.name}`); revalidatePath("/admin/collections"); redirect("/admin/collections?saved=1");
}

export async function updateCollectionAction(id: string, formData: FormData): Promise<void> {
  await requireAdministrator(["OWNER", "MANAGER"]); if (!isDatabaseId(id)) return; const parsed = parseCollection(formData); if (!parsed.success) redirect("/admin/collections?error=invalid"); const item = parsed.data;
  const result = await executeMutation(`UPDATE collections SET name = ?, slug = ?, description = ?, image_url = ?, status = ?, sort_order = ?, seo_title = ?, seo_description = ? WHERE id = ?`, [item.name, item.slug, item.description, item.imageUrl, item.status, item.sortOrder, item.seoTitle, item.seoDescription, id]).catch(() => null);
  if (!result) redirect("/admin/collections?error=duplicate"); await audit(id, "COLLECTION_UPDATE", `Updated collection ${item.name}`); revalidatePath("/admin/collections"); redirect("/admin/collections?saved=1");
}
