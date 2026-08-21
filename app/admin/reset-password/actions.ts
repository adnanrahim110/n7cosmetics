"use server";

import { createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { formString } from "@/lib/admin/form";
import { strongPasswordSchema } from "@/lib/auth/password";
import { getRequestMetadata } from "@/lib/auth/request";
import { writeAuditLog } from "@/lib/auth/audit";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";

interface ResetRow extends RowDataPacket { id: string; administrator_id: string }

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const token = formString(formData, "token");
  const password = formString(formData, "password");
  const confirmation = formString(formData, "passwordConfirmation");
  const parsed = strongPasswordSchema.safeParse(password);
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token) || !parsed.success || password !== confirmation) redirect(`/admin/reset-password?token=${encodeURIComponent(token)}&error=password`);
  const passwordHash = await hash(password, 12);
  const reset = await withTransaction(async (connection) => {
    const row = await selectOne<ResetRow>("SELECT CAST(id AS CHAR) AS id, CAST(administrator_id AS CHAR) AS administrator_id FROM administrator_password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP(3) LIMIT 1 FOR UPDATE", [createHash("sha256").update(token).digest("hex")], connection);
    if (!row) return null;
    const updated = await executeMutation("UPDATE administrators SET password_hash = ? WHERE id = ? AND status = 'ACTIVE'", [passwordHash, row.administrator_id], connection);
    if (updated.affectedRows !== 1) return null;
    await executeMutation("UPDATE administrator_password_resets SET used_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [row.id], connection);
    await executeMutation("UPDATE admin_sessions SET revoked_at = CURRENT_TIMESTAMP(3) WHERE administrator_id = ? AND revoked_at IS NULL", [row.administrator_id], connection);
    return row;
  });
  if (!reset) redirect("/admin/reset-password?error=invalid");
  const metadata = await getRequestMetadata(); await writeAuditLog({ administratorId: reset.administrator_id, action: "ADMIN_PASSWORD_RESET", entityType: "administrator", entityId: reset.administrator_id, summary: "Administrator reset password by email", ipAddress: metadata.ipAddress });
  redirect("/admin/login?reset=1");
}
