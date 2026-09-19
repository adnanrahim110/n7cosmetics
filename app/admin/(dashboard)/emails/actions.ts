"use server";

import type { RowDataPacket } from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { isDatabaseId } from "@/lib/admin/form";
import { executeMutation, selectOne } from "@/lib/db/query";
import { withTransaction } from "@/lib/db/transaction";
import { kickEmailQueue } from "@/lib/email/kick";
import { retryQueuedEmail } from "@/lib/email/queue";

export async function retryEmailAction(id: string): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(id)) redirect("/admin/emails?error=unavailable");
  if (!await retryQueuedEmail(id, admin.role === "OWNER")) redirect("/admin/emails?error=unavailable");
  await writeAuditLog({ administratorId: admin.id, action: "EMAIL_RETRY", entityType: "email_job", entityId: id, summary: "Requested email delivery again" });
  kickEmailQueue();
  revalidatePath("/admin/emails");
  redirect("/admin/emails?saved=retry");
}

export async function resolveEnquiryAction(id: string): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(id)) redirect("/admin/emails?tab=enquiries");
  await executeMutation("UPDATE contact_enquiries SET status = 'RESOLVED' WHERE id = ?", [id]);
  await writeAuditLog({ administratorId: admin.id, action: "ENQUIRY_RESOLVED", entityType: "contact_enquiry", entityId: id, summary: "Marked customer enquiry resolved" });
  revalidatePath("/admin/emails");
  redirect("/admin/emails?tab=enquiries&saved=resolved");
}

export async function unsubscribeSubscriberAction(id: string): Promise<void> {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  if (!isDatabaseId(id)) redirect("/admin/emails?tab=subscribers");
  await withTransaction(async (connection) => {
    const subscriber = await selectOne<RowDataPacket>("SELECT id FROM newsletter_subscribers WHERE id = ? FOR UPDATE", [id], connection);
    if (!subscriber) return;
    await executeMutation("UPDATE newsletter_subscribers SET status = 'UNSUBSCRIBED', unsubscribed_at = CURRENT_TIMESTAMP(3), confirmation_token_hash = NULL WHERE id = ?", [id], connection);
    await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL WHERE subscriber_id = ? AND status IN ('PENDING','PROCESSING','FAILED')", [id], connection);
  });
  await writeAuditLog({ administratorId: admin.id, action: "NEWSLETTER_UNSUBSCRIBE", entityType: "newsletter_subscriber", entityId: id, summary: "Removed address from fragrance updates" });
  revalidatePath("/admin/emails");
  redirect("/admin/emails?tab=subscribers&saved=unsubscribed");
}
