import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import Notice from "@/components/admin/Notice";
import { selectRows, selectOne } from "@/lib/db/query";
import { requireAdministrator } from "@/lib/auth/session";
import { mapProductAction } from "./actions";
interface Old extends RowDataPacket { legacy_id: string; product_id: string | null; name: string; original_status: string; match_method: string | null; details_json: unknown }
interface Product extends RowDataPacket { id: string; name: string }
export default async function ProductMatches({ searchParams }: { searchParams: Promise<{ q?: string; matched?: string; page?: string; saved?: string; error?: string }> }) {
  await requireAdministrator(["OWNER", "MANAGER"]);
  const query = await searchParams, q = query.q?.trim().slice(0, 100) ?? "", matched = ["yes", "no"].includes(query.matched ?? "") ? query.matched! : "all";
  const where = "(name LIKE ? OR CAST(legacy_id AS CHAR)=?) AND (?='all' OR (?='yes' AND product_id IS NOT NULL) OR (?='no' AND product_id IS NULL))";
  const values = [`%${q}%`, q, matched, matched, matched];
  const total = Number((await selectOne<RowDataPacket>(`SELECT COUNT(*) n FROM legacy_products WHERE ${where}`, values))?.n ?? 0);
  const page = Math.min(parsePage(query.page), Math.max(1, Math.ceil(total / 20)));
  const [old, products] = await Promise.all([selectRows<Old>(`SELECT *,CAST(legacy_id AS CHAR) legacy_id,CAST(product_id AS CHAR) product_id FROM legacy_products WHERE ${where} ORDER BY (product_id IS NULL) DESC,legacy_id LIMIT 20 OFFSET ?`, [...values, (page - 1) * 20]), selectRows<Product>("SELECT CAST(id AS CHAR) id,name FROM products ORDER BY name")]);
  return <div><PageHeader eyebrow="Historical data" title="Product matching" description="Link original products to the current catalogue. Linking updates review and order associations; prices, stock, media and content are not changed here." />
    {query.saved ? <Notice type="success">Product links updated.</Notice> : null}{query.error ? <Notice>Check the selected product.</Notice> : null}
    <form className="my-5 flex flex-wrap gap-3"><input aria-label="Search original products" name="q" defaultValue={q} placeholder="Original name or ID" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" /><select aria-label="Match state" name="matched" defaultValue={matched} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="all">All records</option><option value="yes">Matched</option><option value="no">Unmatched</option></select><button className="rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white">Filter</button></form>
    <p className="mb-3 text-sm text-zinc-500">{total} original catalogue records</p><div className="space-y-3">{old.map(item => <article key={item.legacy_id} className="rounded-xl border border-zinc-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-semibold">{item.name}</h2><p className="mt-1 text-xs text-zinc-500">#{item.legacy_id} · {item.original_status} · {item.match_method || "Unmatched"}</p></div><form action={mapProductAction.bind(null, item.legacy_id)} className="flex max-w-full gap-2"><select aria-label={`Current product for ${item.name}`} name="productId" defaultValue={item.product_id ?? ""} className="min-w-0 max-w-sm rounded-lg border border-zinc-300 px-3 py-2 text-sm"><option value="">Keep unmatched</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select><button className="rounded-lg bg-zinc-950 px-3 py-2 text-sm text-white">Save match</button></form></div><details className="mt-3"><summary className="cursor-pointer text-sm text-amber-800">Original product details</summary><pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-zinc-50 p-3 text-xs">{typeof item.details_json === "string" ? item.details_json : JSON.stringify(item.details_json, null, 2)}</pre></details>{item.product_id ? <Link href={`/admin/reviews?q=${encodeURIComponent(products.find(p => p.id === item.product_id)?.name ?? item.name)}`} className="mt-3 inline-block text-sm text-amber-800 underline">Review moderation</Link> : null}</article>)}</div>
    <Pagination pathname="/admin/imports/products" page={page} pageSize={20} totalItems={total} query={{ q, matched }} />
  </div>;
}
