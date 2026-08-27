import Link from "next/link";
import { Eye, Pencil, Plus } from "lucide-react";
import AdminThumbnail from "@/components/admin/AdminThumbnail";
import AdminMutationForm from "@/components/admin/AdminMutationForm";
import ArchiveBundleButton from "@/components/admin/ArchiveBundleButton";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { listBundles } from "@/lib/admin/bundles";
import { archiveBundleAction } from "./actions";

function money(pence: number | null): string {
  if (pence === null) return "—";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export default async function BundlesAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [bundles, query] = await Promise.all([listBundles(), searchParams]);
  return (
    <div>
      <PageHeader
        actions={<Link className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" href="/admin/bundles/new"><Plus size={16} />Add bundle</Link>}
        description="Create curated product sets and manage how they appear in the storefront."
        eyebrow="Catalog"
        title="Bundles"
      />
      {query.saved ? <Notice type="success">Bundle {query.saved === "created" ? "created" : "updated"}.</Notice> : null}

      <div className="mt-7 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Bundle</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {bundles.map((bundle) => (
                <tr className="hover:bg-zinc-50/70" key={bundle.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AdminThumbnail alt={bundle.name} src={bundle.image_url} />
                      <div className="min-w-0">
                        <Link className="block max-w-80 truncate font-medium text-zinc-950 hover:text-amber-700" href={`/admin/bundles/${bundle.id}`}>{bundle.name}</Link>
                        <p className="mt-0.5 max-w-80 truncate text-xs text-zinc-400">/bundles/{bundle.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={bundle.status} /></td>
                  <td className="px-4 py-3 text-zinc-600">{Number(bundle.component_count)}</td>
                  <td className="px-4 py-3 text-zinc-600">{money(bundle.price_pence)}</td>
                  <td className="px-4 py-3 text-zinc-600">{bundle.stock_on_hand ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link aria-label={`View ${bundle.name} in storefront`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-amber-700" href={`/bundles/${bundle.slug}`} target="_blank" title="View storefront"><Eye size={16} /></Link>
                      <Link aria-label={`Edit ${bundle.name}`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={`/admin/bundles/${bundle.id}`} title="Edit bundle"><Pencil size={16} /></Link>
                      <AdminMutationForm action={archiveBundleAction.bind(null, bundle.id)} errorMessage="The bundle couldn’t be archived" loadingMessage="Archiving bundle…" successDescription="It is hidden from the storefront and retained in admin." successMessage="Bundle archived" successType="warning">
                        <ArchiveBundleButton disabled={bundle.status === "ARCHIVED"} name={bundle.name} />
                      </AdminMutationForm>
                    </div>
                  </td>
                </tr>
              ))}
              {!bundles.length ? <tr><td className="px-4 py-12 text-center text-zinc-500" colSpan={6}>No bundles yet. Create your first curated bundle.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
