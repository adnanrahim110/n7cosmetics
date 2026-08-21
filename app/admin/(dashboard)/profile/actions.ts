"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { formString } from "@/lib/admin/form";
import { writeAuditLog } from "@/lib/auth/audit";
import { strongPasswordSchema } from "@/lib/auth/password";
import { getRequestMetadata } from "@/lib/auth/request";
import { requireAdministrator } from "@/lib/auth/session";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

interface PasswordRow extends RowDataPacket { password_hash: string }
const profileSchema = z.object({ name: z.string().trim().min(2).max(120), email: z.email().max(190).transform((value) => value.trim().toLowerCase()) });

export async function updateProfileAction(formData: FormData): Promise<void> {
  const admin = await requireAdministrator();
  const parsed = profileSchema.safeParse({ name: formString(formData, "name"), email: formString(formData, "email") });
  if (!parsed.success) redirect("/admin/profile?error=details");
  const result = await executeMutation("UPDATE administrators SET name = ?, email = ? WHERE id = ?", [parsed.data.name, parsed.data.email, admin.id]).catch(() => null);
  if (!result) redirect("/admin/profile?error=email");
  const metadata = await getRequestMetadata(); await writeAuditLog({ administratorId: admin.id, action: "ADMIN_PROFILE_UPDATE", entityType: "administrator", entityId: admin.id, summary: "Updated administrator profile", ipAddress: metadata.ipAddress });
  revalidatePath("/admin", "layout"); redirect("/admin/profile?saved=1");
}

export async function updatePasswordAction(formData: FormData): Promise<void> {
  const admin = await requireAdministrator();
  const currentPassword = formString(formData, "currentPassword"); const password = formString(formData, "password"); const confirmation = formString(formData, "passwordConfirmation");
  const parsed = strongPasswordSchema.safeParse(password);
  if (!parsed.success || password !== confirmation) redirect("/admin/profile?password-error=weak");
  const row = await selectOne<PasswordRow>("SELECT password_hash FROM administrators WHERE id = ? LIMIT 1", [admin.id]);
  if (!row || !await compare(currentPassword, row.password_hash)) redirect("/admin/profile?password-error=current");
  const passwordHash = await hash(password, 12);
  await withTransaction(async (connection) => { await executeMutation("UPDATE administrators SET password_hash = ? WHERE id = ?", [passwordHash, admin.id], connection); await executeMutation("UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE administrator_id = ? AND revoked_at IS NULL", [admin.id], connection); });
  const metadata = await getRequestMetadata(); await writeAuditLog({ administratorId: admin.id, action: "ADMIN_PASSWORD_CHANGE", entityType: "administrator", entityId: admin.id, summary: "Administrator changed password", ipAddress: metadata.ipAddress });
  redirect("/admin/login?password-changed=1");
}
