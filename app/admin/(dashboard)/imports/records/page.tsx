import { notFound } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import { requireAdministrator } from "@/lib/auth/session";
import { selectOne, selectRows } from "@/lib/db/query";
import { unpackRecord } from "@/lib/legacy/format";
export default async function SourceRecords({ searchParams }: { searchParams: Promise<{ batch?: string; table?: string; key?: string; page?: string }> }) {
  await requireAdministrator(["OWNER"]);
  const query = await searchParams, batch = query.batch ?? "", table = query.table ?? "", key = query.key?.trim().slice(0, 190) ?? "";
  if (!/^[1-9]\d*$/.test(batch) || !/^[A-Za-z0-9_]+$/.test(table)) notFound();
  const source = await selectOne<RowDataPacket>("SELECT definition_sql,row_count FROM legacy_tables WHERE import_id=? AND table_name=?", [batch, table]); if (!source) notFound();
  const count = key ? await selectOne<RowDataPacket>("SELECT COUNT(*) total FROM legacy_records WHERE import_id=? AND table_name=? AND source_key=?", [batch, table, key]) : { total: source.row_count };
  const total = Number(count?.total ?? 0), page = Math.min(parsePage(query.page), Math.max(1, Math.ceil(total / 20)));
  const records = await selectRows<RowDataPacket>(`SELECT source_row_number,source_key,payload_encrypted FROM legacy_records WHERE import_id=? AND table_name=? ${key ? "AND source_key=?" : ""} ORDER BY source_row_number LIMIT 20 OFFSET ?`, [...[batch, table], ...(key ? [key] : []), (page - 1) * 20]);
  return <div><PageHeader eyebrow={`Source archive · Import ${batch}`} title={table} description={`${total.toLocaleString("en-GB")} original rows. Values retain their original column names.`} />
    <form className="my-5 flex gap-3"><input name="batch" type="hidden" value={batch} /><input name="table" type="hidden" value={table} /><input aria-label="Original record ID" name="key" defaultValue={key} placeholder="Original ID (exact match)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" /><button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white">Find</button></form>
    <details className="mb-5 rounded-xl border border-zinc-200 bg-white p-5"><summary className="cursor-pointer font-medium">Original column definitions</summary><pre className="mt-4 overflow-auto whitespace-pre-wrap text-xs">{source.definition_sql}</pre></details>
    <div className="space-y-3">{records.map(record => <details className="rounded-xl border border-zinc-200 bg-white p-4" key={record.source_row_number}><summary className="cursor-pointer text-sm font-medium">Record {record.source_key || "(empty key)"} · row {record.source_row_number}</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(unpackRecord(record.payload_encrypted), null, 2)}</pre></details>)}</div>
    <Pagination pathname="/admin/imports/records" page={page} pageSize={20} totalItems={total} query={{ batch, table, key }} />
  </div>;
}
