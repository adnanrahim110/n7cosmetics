"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { z } from "zod";
import { formString } from "@/lib/admin/form";
import { getRequestMetadata } from "@/lib/auth/request";
import { executeMutation, selectOne } from "@/lib/db/query";
import { sendProjectEmail } from "@/lib/email/service";
import { getApplicationConfig } from "@/lib/env";

interface AdministratorRow extends RowDataPacket { id: string; name: string; email: string }
interface CountRow extends RowDataPacket { request_count: number | string }
const schema = z.email().max(190).transform((email) => email.trim().toLowerCase());

export async function requestPasswordResetAction(formData: FormData): Promise<void> {
  const parsed = schema.safeParse(formString(formData, "email"));
  const metadata = await getRequestMetadata();
  if (parsed.success) {
    const admin = await selectOne<AdministratorRow>("SELECT CAST(id AS CHAR) AS id, name, email FROM administrators WHERE email = ? AND status = 'ACTIVE' LIMIT 1", [parsed.data]);
    if (admin) {
      const recent = await selectOne<CountRow>("SELECT COUNT(*) AS request_count FROM administrator_password_resets WHERE (administrator_id = ? OR request_ip = ?) AND created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE)", [admin.id, metadata.ipAddress]);
      if (Number(recent?.request_count ?? 0) < 3) {
        const token = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(token).digest("hex");
        await executeMutation("UPDATE administrator_password_resets SET used_at = CURRENT_TIMESTAMP(3) WHERE administrator_id = ? AND used_at IS NULL", [admin.id]);
        await executeMutation("INSERT INTO administrator_password_resets (administrator_id, token_hash, expires_at, request_ip) VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE), ?)", [admin.id, tokenHash, metadata.ipAddress]);
        const resetUrl = `${getApplicationConfig().appUrl}/admin/reset-password?token=${encodeURIComponent(token)}`;
        after(async () => { await sendProjectEmail({ to: admin.email, subject: "Reset your N7 Cosmetics admin password", text: `A password reset was requested for your administrator account. Use this link within 30 minutes: ${resetUrl}\n\nIf you did not request this, ignore this email.`, html: `<p>A password reset was requested for your N7 Cosmetics administrator account.</p><p><a href="${resetUrl}">Reset administrator password</a></p><p>This one-time link expires in 30 minutes. If you did not request it, ignore this email.</p>`, templateKey: "admin-password-reset" }); });
      }
    }
  }
  redirect("/admin/forgot-password?sent=1");
}
