import Link from "next/link";
import { Eye, Pencil, Plus, Search } from "lucide-react";
import AdminThumbnail from "@/components/admin/AdminThumbnail";
import ArchiveProductButton from "@/components/admin/ArchiveProductButton";
import PageHeader from "@/components/admin/PageHeader";
import Pagination, { parsePage } from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { listProducts } from "@/lib/admin/products";
import { archiveProductAction } from "./actions";

interface ProductsPageProps { searchParams: Promise<{ q?: string; page?: string }> }

function formatMoney(pence: number | null): string {
  if (pence === null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { q = "", page: rawPage } = await searchParams;
  const result = await listProducts(q.trim().slice(0, 100), parsePage(rawPage));

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Products" description="Manage product details, pricing, inventory, images, and storefront visibility." actions={<Link className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" href="/admin/products/new"><Plus size={16} />Add product</Link>} />
      <form className="mt-7 flex max-w-md items-center rounded-lg border border-zinc-300 bg-white px-3 focus-within:border-amber-700 focus-within:ring-2 focus-within:ring-amber-100">
        <Search className="text-zinc-400" size={17} />
        <input aria-label="Search products" className="w-full bg-transparent px-2 py-2.5 text-sm outline-none" defaultValue={q} name="q" placeholder="Search name, slug, or SKU" />
      </form>
      <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">SKU</th><th className="px-4 py-3 font-medium">Price</th><th className="px-4 py-3 font-medium">Stock</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {result.products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><AdminThumbnail alt={product.name} src={product.image_url} /><div className="min-w-0"><Link className="block max-w-72 truncate font-medium text-zinc-950 hover:text-amber-700" href={`/admin/products/${product.id}`}>{product.name}</Link><p className="mt-0.5 max-w-72 truncate text-xs text-zinc-400">/{product.slug}</p></div></div></td>
                  <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                  <td className="px-4 py-3 text-zinc-600">{product.sku ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{formatMoney(product.price_pence)}</td>
                  <td className="px-4 py-3 text-zinc-600">{product.stock_on_hand ?? "—"}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1"><Link aria-label={`View ${product.name} in storefront`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-amber-700" href={`/products/${product.slug}`} target="_blank" title="View storefront"><Eye size={16} /></Link><Link aria-label={`Edit ${product.name}`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={`/admin/products/${product.id}`} title="Edit product"><Pencil size={16} /></Link><form action={archiveProductAction.bind(null, product.id)}><ArchiveProductButton disabled={product.status === "ARCHIVED"} name={product.name} /></form></div></td>
                </tr>
              ))}
              {!result.products.length ? <tr><td className="px-4 py-12 text-center text-zinc-500" colSpan={6}>No products found.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pagination page={result.page} pageSize={result.pageSize} pathname="/admin/products" query={{ q }} totalItems={result.totalItems} />
      </div>
    </div>
  );
}
