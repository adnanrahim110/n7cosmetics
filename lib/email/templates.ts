import { details, emailButton, emailImageUrl, emailLayout, paragraph, escapeEmailHtml, type EmailBrand, type EmailContent } from "./layout";
import { emailCopy, emailCopyDefinition, type EmailCopyKey } from "./copy";

export interface OrderEmailData {
  number: string; name: string; email: string; currency: string; status: string; paymentStatus: string; fulfillmentStatus: string;
  paymentMethod: string; subtotal: number; discount: number; shipping: number; tax: number; total: number;
  address: string; shippingMethod?: string; postageService?: string; trackingReference?: string; trackingUrl?: string; bankInstructions?: string;
  items: Array<{ name: string; variant: string; quantity: number; unitPrice: number; total: number; imageUrl?: string | null }>;
}
const money = (pence: number, currency: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(pence / 100);
const readable = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
const cleanSubject = (value: string) => value.replace(/[\r\n]+/g, " ").slice(0, 255);

export function orderEmail(brand: EmailBrand, order: OrderEmailData, kind: "confirmation" | "update" | "team" | "team-update"): EmailContent {
  const deliveryAddress = order.address.split(/[\r\n,]+/).map((part) => part.trim()).filter(Boolean).join(", ");
  const isTeam = kind === "team" || kind === "team-update";
  const dispatched = kind === "update" && order.status === "SHIPPED";
  const keys: Record<typeof kind, EmailCopyKey> = { confirmation: "order-confirmation", update: "order-status-update", team: "new-order-team", "team-update": "order-update-team" };
  const key = keys[kind];
  const copy = emailCopy(brand, key);
  const values = { customerName: order.name, orderNumber: order.number, courier: order.postageService ? " with Royal Mail" : "", total: money(order.total, order.currency), bankInstructions: order.bankInstructions || "", paymentStatus: readable(order.paymentStatus) };
  const title = copy(kind === "update" ? (Object.hasOwn(emailCopyDefinition(key), `title${order.status}`) ? `title${order.status}` : "titleOther") : "title");
  const intro = copy(dispatched ? "dispatched" : "intro", values);
  const paymentKey = ["CANCELLED", "REFUNDED"].includes(order.status) ? "paymentCancelled" : order.paymentStatus === "PAID" ? "paymentPaid" : order.paymentMethod === "BANK_TRANSFER" && ["UNPAID", "PENDING"].includes(order.paymentStatus) ? (order.bankInstructions ? "paymentBank" : "paymentBankMissing") : order.paymentMethod === "CASH_ON_DELIVERY" && ["UNPAID", "PENDING"].includes(order.paymentStatus) ? "paymentCash" : "paymentOther";
  const paymentNote = copy(paymentKey, { ...values, paymentStatus: paymentKey === "paymentCancelled" ? values.paymentStatus.toLowerCase() : values.paymentStatus });
  const facts: Array<[string, string]> = [[copy("orderReference"), order.number], [copy("orderStatus"), readable(order.status)], [copy("payment"), readable(order.paymentStatus)], [copy("fulfilment"), readable(order.fulfillmentStatus)], [copy("deliveryService"), order.shippingMethod || ""]];
  const totals: Array<[string, string]> = [[copy("subtotal"), money(order.subtotal, order.currency)], [copy("savings"), `−${money(order.discount, order.currency)}`], [copy("delivery"), money(order.shipping, order.currency)], [copy("tax"), money(order.tax, order.currency)], [copy("orderTotal"), money(order.total, order.currency)]];
  const selectionRows = order.items.map((item) => {
    const imageUrl = emailImageUrl(item.imageUrl, brand.appUrl);
    const thumbnail = imageUrl ? `<td width="64" style="width:64px;padding:0 12px 0 0;vertical-align:top"><img src="${imageUrl}" alt="${escapeEmailHtml(item.name)}" width="64" height="64" style="display:block;width:64px;height:64px;object-fit:contain;border:1px solid #ded6c9;border-radius:6px;background:#ffffff;font:10px Arial,sans-serif;color:#51483d" /></td>` : "";
    return `<tr><td style="padding:16px 10px 16px 0;border-bottom:1px solid #ded6c9;vertical-align:top"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${thumbnail}<td style="padding:0;vertical-align:middle;font:14px/1.6 Arial,sans-serif"><strong style="font-weight:normal;color:#1c1814">${escapeEmailHtml(item.name)}</strong><br /><span style="font-size:12px;color:#786f64">${escapeEmailHtml(item.variant)} · ${item.quantity} × ${money(item.unitPrice, order.currency)}</span></td></tr></table></td><td style="padding:16px 0;border-bottom:1px solid #ded6c9;text-align:right;vertical-align:middle;white-space:nowrap">${money(item.total, order.currency)}</td></tr>`;
  }).join("");
  const selection = `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0;font:14px/1.6 Arial,sans-serif"><caption style="text-align:left;padding-bottom:12px;color:#8d6745;font-size:10px;letter-spacing:2px">${escapeEmailHtml(copy("selection"))}</caption><thead><tr><th scope="col" style="text-align:left;padding:10px 0;border-bottom:1px solid #967c55;font-weight:normal;color:#786f64">${escapeEmailHtml(copy("fragrance"))}</th><th scope="col" style="text-align:right;padding:10px 0;border-bottom:1px solid #967c55;font-weight:normal;color:#786f64">${escapeEmailHtml(copy("amount"))}</th></tr></thead><tbody>${selectionRows}</tbody></table>`;
  const trackingFacts: Array<[string, string]> = order.trackingReference ? [[copy("destination"), deliveryAddress], [copy("postageService"), order.postageService || ""], [copy("trackingNumber"), order.trackingReference]] : [];
  const trackingLabel = copy(order.postageService ? "trackRoyalMail" : "trackDelivery");
  const trackingButton = order.trackingUrl ? emailButton(trackingLabel, order.trackingUrl) : "";
  const heading = (text: string) => `<h2 style="margin:28px 0 12px;font:normal 23px Georgia,serif">${escapeEmailHtml(text)}</h2>`;
  const trackingHeading = copy(order.postageService ? "royalMailTracking" : "deliveryTracking");
  const trackingBlock = trackingFacts.length ? heading(trackingHeading) + details(trackingFacts) + trackingButton : "";
  const help = isTeam ? `${copy("openOrders")}: ${brand.appUrl}/admin/orders` : copy(brand.contactEmail ? "helpReply" : "helpWebsite", values);
  const body = trackingBlock + details(facts) + selection + details(totals) + (trackingFacts.length ? "" : heading(copy("deliveryAddress")) + paragraph(deliveryAddress)) + heading(copy("paymentDetails")) + paragraph(paymentNote) + (trackingFacts.length ? "" : trackingButton) + (isTeam ? emailButton(copy("openOrders"), `${brand.appUrl}/admin/orders`) : paragraph(help)) + paragraph(`${copy("contact")}: ${brand.contactEmail || `${brand.appUrl}/contact`}`);
  const subject = cleanSubject(kind === "team-update" ? `N7 order ${order.number} · Team update` : kind === "team" ? `New N7 order ${order.number} · ${money(order.total, order.currency)}` : kind === "confirmation" ? `N7 order ${order.number} · Your selection received` : `N7 order ${order.number} · ${dispatched ? "Order dispatched" : "Order update"}`);
  return { subject, text: [title, "", intro, ...(trackingFacts.length ? ["", trackingHeading] : []), ...trackingFacts.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`), ...facts.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`), "", copy("selection"), `${copy("fragrance")} · ${copy("amount")}`, ...order.items.map((item) => `${item.name} (${item.variant}) · ${item.quantity} × ${money(item.unitPrice, order.currency)} = ${money(item.total, order.currency)}`), "", ...totals.map(([label, value]) => `${label}: ${value}`), trackingFacts.length ? "" : `\n${copy("deliveryAddress")}: ${deliveryAddress}`, `\n${copy("paymentDetails")}\n${paymentNote}`, order.trackingUrl ? `${trackingLabel}: ${order.trackingUrl}` : "", help, `${copy("contact")}: ${brand.contactEmail || `${brand.appUrl}/contact`}`].join("\n"), html: emailLayout(brand, { title, description: intro, preview: `${order.number} · ${money(order.total, order.currency)} · ${readable(order.status)}`, body }) };
}

