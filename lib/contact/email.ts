export interface ContactEmailInput {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}

export interface ContactEmailContent {
  subject: string;
  text: string;
  html: string;
}

export function escapeEmailHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildContactEmail(input: ContactEmailInput): ContactEmailContent {
  const submittedAt = new Date().toISOString();
  const phone = input.phone?.trim() || "Not provided";
  const topic = input.topic.replace(/[\r\n]+/g, " ").trim().slice(0, 120);
  const subject = `[N7 website] ${topic}`;
  const text = [
    "New enquiry from the N7 Cosmetics contact form",
    "",
    `Topic: ${topic}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${phone}`,
    `Submitted: ${submittedAt}`,
    "",
    "Message:",
    input.message,
  ].join("\n");

  const safeMessage = escapeEmailHtml(input.message).replace(/\r?\n/g, "<br />");
  const html = `
    <div style="background:#f3eee5;padding:32px;font-family:Arial,sans-serif;color:#1c1814">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #ded6c9">
        <div style="background:#0a0a09;padding:28px 32px;color:#f7f0e8">
          <p style="margin:0 0 8px;color:#b99a6c;font-size:11px;letter-spacing:2px;text-transform:uppercase">N7 Cosmetics</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:400">New website enquiry</h1>
        </div>
        <div style="padding:30px 32px">
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
            <tr><td style="padding:8px 16px 8px 0;color:#786f64;width:110px">Topic</td><td style="padding:8px 0">${escapeEmailHtml(topic)}</td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#786f64">Name</td><td style="padding:8px 0">${escapeEmailHtml(input.name)}</td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#786f64">Email</td><td style="padding:8px 0">${escapeEmailHtml(input.email)}</td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#786f64">Phone</td><td style="padding:8px 0">${escapeEmailHtml(phone)}</td></tr>
            <tr><td style="padding:8px 16px 8px 0;color:#786f64">Submitted</td><td style="padding:8px 0">${submittedAt}</td></tr>
          </table>
          <div style="margin-top:24px;border-top:1px solid #ded6c9;padding-top:24px">
            <p style="margin:0 0 10px;color:#8d6745;font-size:11px;letter-spacing:2px;text-transform:uppercase">Message</p>
            <p style="margin:0;font-size:15px;line-height:1.8">${safeMessage}</p>
          </div>
        </div>
      </div>
    </div>`;

  return { subject, text, html };
}
