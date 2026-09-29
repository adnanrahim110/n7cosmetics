import PDFDocument from "pdfkit";
import path from "node:path";
import type { OrderReceiptData } from "./order-receipt-data";
import { receiptSummary } from "./order-receipt-summary";
import { productNameWithCode } from "../commerce/product-label";

const ink = "#373128", muted = "#786f64", gold = "#a17b43", cream = "#f7f2e9", border = "#e5ddcf";
const readable = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/^./, c => c.toUpperCase());

export async function renderOrderReceipt(data: OrderReceiptData): Promise<Uint8Array> {
  const { order, items, addresses, brand, payment } = data;
  const summary = receiptSummary(order.payment_status, order.total_pence, data.refundedPence, payment.amountPaid, order.status);
  const font = path.join(process.cwd(), "public/fonts/export/NotoSans-Regular.ttf");
  const logo = path.join(process.cwd(), "public/imgs/logo-w.png");
  const doc = new PDFDocument({ size: "A4", margin: 44, bufferPages: true, font, info: { Title: `N7 ${summary.title.toLowerCase()} ${order.order_number}`, Author: "N7 Cosmetics" } });
  const chunks: Buffer[] = [];
  const result = new Promise<Uint8Array>((resolve, reject) => {
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
  });
  const left = 44, width = doc.page.width - 88, right = left + width, bottom = doc.page.height - 68;
  const money = (pence: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: order.currency }).format(pence / 100);
  const date = (value: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
  let y = 0;

  function text(value: string, x: number, top: number, size = 9, color = ink, available = width, align: "left" | "right" = "left") {
    doc.fillColor(color).fontSize(size).text(value, x, top, { width: available, align, lineBreak: false });
  }
  function rule(top: number, start = left, end = right) { doc.moveTo(start, top).lineTo(end, top).lineWidth(0.5).strokeColor(border).stroke(); }
  function wrap(value: string, available: number, size = 9): string[] {
    doc.fontSize(size);
    return value.replace(/\r\n?/g, "\n").split("\n").flatMap(paragraph => {
      const lines: string[] = [];
      let current = "";
      for (const word of paragraph.split(/(\s+)/)) {
        if (current && doc.widthOfString(current + word) > available) { lines.push(current.trimEnd()); current = ""; }
        for (const char of word) {
          if (current && doc.widthOfString(current + char) > available) { lines.push(current); current = ""; }
          if (current || char !== " ") current += char;
        }
      }
      lines.push(current);
      return lines;
    });
  }
  function header(continued = false) {
    const contact = continued ? [] : [brand.appUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""), brand.contactEmail].filter(Boolean).flatMap(value => wrap(value!, 215, 8));
    const height = continued ? 79 : Math.max(112, 59 + contact.length * 12);
    doc.rect(0, 0, doc.page.width, height + 18).fill(cream);
    const logoWidth = continued ? 32 : 43;
    const tileWidth = continued ? 48 : 65;
    const tileHeight = continued ? 60 : 81;
    doc.roundedRect(left, 28, tileWidth, tileHeight, 3).fill("#c98a39");
    doc.image(logo, left + (tileWidth - logoWidth) / 2, 28 + (tileHeight - logoWidth * 373 / 291) / 2, { width: logoWidth });
    const brandX = left + tileWidth + 18;
    text("N7 Cosmetics", brandX, continued ? 38 : 37, 12, ink, 215);
    contact.forEach((line, i) => text(line, brandX, 59 + i * 12, 8, muted, 215));
    text(`${payment.testMode ? "TEST " : ""}${summary.title}`, right - 180, 35, 17, ink, 180, "right");
    text(`R-${order.order_number}`, right - 180, 63, 8, muted, 180, "right");
    if (continued) text("Continued", right - 180, 78, 7, muted, 180, "right");
    y = height + 37;
  }
  function newPage() { doc.addPage(); header(true); }
  function ensure(height: number) { if (y + height > bottom) newPage(); }
  function block(value: string, color = muted, size = 8) {
    for (const line of wrap(value, width, size)) { ensure(13); text(line, left, y, size, color); y += 13; }
  }
  function columns(headings: string[], values: string[]) {
    const gap = 26, colWidth = (width - gap * (headings.length - 1)) / headings.length;
    const lines = values.map(value => wrap(value, colWidth));
    const height = 21 + Math.max(...lines.map(value => value.length)) * 13;
    ensure(Math.min(height, bottom - 125));
    headings.forEach((heading, i) => text(heading, left + i * (colWidth + gap), y, 7.5, gold, colWidth));
    y += 20;
    for (let row = 0; row < Math.max(...lines.map(value => value.length)); row++) {
      ensure(13);
      lines.forEach((value, i) => text(value[row] || "", left + i * (colWidth + gap), y, 9, ink, colWidth));
      y += 13;
    }
  }

  header();
  if (brand.address) { block(brand.address); y += 13; }
  columns(["ORDER NUMBER", "ORDER DATE (UK)", "ORDER STATUS"], [order.order_number, date(order.placed_at), readable(order.status)]);
  y += 16; rule(y); y += 22;
  const address = (kind: string) => {
    const value = addresses.find(row => row.address_type === kind);
    return value ? [value.full_name, value.company, value.line_1, value.line_2, [value.city, value.region, value.postal_code].filter(Boolean).join(", "), value.country_code].filter(Boolean).join("\n") : null;
  };
  columns(["BILL TO", "SHIP TO"], [[address("BILLING") || order.customer_name, order.customer_email, order.customer_phone].filter(Boolean).join("\n"), address("SHIPPING") || "No delivery address recorded"]);
  y += 26;

  const qtyX = left + 263, unitX = left + 304, totalX = left + 405;
  const totalWidth = width - 415;
  function tableHeader() {
    ensure(64);
    doc.rect(left, y, width, 29).fill(cream);
    text("PRODUCT", left + 10, y + 9, 7.5, muted, 240);
    text("QTY", qtyX, y + 9, 7.5, muted, 27, "right");
    text("UNIT PRICE", unitX, y + 9, 7.5, muted, 82, "right");
    text("AMOUNT", totalX, y + 9, 7.5, muted, totalWidth, "right");
    y += 41;
  }
  tableHeader();
  for (const item of items) {
    const nameLines = wrap(productNameWithCode(item.product_name, item.product_code), 240);
    const detail = [item.variant_title, item.discount_pence ? `${money(item.discount_pence)} discount included` : null].filter(Boolean).join(" · ");
    const lines = [...nameLines.map(value => ({ value, detail: false })), ...wrap(detail, 240, 8).map(value => ({ value, detail: true }))];
    if (y + lines.length * 13 + 24 > bottom && lines.length * 13 + 24 < bottom - 170) { newPage(); tableHeader(); }
    for (let i = 0; i < lines.length; i++) {
      if (y + 13 > bottom) { newPage(); tableHeader(); }
      text(lines[i].value, left + 10, y, lines[i].detail ? 8 : 9, lines[i].detail ? muted : ink, 240);
      if (i === 0) {
        text(String(item.quantity), qtyX, y, 9, ink, 27, "right");
        text(money(item.unit_price_pence), unitX, y, 9, ink, 82, "right");
        text(money(item.line_total_pence), totalX, y, 9, ink, totalWidth, "right");
      }
      y += 13;
    }
    y += 11; rule(y); y += 13;
  }
  if (!items.length) { block("No item details recorded."); y += 13; }

  const totals: Array<[string, number]> = [["Subtotal", order.subtotal_pence], ["Discount", -order.discount_pence], ["Delivery", order.shipping_pence], ["Tax", order.tax_pence], [`Total (${order.currency})`, order.total_pence], ["Amount paid", summary.paid]];
  if (summary.refunded) totals.push(["Refunded", summary.refunded], ["Net paid", summary.netPaid]);
  if (summary.balance) totals.push(["Balance due", summary.balance]);
  const facts = [
    ["PAYMENT METHOD", payment.method],
    ["PAYMENT STATUS", readable(summary.status)],
    ...(payment.paidAt ? [["PAID ON (UK)", date(payment.paidAt)]] : []),
    ...(payment.reference ? [["TRANSACTION REFERENCE", payment.reference]] : []),
    ...(order.postage_service || order.shipping_method_name ? [["DELIVERY SERVICE", order.postage_service || order.shipping_method_name!]] : []),
    ...(order.coupon_code ? [["DISCOUNT CODE", order.coupon_code]] : []),
  ].map(([label, value]) => ({ label, lines: wrap(value, 232, 8.5) }));
  const paymentHeight = facts.reduce((sum, fact) => sum + 14 + fact.lines.length * 12 + 10, 0);
  const totalsHeight = totals.length * 23 + 26;
  const sectionHeight = Math.max(paymentHeight, totalsHeight);
  y += 8;
  ensure(sectionHeight + 12);
  const top = y, totalsX = left + 263, totalsWidth = width - 263;
  doc.roundedRect(totalsX, top, totalsWidth, totalsHeight, 4).fill(cream);
  let totalY = top + 14;
  for (const [label, value] of totals) {
    const isTotal = label.startsWith("Total");
    if (isTotal) rule(totalY - 5, totalsX + 14, right - 14);
    text(label, totalsX + 14, totalY, isTotal ? 10 : 9, isTotal ? ink : muted, 126);
    text(money(value), right - 97, totalY, isTotal ? 10 : 9, ink, 83, "right");
    totalY += 23;
  }
  for (const fact of facts) {
    text(fact.label, left, y, 7, gold, 232); y += 14;
    for (const line of fact.lines) { text(line, left, y, 8.5, ink, 232); y += 12; }
    y += 10;
  }
  y = top + sectionHeight + 12;
  if (payment.note) block(payment.note);
  if (summary.note) block(summary.note, ink);
  if (payment.testMode) block("Test payment - no live payment was collected.", ink);

  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    rule(doc.page.height - 48);
    text(`Thank you for choosing N7 Cosmetics. · ${order.order_number}`, left, doc.page.height - 36, 7, muted);
    text(`${i - pages.start + 1} / ${pages.count}`, right - 60, doc.page.height - 36, 7, muted, 60, "right");
    doc.page.margins.bottom = bottomMargin;
  }
  doc.end();
  return result;
}
