import nodemailer from "nodemailer";
import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectRows } from "../db/query";
import { decryptSecret } from "../security/encryption";

interface SettingRow extends RowDataPacket { setting_key: string; value_json: unknown }

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface ProjectEmail {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  templateKey: string;
  messageId?: string;
  unsubscribeUrl?: string;
}

export type EmailSendResult = { status: "SENT" | "FAILED" | "SKIPPED"; messageId?: string; error?: string };

function settingValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value) as unknown; } catch { return value; }
}

export async function getSmtpSettings(): Promise<SmtpSettings | null> {
  const rows = await selectRows<SettingRow>("SELECT setting_key, value_json FROM site_settings WHERE setting_key LIKE 'smtp.%'");
  const values = new Map(rows.map((row) => [row.setting_key, settingValue(row.value_json)]));
  const host = typeof values.get("smtp.host") === "string" ? String(values.get("smtp.host")) : "";
  const user = typeof values.get("smtp.user") === "string" ? String(values.get("smtp.user")) : "";
  const encryptedPassword = typeof values.get("smtp.password_encrypted") === "string" ? String(values.get("smtp.password_encrypted")) : "";
  const fromEmail = typeof values.get("smtp.from_email") === "string" ? String(values.get("smtp.from_email")) : "";
  if (!host || !user || !encryptedPassword || !fromEmail) return null;
  try {
    return { host, port: Number(values.get("smtp.port") ?? 587), secure: values.get("smtp.secure") === true, user, password: decryptSecret(encryptedPassword), fromName: typeof values.get("smtp.from_name") === "string" ? String(values.get("smtp.from_name")) : "N7 Cosmetics", fromEmail };
  } catch { throw new Error("The saved SMTP password cannot be decrypted. Save it again in admin settings."); }
}

export async function logEmail(email: ProjectEmail, result: EmailSendResult, jobId?: string): Promise<void> {
  await executeMutation("INSERT INTO email_logs (recipient, subject, template_key, status, provider_message_id, error_message, email_job_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [email.to.slice(0, 190), email.subject.slice(0, 255), email.templateKey.slice(0, 100), result.status, result.messageId ?? null, result.error?.slice(0, 500) ?? null, jobId ?? null]).catch((error) => console.error("Email attempt could not be logged", error));
}

export function smtpTransportOptions(settings: SmtpSettings) {
  return { host: settings.host, port: settings.port, secure: settings.secure, requireTLS: !settings.secure, auth: { user: settings.user, pass: settings.password }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000, dnsTimeout: 10_000, disableFileAccess: true, disableUrlAccess: true };
}

export async function verifySmtpConnection(): Promise<EmailSendResult> {
  try {
    const settings = await getSmtpSettings();
    if (!settings) return { status: "SKIPPED", error: "Save all SMTP settings, including the app password, first." };
    const transport = nodemailer.createTransport(smtpTransportOptions(settings));
    try { await transport.verify(); return { status: "SENT" }; } finally { transport.close(); }
  } catch (error) { return { status: "FAILED", error: error instanceof Error ? error.message : "Unable to verify SMTP." }; }
}

export async function sendProjectEmail(email: ProjectEmail, jobId?: string): Promise<EmailSendResult> {
  let settings: SmtpSettings | null;
  try { settings = await getSmtpSettings(); } catch (error) {
    const result: EmailSendResult = { status: "FAILED", error: error instanceof Error ? error.message : "Unable to read SMTP settings." };
    await logEmail(email, result, jobId); return result;
  }
  if (!settings) { const result: EmailSendResult = { status: "SKIPPED", error: "SMTP is not configured." }; await logEmail(email, result, jobId); return result; }
  const transport = nodemailer.createTransport(smtpTransportOptions(settings));
  try {
    const sent = await transport.sendMail({ from: { name: settings.fromName, address: settings.fromEmail }, to: email.to, replyTo: email.replyTo, subject: email.subject, text: email.text, html: email.html, messageId: email.messageId, ...(email.unsubscribeUrl ? { list: { unsubscribe: email.unsubscribeUrl } } : {}) });
    if (!sent.accepted.length) throw new Error("SMTP did not accept the recipient.");
    const result: EmailSendResult = { status: "SENT", messageId: sent.messageId }; await logEmail(email, result, jobId); return result;
  } catch (error) {
    const result: EmailSendResult = { status: "FAILED", error: error instanceof Error ? error.message : "Unknown SMTP error." }; await logEmail(email, result, jobId); return result;
  } finally { transport.close(); }
}