export function passwordResetEmail(brand: EmailBrand, name: string, resetUrl: string): EmailContent {
  const copy = emailCopy(brand, "admin-password-reset");
  const intro = copy("intro", { administratorName: name });
  const expiry = copy("expiry", { expiryMinutes: "30" });
  return { subject: "N7 administrator · Reset your password", text: `${copy("title")}\n\n${intro}\n\n${copy("reset")}: ${resetUrl}\n\n${expiry}`, html: emailLayout(brand, { title: copy("title"), description: intro, preview: "Your one-time N7 administrator reset link. Valid for 30 minutes.", body: emailButton(copy("reset"), resetUrl) + paragraph(expiry) }) };
}

export interface ContactEmailInput { name: string; email: string; phone?: string; topic: string; message: string }
export function contactEmail(brand: EmailBrand, input: ContactEmailInput): EmailContent {
  const topic = cleanSubject(input.topic).slice(0, 120);
  const copy = emailCopy(brand, "storefront-contact");
  const facts: Array<[string, string]> = [[copy("name"), input.name], [copy("email"), input.email], [copy("phone"), input.phone || copy("notProvided")], [copy("topic"), topic]];
  return { subject: cleanSubject(`N7 enquiry · ${topic}`), text: [copy("title"), "", copy("intro"), ...facts.map(([label, value]) => `${label}: ${value}`), "", input.message, "", copy("reply")].join("\n"), html: emailLayout(brand, { title: copy("title"), description: copy("intro"), preview: `${input.name} · ${topic}`, body: details(facts) + `<div style="padding:24px;background:#eee8de;border-left:2px solid #967c55">${paragraph(input.message)}</div>` + paragraph(copy("reply")) }) };
}

