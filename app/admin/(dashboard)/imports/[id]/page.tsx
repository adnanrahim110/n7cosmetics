import Link from "next/link";
import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import PageHeader from "@/components/admin/PageHeader";
import { requireAdministrator } from "@/lib/auth/session";
import { isDatabaseId } from "@/lib/admin/form";
import { selectOne, selectRows } from "@/lib/db/query";
interface Batch extends RowDataPacket { id: string; source_name: string; source_sha256: string; source_bytes: string; status: string; report_json: unknown }
interface SourceTable extends RowDataPacket { table_name: string; row_count: number; columns_json: string | string[] }
export default async function ImportDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdministrator(["OWNER", "MANAGER"]);
  const { id } = await params; if (!isDatabaseId(id)) notFound();
  const batch = await selectOne<Batch>("SELECT * FROM legacy_imports WHERE id=?", [id]); if (!batch) notFound();
  const tables = await selectRows<SourceTable>("SELECT table_name,row_count,columns_json FROM legacy_tables WHERE import_id=? ORDER BY table_name", [id]);
  const report = (typeof batch.report_json === "string" ? JSON.parse(batch.report_json) : batch.report_json) as Record<string, unknown> | null;
  const summary = Object.entries(report ?? {}).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value));
  return <div><PageHeader eyebrow="Historical data" title={`Import #${id}`} description={`${batch.source_name} · ${batch.status}`} actions={<Link href="/admin/imports/products" className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm">Review product matches</Link>} />
    <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Verification</h2><p className="mt-3 break-all font-mono text-xs text-zinc-500">SHA-256: {batch.source_sha256}</p><p className="mt-2 text-sm">{Number(batch.source_bytes).toLocaleString("en-GB")} original bytes · {tables.reduce((sum, table) => sum + Number(table.row_count), 0).toLocaleString("en-GB")} preserved rows</p><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{summary.map(([key, value]) => <div key={key}><dt className="text-zinc-500">{key.replace(/([A-Z])/g, " $1")}</dt><dd className="break-all">{String(value)}</dd></div>)}</dl>{report?.reconciliation ? <pre className="mt-4 overflow-auto rounded-lg bg-zinc-50 p-4 text-xs">{JSON.stringify(report.reconciliation, null, 2)}</pre> : null}</section>
    <section className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white"><h2 className="px-5 py-4 font-semibold">Original source tables</h2><p className="px-5 pb-4 text-sm text-zinc-500">Every original column is preserved. Source records are read-only{admin.role !== "OWNER" ? "; an owner can inspect the full archive" : ""}.</p><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-zinc-50"><tr><th className="px-5 py-3">Table</th><th className="px-5 py-3">Rows</th><th className="px-5 py-3">Columns</th></tr></thead><tbody>{tables.map(table => <tr key={table.table_name} className="border-t border-zinc-100"><td className="px-5 py-2">{admin.role === "OWNER" ? <Link className="text-amber-800 underline" href={`/admin/imports/records?batch=${id}&table=${encodeURIComponent(table.table_name)}`}>{table.table_name}</Link> : table.table_name}</td><td className="px-5 py-2">{Number(table.row_count).toLocaleString("en-GB")}</td><td className="px-5 py-2">{(typeof table.columns_json === "string" ? JSON.parse(table.columns_json) : table.columns_json).length}</td></tr>)}</tbody></table></div></section>
  </div>;
}
