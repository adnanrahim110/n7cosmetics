import { z } from "zod";

export const customerExportLimit = 10000;

export const exportFormats = [
  { value: "csv", label: "CSV", description: "Universal spreadsheet data" },
  { value: "xlsx", label: "Excel (.xlsx)", description: "Formatted Excel workbook" },
  { value: "ods", label: "OpenDocument (.ods)", description: "LibreOffice / OpenOffice" },
  { value: "tsv", label: "TSV", description: "Tab-separated values" },
  { value: "pdf", label: "PDF", description: "Paginated, printable report" },
  { value: "html", label: "HTML", description: "Standalone browser report" },
  { value: "json", label: "JSON", description: "Structured integration data" },
  { value: "xml", label: "XML", description: "Structured exchange document" },
] as const;

export const exportColumns = [
  { key: "id", label: "Customer ID", width: 14 },
  { key: "full_name", label: "Name", width: 26 },
  { key: "email", label: "Email", width: 36 },
  { key: "phone", label: "Phone", width: 22 },
  { key: "country_code", label: "Country", width: 12 },
  { key: "order_count", label: "Orders", width: 10 },
  { key: "spent_gbp", label: "Net spend GBP", width: 18 },
  { key: "last_order_at", label: "Last order", width: 22 },
  { key: "created_at", label: "Added", width: 22 },
  { key: "source", label: "Origin", width: 18 },
  { key: "registered_at", label: "Registered", width: 22 },
  { key: "admin_notes", label: "Admin notes", width: 42 },
] as const;
export type ExportColumn = (typeof exportColumns)[number]["key"];
export const defaultExportColumns: ExportColumn[] = exportColumns.slice(0, 10).map(c => c.key);
export const exportSorts = [
  { value: "created_at", label: "Date added" }, { value: "full_name", label: "Name" },
  { value: "email", label: "Email" }, { value: "order_count", label: "Order count" },
  { value: "spent_pence", label: "Net spend" }, { value: "last_order_at", label: "Last order" },
] as const;

const date = z.string().refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number(value.slice(0, 4)) >= 1000 && Number(value.slice(0, 4)) <= 9998 &&
  !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "Enter a valid date.");
const integer = z.string().refine(value => value === "" || /^\d{1,7}$/.test(value), "Order limits must be positive whole numbers or zero.");
const money = z.string().refine(value => value === "" || /^-?\d{1,9}(\.\d{1,2})?$/.test(value), "Enter a valid GBP amount (up to two decimal places).");
export const customerExportSchema = z.object({
  format: z.enum(["csv", "xlsx", "ods", "tsv", "pdf", "html", "json", "xml"]),
  columns: z.array(z.enum(exportColumns.map(c => c.key) as [ExportColumn, ...ExportColumn[]])).min(1, "Select at least one column.").max(12).refine(v => new Set(v).size === v.length, "Select each column only once."),
  q: z.string().trim().max(100), source: z.enum(["ALL", "LIVE", "LEGACY"]),
  dateField: z.enum(["created_at", "last_order_at", "registered_at"]), from: date, to: date,
  orders: z.enum(["all", "with", "without"]), minOrders: integer, maxOrders: integer,
  minSpend: money, maxSpend: money,
  sort: z.enum(["created_at", "full_name", "email", "order_count", "spent_pence", "last_order_at"]),
  direction: z.enum(["asc", "desc"]),
  filename: z.string().trim().min(1, "Enter a filename.").max(100).regex(/^[\p{L}\p{N}_ .()-]+$/u, "Use letters, numbers, spaces, underscores, dots or hyphens in the filename."),
  delimiter: z.enum(["comma", "semicolon"]), bom: z.boolean(),
  orientation: z.enum(["landscape", "portrait"]), pageSize: z.enum(["A4", "A3"]), pretty: z.boolean(),
}).superRefine((v, ctx) => {
  for (const [min, max, message] of [["from", "to", "The end date must be on or after the start date."], ["minOrders", "maxOrders", "Maximum orders must be at least the minimum."], ["minSpend", "maxSpend", "Maximum spend must be at least the minimum."]] as const) {
    if (v[min] && v[max] && (min === "from" ? v[min] > v[max] : Number(v[min]) > Number(v[max]))) ctx.addIssue({ code: "custom", path: [max], message });
  }
  if (v.orders === "without" && Number(v.minOrders) > 0) ctx.addIssue({ code: "custom", path: ["minOrders"], message: "Customers without orders cannot have a minimum order count above zero." });
  if (v.orders === "with" && v.maxOrders !== "" && Number(v.maxOrders) === 0) ctx.addIssue({ code: "custom", path: ["maxOrders"], message: "Customers with orders need a maximum of at least one." });
});
export type CustomerExportOptions = z.infer<typeof customerExportSchema>;
export function defaultCustomerExport(q = "", source: string = "ALL"): CustomerExportOptions {
  return { format: "csv", columns: [...defaultExportColumns], q, source: source === "LIVE" || source === "LEGACY" ? source : "ALL", dateField: "created_at", from: "", to: "", orders: "all", minOrders: "", maxOrders: "", minSpend: "", maxSpend: "", sort: "created_at", direction: "desc", filename: `n7-customers-${new Date().toISOString().slice(0, 10)}`, delimiter: "comma", bom: true, orientation: "landscape", pageSize: "A4", pretty: true };
}
export function customerExportParams(options: CustomerExportOptions) {
  return new URLSearchParams(Object.entries(options).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value)]));
}
export function parseCustomerExport(params: URLSearchParams) {
  const input: Record<string, unknown> = { ...defaultCustomerExport() };
  for (const key of Object.keys(input)) if (params.has(key)) input[key] = key === "columns" ? params.get(key)!.split(",").filter(Boolean) : ["bom", "pretty"].includes(key) ? params.get(key) === "true" : params.get(key);
  return customerExportSchema.parse(input);
}
export function customerExportFilename(options: CustomerExportOptions) {
  const stem = options.filename.replace(/\.(csv|xlsx|ods|tsv|pdf|html|json|xml)$/i, "").replace(/[. ]+$/, "") || "n7-customers";
  return `${stem}.${options.format}`;
}
