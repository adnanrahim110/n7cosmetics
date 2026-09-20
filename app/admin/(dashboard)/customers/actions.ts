"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { executeMutation } from "@/lib/db/query";
const schema = z.object({ id: z.string().regex(/^[1-9]\d*$/), name: z.string().trim().min(1).max(255), email: z.union([z.email().max(320), z.literal("")]), phone: z.string().trim().max(100), notes: z.string().trim().max(10000) });
export async function updateCustomerAction(id: string, form: FormData) {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const parsed = schema.safeParse({ id, name: form.get("name"), email: String(form.get("email") ?? "").trim().toLowerCase(), phone: form.get("phone"), notes: form.get("notes") });
  if (!parsed.success) redirect(`/admin/customers/${encodeURIComponent(id)}?error=invalid`);
  const data = parsed.data;
  try { await executeMutation("UPDATE customers SET full_name=?,email=?,phone=?,admin_notes=? WHERE id=?", [data.name, data.email || null, data.phone || null, data.notes || null, id]); }
  catch (error) { if ((error as { code?: string }).code === "ER_DUP_ENTRY") redirect(`/admin/customers/${id}?error=email`); throw error; }
  await writeAuditLog({ administratorId: admin.id, action: "CUSTOMER_UPDATE", entityType: "customer", entityId: id, summary: "Updated customer contact details" });
  revalidatePath("/admin/customers"); revalidatePath(`/admin/customers/${id}`); redirect(`/admin/customers/${id}?saved=1`);
}
