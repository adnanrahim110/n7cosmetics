import { globalContent } from "../../content/global";
import type { EmailCopySettings } from "./copy";

export interface EmailBrand { appUrl: string; contactEmail?: string; address?: string; emailCopy?: EmailCopySettings }
export interface EmailContent { subject: string; text: string; html: string }

export function escapeEmailHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function emailUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Email links must use HTTP or HTTPS.");
  return escapeEmailHtml(url.href);
}

export function emailImageUrl(value: string | null | undefined, appUrl: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim(), `${appUrl.replace(/\/$/, "")}/`);
    if (url.username || url.password) return null;
    return emailUrl(url.href);
  } catch { return null; }
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#51483d">${escapeEmailHtml(text).replace(/\r?\n/g, "<br />")}</p>`;
}

export function details(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:22px 0">${rows.filter(([, value]) => value).map(([label, value]) => `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid #ded6c9;vertical-align:top;color:#786f64;font:12px/1.7 Arial,sans-serif;width:35%">${escapeEmailHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid #ded6c9;vertical-align:top;color:#1c1814;font:14px/1.7 Arial,sans-serif">${escapeEmailHtml(value).replace(/\r?\n/g, "<br />")}</td></tr>`).join("")}</table>`;
}

export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0"><tr><td bgcolor="#967c55" style="background:#967c55"><a href="${emailUrl(href)}" style="display:inline-block;border:1px solid #967c55;padding:15px 25px;font:600 12px/1.4 Arial,sans-serif;letter-spacing:1px;text-decoration:none;color:#ffffff">${escapeEmailHtml(label)}</a></td></tr></table>`;
}

export function emailLayout(brand: EmailBrand, options: { title: string; description: string; preview: string; body: string; unsubscribeUrl?: string; unsubscribeLabel?: string }): string {
  const home = emailUrl(brand.appUrl);
  const logo = emailUrl(new URL(globalContent.header.logo, brand.appUrl).href);
  const header = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;table-layout:fixed"><tr>
    <td class="email-logo-cell" width="30%" align="center" valign="middle" bgcolor="#c98a39" style="width:30%;padding:32px 0;background:#c98a39;vertical-align:middle;text-align:center"><a href="${home}" style="display:inline-block;text-decoration:none;color:#ffffff"><img src="${logo}" alt="N7 Cosmetics" class="email-logo" width="78" height="100" style="display:block;width:78px;height:100px;margin:0 auto;border:0;color:#ffffff;font:14px Arial,sans-serif" /></a></td>
    <td class="email-heading-cell" valign="middle" bgcolor="#090908" style="padding:32px;background:#090908;vertical-align:middle;text-align:left;overflow-wrap:break-word"><h1 class="email-title" style="margin:0 0 8px;font:normal 22px/1.3 Georgia,serif;color:#ffffff">${escapeEmailHtml(options.title)}</h1><p class="email-description" style="margin:0;font:12px/1.6 Arial,sans-serif;color:#ffffff">${escapeEmailHtml(options.description).replace(/\r?\n/g, "<br />")}</p></td>
  </tr></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeEmailHtml(options.title)}</title><style>@media(max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:24px!important;padding-right:24px!important}.email-logo-cell{padding:24px 0!important}.email-heading-cell{padding:24px 20px!important}.email-logo{width:58px!important;height:74px!important}.email-title{font-size:20px!important}.email-description{font-size:11px!important}}</style></head><body style="margin:0;padding:0;background:#eee8de;color:#1c1814;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeEmailHtml(options.preview)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eee8de"><tr><td align="center" style="padding:32px 12px"><!--[if mso]><table role="presentation" width="600"><tr><td><![endif]--><table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border:1px solid #ded6c9;background:#f7f2e9"><tr><td style="padding:0">${header}</td></tr><tr><td class="email-pad" style="padding:40px 42px 28px">${options.body}</td></tr><tr><td class="email-pad" style="padding:25px 42px 30px;border-top:1px solid #ded6c9;color:#786f64;font:12px/1.8 Arial,sans-serif"><a href="${home}" style="color:#8d6745;text-decoration:none;letter-spacing:1px">N7 COSMETICS</a>${brand.contactEmail ? `<br /><a href="mailto:${escapeEmailHtml(brand.contactEmail)}" style="color:#51483d;text-decoration:underline">${escapeEmailHtml(brand.contactEmail)}</a>` : ""}${brand.address ? `<p style="margin:10px 0 0">${escapeEmailHtml(brand.address).replace(/\r?\n/g, "<br />")}</p>` : ""}${options.unsubscribeUrl ? `<p style="margin:16px 0 0"><a href="${emailUrl(options.unsubscribeUrl)}" style="color:#786f64;text-decoration:underline">${escapeEmailHtml(options.unsubscribeLabel ?? "Unsubscribe from N7 fragrance updates")}</a></p>` : ""}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}
