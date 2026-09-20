import type { CustomerRow } from "./customers";
import { exportColumns, type CustomerExportOptions, type ExportColumn } from "./customer-export-options";

export type ExportValue = string | number | null;
export const exportMimeTypes = {
  csv: "text/csv; charset=utf-8", tsv: "text/tab-separated-values; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ods: "application/vnd.oasis.opendocument.spreadsheet", pdf: "application/pdf",
  html: "text/html; charset=utf-8", json: "application/json; charset=utf-8", xml: "application/xml; charset=utf-8",
};
const iso = (value: Date | null) => value ? new Date(value).toISOString() : null;
export function customerExportValues(row: CustomerRow): Record<ExportColumn, ExportValue> {
  return { id: String(row.id), full_name: row.full_name, email: row.email, phone: row.phone, country_code: row.country_code,
    order_count: Number(row.order_count), spent_gbp: Number((Number(row.spent_pence) / 100).toFixed(2)),
    last_order_at: iso(row.last_order_at), created_at: iso(row.created_at), registered_at: iso(row.registered_at),
    source: row.source === "LEGACY" ? "Historical" : "New website", admin_notes: row.admin_notes };
}
// XML 1.0 permits tab/newline/CR but not the remaining control characters.
export const escapeExportMarkup = (value: ExportValue) => String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
export function delimitedExportCell(value: ExportValue) {
  let text = String(value ?? "");
  if (typeof value === "string" && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
const display = (key: ExportColumn, value: ExportValue) => key === "spent_gbp" && typeof value === "number" ? value.toFixed(2) : String(value ?? "");

export async function renderCustomerExport(rows: CustomerRow[], options: CustomerExportOptions): Promise<Uint8Array> {
  const columns = options.columns.map(key => exportColumns.find(c => c.key === key)!);
  const records = rows.map(customerExportValues);
  const matrix = records.map(row => columns.map(c => row[c.key]));
  const headers = columns.map(c => c.label);
  const encode = (value: string) => new TextEncoder().encode(value);

  if (options.format === "csv" || options.format === "tsv") {
    const delimiter = options.format === "tsv" ? "\t" : options.delimiter === "semicolon" ? ";" : ",";
    return encode((options.bom ? "\uFEFF" : "") + [headers, ...matrix].map(row => row.map(delimitedExportCell).join(delimiter)).join("\r\n") + "\r\n");
  }
  if (options.format === "json") return encode(JSON.stringify(records.map(row => Object.fromEntries(columns.map(c => [c.key, row[c.key]]))), null, options.pretty ? 2 : undefined) + "\n");
  if (options.format === "xml") {
    const newline = options.pretty ? "\n" : "", pad = options.pretty ? "  " : "";
    return encode(`<?xml version="1.0" encoding="UTF-8"?>${newline}<customers xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">${newline}${records.map(row => `${pad}<customer>${newline}${columns.map(c => `${pad}${pad}${row[c.key] === null ? `<${c.key} xsi:nil="true"/>` : `<${c.key}>${escapeExportMarkup(row[c.key])}</${c.key}>`}`).join(newline)}${newline}${pad}</customer>`).join(newline)}${newline}</customers>`);
  }
  if (options.format === "html") return encode(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>N7 Cosmetics · Customers</title><style>body{font:14px/1.5 system-ui,sans-serif;color:#27272a;margin:36px}h1{font-size:26px;margin:0}p{color:#71717a}table{border-collapse:collapse;width:100%;font-size:12px}th,td{padding:10px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e4e4e7;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#18181b;color:#fff}tbody tr:nth-child(even){background:#fafaf9}thead{display:table-header-group}@media print{body{margin:0;font-size:10px}th{color:#18181b;background:#f4f4f5}tr{break-inside:avoid}}@page{size:${options.pageSize} ${options.orientation};margin:12mm}</style></head><body><h1>N7 Cosmetics</h1><p>Customers · ${rows.length.toLocaleString("en-GB")} records · Dates in UTC · Net spend in GBP</p><table><thead><tr>${headers.map(h => `<th scope="col">${escapeExportMarkup(h)}</th>`).join("")}</tr></thead><tbody>${matrix.map(row => `<tr>${row.map((v,i) => `<td>${escapeExportMarkup(display(columns[i].key, v))}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
  if (options.format === "xlsx") {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "N7 Cosmetics";
    const sheet = workbook.addWorksheet("Customers", { views: [{ state: "frozen", ySplit: 1 }] });
    sheet.columns = columns.map(c => ({ header: c.label, key: c.key, width: c.width }));
    matrix.forEach(row => sheet.addRow(row));
    sheet.getRow(1).height = 27;
    sheet.getRow(1).eachCell(cell => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF27272A" } }; });
    columns.forEach((c,i) => {
      const column = sheet.getColumn(i+1);
      column.alignment = { vertical: "top", wrapText: true };
      // Text values remain explicit string cells, never formulas or numeric IDs/phones.
      column.numFmt = c.key === "spent_gbp" ? '#,##0.00;[Red]-#,##0.00' : c.key === "order_count" ? "0" : "@";
    });
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length+1), column: columns.length } };
    sheet.pageSetup = { orientation: options.orientation, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" };
    return new Uint8Array(await workbook.xlsx.writeBuffer());
  }
  if (options.format === "ods") {
    const { zipSync, strToU8 } = await import("fflate");
    const cell = (value: ExportValue) => typeof value === "number"
      ? `<table:table-cell office:value-type="float" office:value="${value}"><text:p>${value}</text:p></table:table-cell>`
      : `<table:table-cell office:value-type="string">${String(value ?? "").split(/\r?\n/).map(line => `<text:p>${escapeExportMarkup(line).replace(/ {2,}/g, spaces => `<text:s text:c="${spaces.length}"/>`).replaceAll("\t", "<text:tab/>")}</text:p>`).join("")}</table:table-cell>`;
    const tableRow = (values: ExportValue[]) => `<table:table-row>${values.map(cell).join("")}</table:table-row>`;
    const content = `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2"><office:body><office:spreadsheet><table:table table:name="Customers"><table:table-header-rows>${tableRow(headers)}</table:table-header-rows>${matrix.map(tableRow).join("")}</table:table></office:spreadsheet></office:body></office:document-content>`;
    const manifest = '<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>';
    return zipSync({ mimetype: [strToU8(exportMimeTypes.ods), { level: 0 }], "content.xml": strToU8(content), "META-INF/manifest.xml": strToU8(manifest) });
  }
  const { renderCustomerPdf } = await import("./customer-export-pdf");
  return renderCustomerPdf(columns, matrix, options);
}
