import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { decryptSecret, encryptSecret } from "../security/encryption";
import { getSmtpSettings, logEmail, sendProjectEmail, type EmailSendResult, type ProjectEmail } from "./service";
import { getEmailPreferences } from "./brand";
import { notificationRecipients, type NotificationType } from "./settings";
import { getApplicationConfig } from "../env";

export const MAX_EMAIL_ATTEMPTS = 5;
export function retryDelaySeconds(attempt: number): number { return Math.min(3600, 60 * 5 ** Math.max(0, attempt - 1)); }

export async function enqueueEmail(email: ProjectEmail, options: { dedupeKey: string; expiresAt?: Date; subscriberId?: string }, connection?: PoolConnection): Promise<string> {
  const result = await executeMutation(`INSERT INTO email_jobs (dedupe_key, recipient, subject, template_key, payload_encrypted, expires_at, subscriber_id)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [options.dedupeKey, email.to, email.subject, email.templateKey, encryptSecret(JSON.stringify(email)), options.expiresAt ?? null, options.subscriberId ?? null], connection);
  return String(result.insertId);
}

export async function cancelRecipientEmails(templateKey: string, recipient: string, connection?: PoolConnection): Promise<void> {
  await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL WHERE template_key = ? AND recipient = ? AND status IN ('PENDING','FAILED','PROCESSING')", [templateKey, recipient], connection);
}

interface Job extends RowDataPacket { id: string; recipient: string; subject: string; template_key: string; payload_encrypted: string | null; attempts: number; expires_at: Date | null; subscriber_id: string | null }

export async function retryQueuedEmail(id: string, allowPasswordReset: boolean): Promise<boolean> {
  return withTransaction(async (connection) => {
    const job = await selectOne<Job & { status: string }>(`SELECT *, CAST(id AS CHAR) AS id FROM email_jobs WHERE id = ? AND status IN ('FAILED','PENDING','SENT')
      AND payload_encrypted IS NOT NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP(3))
      AND template_key NOT IN ('newsletter-confirmation','newsletter-welcome') AND (? = 1 OR template_key <> 'admin-password-reset') FOR UPDATE`, [id, allowPasswordReset], connection);
    if (!job?.payload_encrypted) return false;
    if (job.status === "SENT") {
      const email = JSON.parse(decryptSecret(job.payload_encrypted)) as ProjectEmail;
      delete email.messageId;
      await enqueueEmail(email, { dedupeKey: `resend:${job.id}:${randomUUID()}`, expiresAt: job.expires_at || undefined }, connection);
    } else {
      await executeMutation("UPDATE email_jobs SET status = 'PENDING', attempts = 0, available_at = CURRENT_TIMESTAMP(3), last_error = NULL WHERE id = ?", [id], connection);
    }
    return true;
  });
}

export async function processEmailQueue(limit = 10, deliver?: (email: ProjectEmail, jobId?: string) => Promise<EmailSendResult>): Promise<number> {
  await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL, last_error = 'Message expired before delivery.' WHERE expires_at <= CURRENT_TIMESTAMP(3) AND status IN ('PENDING','FAILED','PROCESSING')");
  // Reset and newsletter links do not need to remain recoverable after delivery.
  await executeMutation("UPDATE email_jobs SET payload_encrypted = NULL WHERE expires_at <= CURRENT_TIMESTAMP(3) AND payload_encrypted IS NOT NULL AND status IN ('SENT','CANCELLED')");
  const settings = await getSmtpSettings();
  if (!settings) return 0;
  const candidates = await selectRows<Job>(`SELECT CAST(id AS CHAR) AS id FROM email_jobs WHERE
    (status = 'PENDING' AND available_at <= CURRENT_TIMESTAMP(3)) OR (status = 'PROCESSING' AND locked_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE))
    ORDER BY created_at, id LIMIT ${Math.min(50, Math.max(1, Math.floor(limit)))}`);
  let processed = 0;
  for (const candidate of candidates) {
    const token = randomUUID();
    const claimed = await executeMutation(`UPDATE email_jobs SET status = 'PROCESSING', locked_at = CURRENT_TIMESTAMP(3), lock_token = ? WHERE id = ? AND
      ((status = 'PENDING' AND available_at <= CURRENT_TIMESTAMP(3)) OR (status = 'PROCESSING' AND locked_at < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 5 MINUTE)))`, [token, candidate.id]);
    if (!claimed.affectedRows) continue;
    const job = await selectOne<Job>("SELECT *, CAST(id AS CHAR) AS id, CAST(subscriber_id AS CHAR) AS subscriber_id FROM email_jobs WHERE id = ? AND lock_token = ?", [candidate.id, token]);
    if (!job) continue;
    if (job.expires_at && new Date(job.expires_at).getTime() <= Date.now()) {
      await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL, last_error = 'Message expired before delivery.' WHERE id = ? AND lock_token = ?", [job.id, token]);
      continue;
    }
    if (job.subscriber_id) {
      const subscriber = await selectOne<RowDataPacket & { status: string }>("SELECT status FROM newsletter_subscribers WHERE id = ?", [job.subscriber_id]);
      const expected = job.template_key === "newsletter-confirmation" ? "PENDING" : "ACTIVE";
      if (subscriber?.status !== expected) {
        await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL, last_error = 'Subscription status changed.' WHERE id = ? AND lock_token = ?", [job.id, token]);
        continue;
      }
    }
    let result: EmailSendResult;
    try {
      if (!job.payload_encrypted) throw new Error("No recoverable email content remains.");
      const email = JSON.parse(decryptSecret(job.payload_encrypted)) as ProjectEmail;
      const legacyTypes: Record<string, NotificationType> = { "new-order-team": "new_order", "storefront-contact": "enquiry", "order-update-team": "order_update", "payment-failure-team": "payment_failure", "low-stock-team": "low_stock" };
      const type = email.notificationType || legacyTypes[email.templateKey];
      if (type && !notificationRecipients((await getEmailPreferences()).notifications, type).includes(email.to.toLowerCase())) {
        await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL, last_error = 'Notification disabled or recipient removed.' WHERE id = ? AND lock_token = ?", [job.id, token]);
        continue;
      }
      // Keep the identifier stable when the SMTP provider or sender changes.
      email.messageId = `<n7-job-${job.id}@${new URL(getApplicationConfig().appUrl).hostname}>`;
      result = deliver ? await deliver(email, job.id) : await sendProjectEmail(email, job.id, settings);
    } catch (error) {
      result = { status: "FAILED", error: error instanceof Error ? error.message : "Email could not be delivered." };
      await logEmail({ to: job.recipient, subject: job.subject, templateKey: job.template_key, text: "" }, result, job.id);
    }
    const attempts = job.attempts + (result.status === "SKIPPED" ? 0 : 1);
    const status = result.status === "SENT" ? "SENT" : attempts >= MAX_EMAIL_ATTEMPTS ? "FAILED" : "PENDING";
    await executeMutation(`UPDATE email_jobs SET status = ?, attempts = ?, available_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? SECOND),
      sent_at = CASE WHEN ? = 'SENT' THEN CURRENT_TIMESTAMP(3) ELSE sent_at END, last_error = ?, lock_token = NULL, locked_at = NULL,
      payload_encrypted = CASE WHEN ? = 'SENT' AND template_key IN ('admin-password-reset','newsletter-confirmation','newsletter-welcome') THEN NULL ELSE payload_encrypted END
      WHERE id = ? AND lock_token = ?`, [status, attempts, retryDelaySeconds(attempts), status, result.error?.slice(0, 500) ?? null, status, job.id, token]);
    processed++;
  }
  return processed;
}
