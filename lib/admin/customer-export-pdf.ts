import PDFDocument from "pdfkit";
import path from "node:path";
import type { CustomerExportOptions, exportColumns } from "./customer-export-options";
import type { ExportValue } from "./customer-export-render";

export async function renderCustomerPdf(columns: readonly (typeof exportColumns)[number][], matrix: ExportValue[][], options: CustomerExportOptions): Promise<Uint8Array> {
  const font = path.join(process.cwd(), "public/fonts/export/NotoSans-Regular.ttf");
  const doc = new PDFDocument({ size: options.pageSize, layout: options.orientation, margin: 32, bufferPages: true, font, info: { Title: "N7 Cosmetics — Customers", Author: "N7 Cosmetics" } });
  const chunks: Buffer[] = [];
  const result = new Promise<Uint8Array>((resolve, reject) => {
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
  });
  const width = doc.page.width - 64, bottom = doc.page.height - 48, lineHeight = 12;
  let y = 0;
  doc.fontSize(8);
  // Split wide selections into readable column sections, repeating selected identity fields.
  const minimumWidths = columns.map(c => Math.max(c.width * 3, ...c.label.split(" ").map(word => doc.widthOfString(word)+12)));
  const identity = columns.map((c,i) => c.key === "id" || c.key === "full_name" ? i : -1).filter(i => i >= 0);
  const sections: number[][] = [];
  let section: number[] = [];
  for (let i = 0; i < columns.length; i++) {
    if (section.length && [...section,i].reduce((sum,j) => sum + minimumWidths[j], 0) > width) {
      sections.push(section);
      section = identity.filter(j => j < i);
    }
    section.push(i);
  }
  sections.push(section);
  let widths: number[] = [];
  // Wrap long emails and notes explicitly so rows can continue safely across pages.
  function lines(value: string, available: number): string[] {
    return value.replace(/\r\n?/g, "\n").split("\n").flatMap(paragraph => {
      const wrapped: string[] = [];
      let current = "";
      for (const word of paragraph.replaceAll("\t", "  ").split(/(\s+)/)) {
        if (current && doc.widthOfString(current + word) > available) { wrapped.push(current.trimEnd()); current = ""; }
        // Only split within a word for unbroken values such as long email addresses.
        for (const char of Array.from(word)) {
          if (current && doc.widthOfString(current + char) > available) { wrapped.push(current); current = ""; }
          if (current || char !== " ") current += char;
        }
      }
      wrapped.push(current);
      return wrapped;
    });
  }
  function cells(values: string[][], offset: number, length: number, fill: string, color: string) {
    const height = length * lineHeight + 12;
    doc.rect(32, y, width, height).fill(fill);
    let x = 32;
    doc.fillColor(color).fontSize(8);
    values.forEach((cell, i) => {
      cell.slice(offset, offset + length).forEach((line, j) => doc.text(line, x+6, y+6+j*lineHeight, { lineBreak: false }));
      x += widths[i];
    });
    y += height;
    doc.moveTo(32, y).lineTo(32+width, y).strokeColor("#e4e4e7").lineWidth(0.4).stroke();
  }
  function pageHeader(headings: string[][], sectionIndex: number) {
    doc.fillColor("#18181b").fontSize(19).text("N7 Cosmetics", 32, 24, { lineBreak: false });
    doc.fillColor("#71717a").fontSize(8).text(`Customers  /  ${matrix.length.toLocaleString("en-GB")} records  /  Dates in UTC  /  Net spend in GBP${sections.length > 1 ? `  /  Columns ${sectionIndex+1} of ${sections.length}` : ""}`, 32, 53, { lineBreak: false });
    y = 77;
    cells(headings, 0, Math.max(...headings.map(h => h.length)), "#27272a", "#ffffff");
  }
  sections.forEach((indices, sectionIndex) => {
    if (sectionIndex) doc.addPage();
    const totalWidth = indices.reduce((sum,i) => sum + minimumWidths[i], 0);
    widths = indices.map(i => width * minimumWidths[i] / totalWidth);
    doc.fontSize(8);
    const headings = indices.map((i,j) => lines(columns[i].label, widths[j]-12));
    pageHeader(headings, sectionIndex);
    matrix.forEach((row, index) => {
    const wrapped = indices.map((i,j) => {
      const value = row[i], key = columns[i].key;
      const text = key === "spent_gbp" && typeof value === "number" ? value.toFixed(2) : String(value ?? "");
      return lines(key.endsWith("_at") ? text.replace("T", "\n") : text, widths[j]-12);
    });
    const totalLines = Math.max(...wrapped.map(cell => cell.length));
    let offset = 0;
    while (offset < totalLines) {
      let capacity = Math.floor((bottom-y-12) / lineHeight);
      if (capacity < 1 || (offset === 0 && totalLines > capacity && totalLines * lineHeight + 12 < bottom-130)) {
        doc.addPage(); pageHeader(headings, sectionIndex); capacity = Math.floor((bottom-y-12)/lineHeight);
      }
      const count = Math.min(capacity, totalLines-offset);
      cells(wrapped, offset, count, index % 2 === 0 ? "#ffffff" : "#fafaf9", "#27272a");
      offset += count;
    }
    });
  });
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor("#71717a").text(`N7 Cosmetics · Customer export`, 32, doc.page.height-30, { lineBreak: false });
    doc.text(`${i+1} / ${pages.count}`, doc.page.width-80, doc.page.height-30, { lineBreak: false });
  }
  doc.end();
  return result;
}
