"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/auth/session";
import { saveEmailCopySettings, type EmailCopySaveResult } from "@/lib/email/copy-store";

export async function saveEmailTemplateAction(key: string, input: unknown, revision: string): Promise<EmailCopySaveResult> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const result = await saveEmailCopySettings(key, input, revision, admin.id);
  if (result.success) revalidatePath("/admin/emails/templates");
  return result;
}
