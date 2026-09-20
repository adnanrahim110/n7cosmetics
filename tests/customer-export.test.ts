import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { unzipSync, strFromU8 } from "fflate";
import { defaultCustomerExport, customerExportSchema, parseCustomerExport, customerExportParams, customerExportFilename, exportColumns } from "../lib/admin/customer-export-options";
import { customerExportQuery } from "../lib/admin/customer-export-query";
import { renderCustomerExport } from "../lib/admin/customer-export-render";
import type { CustomerRow } from "../lib/admin/customers";

const fixture = {
  id: "18446744073709551615", full_name: '=HYPERLINK("https://example.test")',
  email: 'name+tag@example.test', phone: "+440012345678", country_code: "GB", source: "LEGACY",
  import_id: "1", created_at: new Date("2026-09-20T23:59:59.999Z"), registered_at: null,
  admin_notes: 'Élodie & <script>alert("x")</script>\nsecond line', order_count: 3,
  last_order_at: new Date("2026-09-20T12:34:56Z"), spent_pence: -1234,
} as CustomerRow;
const defaults = defaultCustomerExport();

test("export validation rejects invalid dates, ranges, columns, and unsafe filenames", () => {
  for (const invalid of [{ columns: [] }, { columns: ["id", "id"] }, { columns: ["password"] },
    { from: "2026-02-30" }, { from: "2026-10-01", to: "2026-09-01" }, { minOrders: "2", maxOrders: "1" },
    { minSpend: "12.34", maxSpend: "12.33" }, { minSpend: "12.345" }, { orders: "without", minOrders: "1" },
    { orders: "with", maxOrders: "0" }, { sort: "id; DROP TABLE customers" }, { filename: "../secret" }, { filename: "bad\r\nheader" }]) {
    assert.equal(customerExportSchema.safeParse({ ...defaults, ...invalid }).success, false, JSON.stringify(invalid));
  }
  assert.equal(customerExportSchema.safeParse({ ...defaults, from: "2024-02-29", minSpend: "-12.34" }).success, true);
  assert.deepEqual(parseCustomerExport(customerExportParams(defaults)), defaults);
  assert.equal(customerExportFilename({ ...defaults, format: "pdf", filename: "my-customers.csv" }), "my-customers.pdf");
});

test("count and export use identical filters, parameterized values and inclusive final dates", () => {
  const options = { ...defaults, q: "O'Brien%; DROP TABLE customers", source: "LEGACY" as const, dateField: "last_order_at" as const, from: "2026-09-01", to: "2026-09-20", minSpend: "0.29", maxSpend: "123.45", minOrders: "1", orders: "with" as const };
  const data = customerExportQuery(options), count = customerExportQuery(options, true);
  assert.deepEqual(data.values, count.values);
  assert.ok(count.sql.includes(data.sql.slice(0, data.sql.lastIndexOf(" ORDER BY "))));
  assert.ok(!data.sql.includes(options.q));
  assert.ok(data.sql.includes("<DATE_ADD(?,INTERVAL 1 DAY)"));
  assert.deepEqual(data.values.slice(-3), [1, 29, 12345]);
});

test("CSV and TSV protect formulas and quote delimiters without corrupting numeric refunds", async () => {
  for (const format of ["csv", "tsv"] as const) {
    const data = await renderCustomerExport([fixture], { ...defaults, format, columns: ["full_name", "phone", "spent_gbp", "admin_notes"], delimiter: "semicolon", bom: true });
    assert.deepEqual(Array.from(data.slice(0,3)), [239,187,191]);
    const output = new TextDecoder().decode(data);
    assert.ok(output.includes('"\'=HYPERLINK(""https://example.test"")"'));
    assert.ok(output.includes('"\'+440012345678"'));
    assert.ok(output.includes('"-12.34"'));
    assert.ok(output.includes(format === "csv" ? '"Name";"Phone"' : '"Name"\t"Phone"'));
    assert.ok(output.includes("Élodie"));
  }
});

test("JSON preserves types and exports only selected fields; XML and HTML escape user content", async () => {
  const json = new TextDecoder().decode(await renderCustomerExport([fixture], { ...defaults, format: "json", columns: ["id", "spent_gbp", "registered_at"] }));
  assert.deepEqual(JSON.parse(json), [{ id: fixture.id, spent_gbp: -12.34, registered_at: null }]);
  for (const format of ["xml", "html"] as const) {
    const output = new TextDecoder().decode(await renderCustomerExport([fixture], { ...defaults, format, columns: ["admin_notes", "registered_at"] }));
    assert.ok(output.includes("&lt;script&gt;"));
    assert.ok(!output.includes("<script>"));
    assert.ok(!output.includes(fixture.email!));
    if (format === "xml") assert.ok(output.includes('<registered_at xsi:nil="true"/>'));
  }
});

test("Excel round-trip preserves IDs, text formulas, phone zeros and numeric money", async () => {
  const data = await renderCustomerExport([fixture], { ...defaults, format: "xlsx", columns: ["id", "full_name", "phone", "spent_gbp", "order_count"] });
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.getWorksheet("Customers")!;
  assert.deepEqual([1,2,3,4,5].map(i => sheet.getRow(2).getCell(i).value), [fixture.id, fixture.full_name, fixture.phone, -12.34, 3]);
  assert.equal(sheet.getCell("B2").type, ExcelJS.ValueType.String);
  assert.equal(sheet.getCell("D2").numFmt, '#,##0.00;[Red]-#,##0.00');
  assert.equal(sheet.rowCount, 2);
});

test("ODS has the required first uncompressed mimetype entry and typed safe cells", async () => {
  const data = await renderCustomerExport([fixture], { ...defaults, format: "ods", columns: ["id", "full_name", "spent_gbp", "admin_notes"] });
  const bytes = Buffer.from(data);
  assert.equal(bytes.readUInt16LE(8), 0);
  assert.equal(bytes.subarray(30, 30+bytes.readUInt16LE(26)).toString(), "mimetype");
  const files = unzipSync(data), content = strFromU8(files["content.xml"]);
  assert.equal(strFromU8(files.mimetype), "application/vnd.oasis.opendocument.spreadsheet");
  assert.ok(files["META-INF/manifest.xml"]);
  assert.ok(content.includes('office:value-type="float" office:value="-12.34"'));
  assert.ok(content.includes(fixture.id));
  assert.ok(!content.includes("table:formula"));
  assert.ok(content.includes("&lt;script&gt;"));
});

test("PDF emits a complete, multipage document with embedded font and all columns", async () => {
  const rows = Array.from({ length: 35 }, (_, i) => ({ ...fixture, id: String(i+1), full_name: `Élodie O'Brien ${i+1}`, admin_notes: "Long note with repeated words. ".repeat(i === 0 ? 200 : 2) }));
  const data = await renderCustomerExport(rows, { ...defaults, format: "pdf", columns: exportColumns.map(c => c.key), orientation: "portrait" });
  const text = Buffer.from(data).toString("latin1");
  assert.ok(text.startsWith("%PDF-"));
  assert.ok(text.trimEnd().endsWith("%%EOF"));
  assert.ok(text.includes("/FontFile2"));
  assert.ok((text.match(/\/Type \/Page\b/g) ?? []).length > 1);
});
