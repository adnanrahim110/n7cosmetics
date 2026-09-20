import { ZodError } from "zod";
import type { RowDataPacket } from "mysql2/promise";
import { getCurrentAdministrator } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/auth/audit";
import { selectOne, selectRows } from "@/lib/db/query";
import type { CustomerRow } from "@/lib/admin/customers";
import { customerExportFilename, customerExportLimit, parseCustomerExport } from "@/lib/admin/customer-export-options";
import { customerExportQuery } from "@/lib/admin/customer-export-query";
import { exportMimeTypes, renderCustomerExport } from "@/lib/admin/customer-export-render";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const administrator = await getCurrentAdministrator();
  if (!administrator) return Response.json({ error: "Sign in to export customers." }, { status: 401, headers });
  if (!["OWNER", "MANAGER"].includes(administrator.role)) return Response.json({ error: "You cannot export customers." }, { status: 403, headers });
  try {
    const params = new URL(request.url).searchParams;
    const options = parseCustomerExport(params);
    if (params.get("preview") === "true") {
      const query = customerExportQuery(options, true);
      const row = await selectOne<RowDataPacket & { total: number }>(query.sql, query.values);
      return Response.json({ count: Number(row?.total ?? 0), limit: customerExportLimit }, { headers });
    }
    const query = customerExportQuery(options);
    const rows = await selectRows<CustomerRow>(`${query.sql} LIMIT ?`, [...query.values, customerExportLimit + 1]);
    if (rows.length > customerExportLimit) return Response.json({ error: `Export up to ${customerExportLimit.toLocaleString("en-GB")} customers at a time. Narrow your filters.` }, { status: 422, headers });
    if (!rows.length) return Response.json({ error: "No customers match these filters." }, { status: 422, headers });
    const data = await renderCustomerExport(rows, options);
    await writeAuditLog({ administratorId: administrator.id, action: "CUSTOMERS_EXPORT", entityType: "customer", summary: `Exported ${rows.length} customers as ${options.format.toUpperCase()}`, metadata: { format: options.format, columns: options.columns, count: rows.length, source: options.source, dateField: options.dateField, from: options.from, to: options.to } });
    const filename = customerExportFilename(options);
    const fallback = filename.replace(/[^a-zA-Z0-9_.()-]/g, "_");
    const encodedFilename = encodeURIComponent(filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    return new Response(new Uint8Array(data), { headers: { ...headers, "Content-Type": exportMimeTypes[options.format], "Content-Disposition": `attachment; filename="${fallback}"; filename*=UTF-8''${encodedFilename}`, "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'" } });
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: error.issues[0]?.message ?? "Invalid export options." }, { status: 400, headers });
    console.error("Customer export failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "The export could not be completed. Please try again." }, { status: 500, headers });
  }
}
