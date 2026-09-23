import { createHash, randomBytes } from "node:crypto";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { checkoutMarketingNotice } from "../commerce/checkout-preferences";
import { executeMutation, selectOne } from "../db/query";
import { withTransaction } from "../db/transaction";
import { getEmailPreferences } from "./brand";
import { enqueueEmail } from "./queue";
import { newsletterEmail } from "./templates";

export const newsletterConsent = "I agree to receive N7 fragrance updates and offers by email. I can unsubscribe at any time.";
export const newsletterTokenValid = (token: string): boolean => /^[A-Za-z0-9_-]{43}$/.test(token);
export const newsletterTokenHash = (token: string): string => createHash("sha256").update(token).digest("hex");
interface Subscriber extends RowDataPacket { id: string; email: string; status: string; requested_at: Date }

export async function saveCheckoutMarketingPreference(orderId: string, email: string, optOut: boolean | undefined, connection: PoolConnection): Promise<void> {
  if (optOut === undefined) return;
  await executeMutation("UPDATE orders SET marketing_opt_out = ?, marketing_notice = ?, marketing_preference_recorded_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [optOut, checkoutMarketingNotice, orderId], connection);

  const unsubscribeToken = optOut ? null : randomBytes(32).toString("base64url");
  const inserted = await executeMutation(`INSERT IGNORE INTO newsletter_subscribers (email, status, consent_text, marketing_basis, unsubscribe_token_hash, unsubscribed_at)
    VALUES (?, ?, ?, ?, ?, ?)`, [email, optOut ? "UNSUBSCRIBED" : "ACTIVE", checkoutMarketingNotice, optOut ? null : "SOFT_OPT_IN", unsubscribeToken ? newsletterTokenHash(unsubscribeToken) : null, optOut ? new Date() : null], connection);
  const subscriber = await selectOne<Subscriber>("SELECT CAST(id AS CHAR) AS id, email, status FROM newsletter_subscribers WHERE email = ? FOR UPDATE", [email], connection);
  if (!subscriber) throw new Error("Marketing preference could not be saved.");

  if (optOut) {
    await executeMutation("UPDATE newsletter_subscribers SET status = 'UNSUBSCRIBED', unsubscribed_at = COALESCE(unsubscribed_at, CURRENT_TIMESTAMP(3)), confirmation_token_hash = NULL, confirmation_expires_at = NULL WHERE id = ?", [subscriber.id], connection);
    await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, locked_at = NULL, lock_token = NULL WHERE subscriber_id = ? AND status IN ('PENDING','FAILED','PROCESSING')", [subscriber.id], connection);
    return;
  }

  // An untouched opt-out box never overrides a previous unsubscribe or a
  // newsletter signup still awaiting explicit email confirmation.
  if (!inserted.affectedRows || !unsubscribeToken) return;
  const brand = await getEmailPreferences(connection);
  const url = `${brand.appUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;
  await enqueueEmail({ ...newsletterEmail(brand, "checkout", url), to: email, replyTo: brand.replyToEmail, unsubscribeUrl: url, templateKey: "newsletter-welcome" }, { dedupeKey: `checkout-newsletter:${orderId}`, subscriberId: subscriber.id }, connection);
}

export async function subscribeNewsletter(email: string, ipAddress: string): Promise<"accepted" | "limited"> {
  return withTransaction(async (connection) => {
    const attempts = await selectOne<RowDataPacket & { count: number }>("SELECT COUNT(*) AS count FROM newsletter_attempts WHERE ip_address = ? AND created_at > DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 30 MINUTE)", [ipAddress], connection);
    if (Number(attempts?.count) >= 5) return "limited";
    await executeMutation("INSERT INTO newsletter_attempts (ip_address) VALUES (?)", [ipAddress], connection);
    const inserted = await executeMutation("INSERT IGNORE INTO newsletter_subscribers (email, consent_text) VALUES (?, ?)", [email, newsletterConsent], connection);
    const subscriber = await selectOne<Subscriber>("SELECT CAST(id AS CHAR) AS id, email, status, requested_at FROM newsletter_subscribers WHERE email = ? FOR UPDATE", [email], connection);
    if (!subscriber) throw new Error("Subscription could not be saved.");
    if (subscriber.status === "ACTIVE" || (!inserted.affectedRows && Date.now() - new Date(subscriber.requested_at).getTime() < 10 * 60_000)) return "accepted";
    const token = randomBytes(32).toString("base64url");
    const tokenHash = newsletterTokenHash(token);
    await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, locked_at = NULL, lock_token = NULL WHERE subscriber_id = ? AND status IN ('PENDING','FAILED','PROCESSING')", [subscriber.id], connection);
    await executeMutation("UPDATE newsletter_subscribers SET status = 'PENDING', confirmation_token_hash = ?, confirmation_expires_at = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL 48 HOUR), unsubscribe_token_hash = NULL, confirmed_at = NULL, unsubscribed_at = NULL, requested_at = CURRENT_TIMESTAMP(3), consent_text = ?, marketing_basis = 'CONSENT' WHERE id = ?", [tokenHash, newsletterConsent, subscriber.id], connection);
    const brand = await getEmailPreferences(connection);
    await enqueueEmail({ ...newsletterEmail(brand, "confirm", `${brand.appUrl}/newsletter/confirm?token=${token}`), to: email, replyTo: brand.replyToEmail, templateKey: "newsletter-confirmation" }, { dedupeKey: `newsletter-confirm:${tokenHash}`, subscriberId: subscriber.id, expiresAt: new Date(Date.now() + 48 * 3600_000) }, connection);
    return "accepted";
  });
}

export async function confirmNewsletter(token: string): Promise<boolean> {
  if (!newsletterTokenValid(token)) return false;
  return withTransaction(async (connection) => {
    const subscriber = await selectOne<Subscriber>("SELECT CAST(id AS CHAR) AS id, email, status FROM newsletter_subscribers WHERE confirmation_token_hash = ? AND status = 'PENDING' AND confirmation_expires_at > CURRENT_TIMESTAMP(3) FOR UPDATE", [newsletterTokenHash(token)], connection);
    if (!subscriber) return false;
    const unsubscribeToken = randomBytes(32).toString("base64url");
    await executeMutation("UPDATE newsletter_subscribers SET status = 'ACTIVE', confirmed_at = CURRENT_TIMESTAMP(3), confirmation_token_hash = NULL, confirmation_expires_at = NULL, unsubscribe_token_hash = ? WHERE id = ?", [newsletterTokenHash(unsubscribeToken), subscriber.id], connection);
    const brand = await getEmailPreferences(connection);
    const url = `${brand.appUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`;
    await enqueueEmail({ ...newsletterEmail(brand, "welcome", url), to: subscriber.email, replyTo: brand.replyToEmail, unsubscribeUrl: url, templateKey: "newsletter-welcome" }, { dedupeKey: `newsletter-welcome:${newsletterTokenHash(token)}`, subscriberId: subscriber.id }, connection);
    return true;
  });
}

export async function unsubscribeNewsletter(token: string): Promise<boolean> {
  if (!newsletterTokenValid(token)) return false;
  return withTransaction(async (connection) => {
    const subscriber = await selectOne<Subscriber>("SELECT CAST(id AS CHAR) AS id FROM newsletter_subscribers WHERE unsubscribe_token_hash = ? FOR UPDATE", [newsletterTokenHash(token)], connection);
    if (!subscriber) return false;
    await executeMutation("UPDATE newsletter_subscribers SET status = 'UNSUBSCRIBED', unsubscribed_at = COALESCE(unsubscribed_at, CURRENT_TIMESTAMP(3)), confirmation_token_hash = NULL, confirmation_expires_at = NULL WHERE id = ?", [subscriber.id], connection);
    await executeMutation("UPDATE email_jobs SET status = 'CANCELLED', payload_encrypted = NULL, locked_at = NULL, lock_token = NULL WHERE subscriber_id = ? AND status IN ('PENDING','FAILED','PROCESSING')", [subscriber.id], connection);
    return true;
  });
}
