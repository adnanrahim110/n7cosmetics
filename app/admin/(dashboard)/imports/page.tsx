import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import PageHeader from "@/components/admin/PageHeader";
import { selectRows } from "@/lib/db/query";
import { requireAdministrator } from "@/lib/auth/session";

interface Batch extends RowDataPacket { id: string; source_name: string; status: string; created_at: Date; completed_at: Date | null; archived_rows: number; table_count: number }
export default async function ImportsPage() {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const batches = await selectRows<Batch>(`SELECT CAST(i.id AS CHAR) id,i.source_name,i.status,i.created_at,i.completed_at,COUNT(t.table_name) table_count,COALESCE(SUM(t.row_count),0) archived_rows FROM legacy_imports i LEFT JOIN legacy_tables t ON t.import_id=i.id GROUP BY i.id ORDER BY i.id DESC`);
  return <div><PageHeader eyebrow="Migration" title="Historical data" description="Import results, original records and product matches." actions={<Link className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white" href="/admin/imports/products">Product matching</Link>} />
    <div className="mt-6 space-y-4">{batches.map(batch => <article key={batch.id} className="rounded-xl border border-zinc-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><Link className="font-semibold text-amber-800" href={`/admin/imports/${batch.id}`}>Import #{batch.id} · {batch.source_name}</Link><p className="mt-2 text-sm text-zinc-500">{Number(batch.archived_rows).toLocaleString("en-GB")} source rows · {batch.table_count} tables · {new Date(batch.created_at).toLocaleString("en-GB")}</p></div><span className="text-sm font-medium">{batch.status}</span></div></article>)}</div>
    {!batches.length ? <p className="mt-6 text-sm text-zinc-500">No historical imports yet.</p> : null}
  </div>;
}
