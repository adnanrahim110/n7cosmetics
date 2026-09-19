export interface EmailBrand { appUrl: string; contactEmail?: string; address?: string }
export interface EmailContent { subject: string; text: string; html: string }

export function escapeEmailHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function emailUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Email links must use HTTP or HTTPS.");
  return escapeEmailHtml(url.href);
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

export function emailLayout(brand: EmailBrand, options: { eyebrow: string; title: string; preview: string; body: string; unsubscribeUrl?: string }): string {
  const home = emailUrl(brand.appUrl);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeEmailHtml(options.title)}</title><style>@media(max-width:620px){.email-shell{width:100%!important}.email-pad{padding-left:24px!important;padding-right:24px!important}.email-title{font-size:30px!important}}</style></head><body style="margin:0;padding:0;background:#eee8de;color:#1c1814;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeEmailHtml(options.preview)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#eee8de"><tr><td align="center" style="padding:32px 12px"><!--[if mso]><table role="presentation" width="600"><tr><td><![endif]--><table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border:1px solid #ded6c9;background:#f7f2e9"><tr><td class="email-pad" bgcolor="#090908" style="padding:32px 42px;border-bottom:3px solid #967c55"><a href="${home}" style="text-decoration:none;color:#f7f2e9;font:28px/1.2 Georgia,serif;letter-spacing:5px">N7 <span style="font:10px/1.2 Arial,sans-serif;letter-spacing:3px;color:#c6ad88">COSMETICS</span></a></td></tr><tr><td class="email-pad" style="padding:40px 42px 28px"><p style="margin:0 0 14px;color:#8d6745;font:600 10px/1.6 Arial,sans-serif;letter-spacing:2.5px;text-transform:uppercase">${escapeEmailHtml(options.eyebrow)}</p><h1 class="email-title" style="margin:0 0 26px;font:normal 36px/1.2 Georgia,serif;color:#1c1814">${escapeEmailHtml(options.title)}</h1>${options.body}</td></tr><tr><td class="email-pad" style="padding:25px 42px 30px;border-top:1px solid #ded6c9;color:#786f64;font:12px/1.8 Arial,sans-serif"><a href="${home}" style="color:#8d6745;text-decoration:none;letter-spacing:1px">N7 COSMETICS</a>${brand.contactEmail ? `<br /><a href="mailto:${escapeEmailHtml(brand.contactEmail)}" style="color:#51483d;text-decoration:underline">${escapeEmailHtml(brand.contactEmail)}</a>` : ""}${brand.address ? `<p style="margin:10px 0 0">${escapeEmailHtml(brand.address).replace(/\r?\n/g, "<br />")}</p>` : ""}${options.unsubscribeUrl ? `<p style="margin:16px 0 0"><a href="${emailUrl(options.unsubscribeUrl)}" style="color:#786f64;text-decoration:underline">Unsubscribe from N7 fragrance updates</a></p>` : ""}</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>`;
}
