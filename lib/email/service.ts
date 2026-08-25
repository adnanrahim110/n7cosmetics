import nodemailer from "nodemailer";
import type { RowDataPacket } from "mysql2/promise";
import { executeMutation, selectRows } from "@/lib/db/query";
import { decryptSecret } from "@/lib/security/encryption";

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

interface ProjectEmail {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  templateKey: string;
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
  } catch { return null; }
}

async function logEmail(email: ProjectEmail, result: EmailSendResult): Promise<void> {
  await executeMutation("INSERT INTO email_logs (recipient, subject, template_key, status, provider_message_id, error_message) VALUES (?, ?, ?, ?, ?, ?)", [email.to.slice(0, 190), email.subject.slice(0, 255), email.templateKey.slice(0, 100), result.status, result.messageId ?? null, result.error?.slice(0, 500) ?? null]).catch(() => undefined);
}

export async function sendProjectEmail(email: ProjectEmail): Promise<EmailSendResult> {
  let settings: SmtpSettings | null;
  try { settings = await getSmtpSettings(); } catch (error) {
    return { status: "FAILED", error: error instanceof Error ? error.message : "Unable to read SMTP settings." };
  }
  if (!settings) { const result: EmailSendResult = { status: "SKIPPED", error: "SMTP is not configured." }; await logEmail(email, result); return result; }
  try {
    const transport = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.secure, auth: { user: settings.user, pass: settings.password }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 });
    const sent = await transport.sendMail({ from: { name: settings.fromName, address: settings.fromEmail }, to: email.to, replyTo: email.replyTo, subject: email.subject, text: email.text, html: email.html });
    const result: EmailSendResult = { status: "SENT", messageId: sent.messageId }; await logEmail(email, result); return result;
  } catch (error) {
    const result: EmailSendResult = { status: "FAILED", error: error instanceof Error ? error.message : "Unknown SMTP error." }; await logEmail(email, result); return result;
  }
}
