import { randomUUID } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { executeMutation, selectOne, selectRows } from "../db/query";
import { withTransaction } from "../db/transaction";
import { decryptSecret, encryptSecret } from "../security/encryption";
import { getSmtpSettings, logEmail, sendProjectEmail, type EmailSendResult, type ProjectEmail } from "./service";
import { getEmailPreferences } from "./brand";
import { notificationRecipients, type NotificationType } from "./settings";
import { renderOrderMessage } from "./order-message";
import type { OrderEmailKind } from "./templates";
import { getApplicationConfig } from "../env";

export const MAX_EMAIL_ATTEMPTS = 5;
export function retryDelaySeconds(attempt: number): number { return Math.min(3600, 60 * 5 ** Math.max(0, attempt - 1)); }

export async function enqueueEmail(email: ProjectEmail, options: { dedupeKey: string; expiresAt?: Date; subscriberId?: string; orderId?: string; orderKind?: OrderEmailKind }, connection?: PoolConnection): Promise<string> {
  const result = await executeMutation(`INSERT INTO email_jobs (dedupe_key, recipient, subject, template_key, payload_encrypted, expires_at, subscriber_id, order_id, order_email_kind)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`, [options.dedupeKey, email.to, email.subject, email.templateKey, encryptSecret(JSON.stringify(email)), options.expiresAt ?? null, options.subscriberId ?? null, options.orderId ?? null, options.orderKind ?? null], connection);
  return String(result.insertId);
}

export async function cancelRecipientEmails(templateKey: string, recipient: string, connection?: PoolConnection): Promise<void> {
  await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL WHERE template_key = ? AND recipient = ? AND status IN ('PENDING','FAILED','PROCESSING')", [templateKey, recipient], connection);
}

export async function supersedeOrderStatusEmails(orderId: string, connection: PoolConnection): Promise<void> {
  // Keep sent history and active SMTP attempts; stale worker claims are checked
  // again against newer jobs after rendering, before they can send.
  await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, last_error = 'Superseded by a newer order status update.' WHERE order_id = ? AND order_email_kind IN ('update', 'team-update') AND status IN ('PENDING', 'FAILED')", [orderId], connection);
}

interface Job extends RowDataPacket { dedupe_key: string; order_id: string | null; order_email_kind: string | null; id: string; recipient: string; subject: string; template_key: string; payload_encrypted: string | null; attempts: number; expires_at: Date | null; subscriber_id: string | null }

export async function retryQueuedEmail(id: string, allowPasswordReset: boolean): Promise<boolean> {
  return withTransaction(async (connection) => {
    const job = await selectOne<Job & { status: string }>(`SELECT *, CAST(id AS CHAR) AS id FROM email_jobs WHERE id = ? AND status IN ('FAILED','PENDING','SENT')
      AND payload_encrypted IS NOT NULL AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP(3))
      AND template_key NOT IN ('newsletter-confirmation','newsletter-welcome') AND (? = 1 OR template_key <> 'admin-password-reset') FOR UPDATE`, [id, allowPasswordReset], connection);
    if (!job?.payload_encrypted) return false;
    if (job.status === "SENT") {
      const email = await currentOrderEmail(job, JSON.parse(decryptSecret(job.payload_encrypted)) as ProjectEmail, connection);
      if (!email) return false;
      delete email.messageId;
      await enqueueEmail(email, { dedupeKey: `resend:${job.id}:${randomUUID()}`, expiresAt: job.expires_at || undefined, orderId: job.order_id ?? undefined, orderKind: orderKind(job.order_email_kind) }, connection);
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
      const email = await currentOrderEmail(job, JSON.parse(decryptSecret(job.payload_encrypted)) as ProjectEmail);
      if (!email) {
        await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL WHERE id = ? AND lock_token = ?", [job.id, token]);
        continue;
      }
      const legacyTypes: Record<string, NotificationType> = { "new-order-team": "new_order", "storefront-contact": "enquiry", "order-update-team": "order_update", "payment-failure-team": "payment_failure", "low-stock-team": "low_stock" };
      const type = email.notificationType || legacyTypes[email.templateKey];
      if (type && !notificationRecipients((await getEmailPreferences()).notifications, type).includes(email.to.toLowerCase())) {
        await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, lock_token = NULL, locked_at = NULL, last_error = 'Notification disabled or recipient removed.' WHERE id = ? AND lock_token = ?", [job.id, token]);
        continue;
      }
      // Keep the identifier stable when the SMTP provider or sender changes.
      email.messageId = `<n7-job-${job.id}@${new URL(getApplicationConfig().appUrl).hostname}>`;
      // Record exactly what this attempt sends, and respect a concurrent cancellation.
      const current = await executeMutation("UPDATE email_jobs SET subject = ?, payload_encrypted = ? WHERE id = ? AND lock_token = ? AND status = 'PROCESSING'", [email.subject, encryptSecret(JSON.stringify(email)), job.id, token]);
      if (!current.affectedRows) continue;
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

function orderKind(value: string | null): OrderEmailKind | undefined {
  return value === "confirmation" || value === "update" || value === "address" || value === "team" || value === "team-update" || value === "team-address" ? value : undefined;
}

async function currentOrderEmail(job: Job, saved: ProjectEmail, connection?: PoolConnection): Promise<ProjectEmail | null> {
  const context = await orderEmailContext(job, connection);
  if (!context) return saved;
  job.order_id = context.orderId;
  job.order_email_kind = context.kind;
  const current = await renderOrderMessage(context.orderId, context.kind, connection);
  if (current && (context.kind === "update" || context.kind === "team-update")) {
    // Read after rendering: if the renderer saw a newer committed status, its
    // replacement job is now visible too. Compare per recipient so every team
    // member still receives the latest update.
    const newer = await selectOne<RowDataPacket>("SELECT id FROM email_jobs WHERE order_id = ? AND order_email_kind = ? AND recipient = ? AND id > ? AND status <> 'CANCELLED' LIMIT 1", [context.orderId, context.kind, saved.to, job.id], connection);
    if (newer) return null;
  }
  return current ? { ...saved, ...current.email, to: saved.to, notificationType: saved.notificationType } : null;
}

async function orderEmailContext(job: Job, connection?: PoolConnection): Promise<{ orderId: string; kind: OrderEmailKind } | null> {
  let current: Job | null = job;
  const visited = new Set<string>();
  const templates: Record<string, OrderEmailKind | undefined> = { "order-confirmation": "confirmation", "order-status-update": "update", "new-order-team": "team", "order-update-team": "team-update", "order-address-updated": "address", "order-address-team": "team-address" };
  // Older resends can point to another resend. Follow only explicit job references.
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const kind = orderKind(current.order_email_kind);
    if (current.order_id && kind) return { orderId: current.order_id, kind };
    const order = /^(?:order:|notification:(?:new_order|order_update):order:)([1-9]\d*):/.exec(current.dedupe_key);
    const templateKind = templates[current.template_key];
    if (order && templateKind) return { orderId: order[1], kind: templateKind };
    const original = /^resend:([1-9]\d*):/.exec(current.dedupe_key);
    if (!original) return null;
    current = await selectOne<Job>("SELECT *, CAST(id AS CHAR) AS id FROM email_jobs WHERE id = ?", [original[1]], connection);
  }
  return null;
}