export function contactReceiptEmail(brand: EmailBrand, name: string, topic: string, reference: string): EmailContent {
  const copy = emailCopy(brand, "contact-receipt");
  const intro = copy("intro", { customerName: name, topic: topic.toLowerCase(), reference });
  return { subject: cleanSubject(`N7 enquiry ${reference} · Your message is saved`), text: `${copy("title")}\n\n${intro}\n\n${copy("reference")}: ${reference}\n${copy("regarding")}: ${topic}`, html: emailLayout(brand, { title: copy("title"), description: intro, preview: `Enquiry ${reference} · ${topic}`, body: details([[copy("reference"), reference], [copy("regarding"), topic]]) }) };
}

export function newsletterEmail(brand: EmailBrand, kind: "confirm" | "welcome" | "checkout", link: string): EmailContent {
  const copy = emailCopy(brand, kind === "confirm" ? "newsletter-confirmation" : kind === "checkout" ? "newsletter-checkout" : "newsletter-welcome");
  if (kind === "confirm") {
    const intro = copy("intro", { expiryHours: "48" });
    return { subject: "N7 fragrance updates · Confirm your address", text: `${copy("title")}\n\n${intro}\n\n${copy("confirm")}: ${link}`, html: emailLayout(brand, { title: copy("title"), description: intro, preview: "Confirm your address before N7 sends fragrance updates.", body: emailButton(copy("confirm"), link) }) };
  }
  return { subject: "You’re on the N7 fragrance list", text: `${copy("title")}\n\n${copy("intro")}\n\n${copy("explore")}: ${brand.appUrl}\n\n${copy("leave")}\n${copy("unsubscribe")}: ${link}`, html: emailLayout(brand, { title: copy("title"), description: copy("intro"), preview: kind === "checkout" ? "N7 fragrance updates and your email preferences." : "Your N7 subscription is confirmed.", body: emailButton(copy("explore"), brand.appUrl) + paragraph(copy("leave")), unsubscribeUrl: link, unsubscribeLabel: copy("unsubscribe") }) };
}

export function smtpTestEmail(brand: EmailBrand, recipient: string): EmailContent {
  const copy = emailCopy(brand, "smtp-test");
  const intro = copy("intro", { recipient });
  return { subject: "N7 email delivery · Connection check", text: `${copy("title")}\n\n${intro}\n\n${copy("destination")}: ${recipient}\n${copy("website")}: ${brand.appUrl}`, html: emailLayout(brand, { title: copy("title"), description: intro, preview: "A delivery check from the SMTP connection saved in N7 admin.", body: details([[copy("destination"), recipient], [copy("website"), brand.appUrl]]) }) };
}

export function storeAlertEmail(brand: EmailBrand, key: "payment-failure-team" | "low-stock-team", facts: Array<[string, string]>, adminPath: string): EmailContent {
  const copy = emailCopy(brand, key);
  const labels: Record<string, string> = { Order: "order", "Customer email": "customerEmail", Product: "product", Variant: "variant", SKU: "sku", Available: "available", "Alert threshold": "threshold" };
  const rows: Array<[string, string]> = facts.map(([label, value]) => [copy(labels[label]), value]);
  const url = `${brand.appUrl}${adminPath}`;
  return { subject: cleanSubject(`N7 store alert · ${key === "payment-failure-team" ? "Payment failed" : "Stock needs attention"}`), text: [copy("title"), copy("intro"), ...rows.map(([label, value]) => `${label}: ${value}`), `${copy("review")}: ${url}`].join("\n\n"), html: emailLayout(brand, { title: copy("title"), description: copy("intro"), preview: copy("intro"), body: details(rows) + emailButton(copy("review"), url) }) };
}
