import { withTransaction } from "../db/transaction";
import { decryptSecret, encryptSecret } from "../security/encryption";
import { readSmtpValues, saveEmailSetting, settingsRevision } from "./store";
import { normalizeSmtpPassword, smtpPasswordRequired, type SmtpInput, type EmailSettingsFormState } from "./settings";
import { verifySmtpSettings, type EmailSendResult, type SmtpSettings } from "./service";

export async function saveVerifiedSmtpSettings(input: SmtpInput, expectedRevision: string, administratorId: string | null, verify: (settings: SmtpSettings) => Promise<EmailSendResult> = verifySmtpSettings): Promise<EmailSettingsFormState> {
  const values = await readSmtpValues();
  const revision = settingsRevision(values);
  if (expectedRevision !== revision) return { error: "SMTP settings changed in another session. Reload this page before saving." };
  let password = normalizeSmtpPassword(input.host, input.password);
  if (!password && smtpPasswordRequired(input, { host: String(values["smtp.host"] || ""), user: String(values["smtp.user"] || ""), hasPassword: Boolean(values["smtp.password_encrypted"]) })) {
    return { error: "Enter the SMTP password when setting up or changing the server or username." };
  }
  try { password ||= decryptSecret(String(values["smtp.password_encrypted"])); }
  catch { return { error: "The saved password cannot be read. Enter it again." }; }
  const settings: SmtpSettings = { host: input.host, port: input.port, secure: input.security === "tls", user: input.user, password, fromName: input.fromName, fromEmail: input.fromEmail };
  const result = await verify(settings);
  if (result.status !== "SENT") return { error: `${result.error || "Verification failed."} Your active connection has not been changed.` };
  const saved = await withTransaction(async (connection) => {
    if (settingsRevision(await readSmtpValues(connection, true)) !== revision) return false;
    const changes: [string, unknown][] = [["smtp.provider", input.provider], ["smtp.host", settings.host], ["smtp.port", settings.port], ["smtp.secure", settings.secure], ["smtp.user", settings.user], ["smtp.password_encrypted", encryptSecret(password)], ["smtp.from_name", settings.fromName], ["smtp.from_email", settings.fromEmail], ["smtp.verified_at", new Date().toISOString()], ["smtp.verify_error", ""]];
    for (const [key, value] of changes) await saveEmailSetting(key, value, administratorId, connection);
    return true;
  });
  return saved ? {} : { error: "SMTP settings changed while verification was running. Reload this page before saving." };
}
