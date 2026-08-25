import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import { Eye, Pencil, Plus } from "lucide-react";
import AdminThumbnail from "@/components/admin/AdminThumbnail";
import AdminMutationForm from "@/components/admin/AdminMutationForm";
import CatalogStatusActionButton from "@/components/admin/CatalogStatusActionButton";
import CustomSelect from "@/components/admin/CustomSelect";
import MediaDropzone from "@/components/admin/MediaDropzone";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { selectRows } from "@/lib/db/query";
import { createCollectionAction, setCollectionStatusAction, updateCollectionAction } from "./actions";

interface CollectionRow extends RowDataPacket {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  product_count: number;
}

interface CollectionsPageProps {
  searchParams: Promise<{ error?: string; saved?: string; edit?: string }>;
}

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-zinc-700";
const hintClass = "mt-1.5 text-xs leading-5 text-zinc-500";

function CollectionFields({ collection }: { collection?: CollectionRow }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-950">Collection details</h3>
          <p className={hintClass}>Set the customer-facing name, URL, and description.</p>
        </div>
        <label className={labelClass}>
          Collection name
          <input className={inputClass} defaultValue={collection?.name ?? ""} maxLength={150} name="name" placeholder="e.g. Summer collection" required />
        </label>
        <label className={labelClass}>
          Slug
          <input className={inputClass} defaultValue={collection?.slug ?? ""} maxLength={190} name="slug" placeholder="Generated from the name if empty" />
          <span className={hintClass}>Used for the collection’s storefront URL.</span>
        </label>
        <label className={`${labelClass} lg:col-span-2`}>
          Description
          <textarea className={inputClass} defaultValue={collection?.description ?? ""} maxLength={10000} name="description" placeholder="Describe the story or products behind this collection" rows={5} />
        </label>
      </section>

      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-950">Publishing and display</h3>
          <p className={hintClass}>Choose the storefront state, display order, and visual.</p>
        </div>
        <MediaDropzone accept="image" defaultAssets={collection?.image_url ? [{ url: collection.image_url, name: collection.name, type: "image" }] : []} hint="Used as the primary visual for this collection." label="Collection image" name="imageUrl" />
        <div className="space-y-5">
          <div>
            <CustomSelect defaultValue={collection?.status ?? "DRAFT"} label="Status" name="status" options={[{ value: "DRAFT", label: "Draft" }, { value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }]} required searchable={false} />
            <p className={hintClass}>Only active collections should be visible to customers.</p>
          </div>
          <label className={labelClass}>
            Sort order
            <input className={inputClass} defaultValue={collection?.sort_order ?? 0} name="sortOrder" type="number" />
            <span className={hintClass}>Lower numbers appear first.</span>
          </label>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-950">Search visibility</h3>
          <p className={hintClass}>Optional metadata used by search engines and shared links.</p>
        </div>
        <label className={labelClass}>
          SEO title
          <input className={inputClass} defaultValue={collection?.seo_title ?? ""} maxLength={190} name="seoTitle" placeholder="Leave empty to use the collection name" />
        </label>
        <label className={labelClass}>
          SEO description
          <textarea className={inputClass} defaultValue={collection?.seo_description ?? ""} maxLength={320} name="seoDescription" placeholder="A concise summary for search results" rows={3} />
        </label>
      </section>
    </div>
  );
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const [collections, query] = await Promise.all([
    selectRows<CollectionRow>(
      `SELECT CAST(c.id AS CHAR) AS id,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.status,
        c.sort_order,
        c.seo_title,
        c.seo_description,
        COUNT(pc.product_id) AS product_count
      FROM collections c
      LEFT JOIN product_collections pc ON pc.collection_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order, c.name`,
    ),
    searchParams,
  ]);
  const editingCollection = collections.find((collection) => collection.id === query.edit);

  return (
    <div>
      <PageHeader
        actions={<Link className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" href="/admin/collections#collection-form"><Plus size={16} />Add collection</Link>}
        description="Curate product groups for storefront pages and campaigns."
        eyebrow="Catalog"
        title="Collections"
      />
      {query.saved ? <Notice type="success">Collection saved.</Notice> : null}
      {query.error ? <Notice>{query.error === "duplicate" ? "That collection slug is already in use." : query.error === "media" ? "The collection image is invalid or too large. No changes were saved." : query.error === "save" ? "The collection could not be saved. No changes were committed." : "Check the collection values."}</Notice> : null}

      <div className="mt-7 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Sort order</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {collections.map((collection) => (
                <tr className="hover:bg-zinc-50/70" key={collection.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AdminThumbnail alt={collection.name} src={collection.image_url} />
                      <div className="min-w-0">
                        <Link className="block max-w-72 truncate font-medium text-zinc-950 hover:text-amber-700" href={`/admin/collections?edit=${collection.id}#collection-form`}>{collection.name}</Link>
                        <p className="mt-0.5 max-w-72 truncate text-xs text-zinc-400">/{collection.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={collection.status} /></td>
                  <td className="px-4 py-3 text-zinc-600">{collection.product_count}</td>
                  <td className="px-4 py-3 text-zinc-600">{collection.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link aria-label={`View ${collection.name} in storefront`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-amber-700" href={`/${collection.slug}`} target="_blank" title="View storefront"><Eye size={16} /></Link>
                      <Link aria-label={`Edit ${collection.name}`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={`/admin/collections?edit=${collection.id}#collection-form`} title="Edit collection"><Pencil size={16} /></Link>
                      <AdminMutationForm action={setCollectionStatusAction.bind(null, collection.id, collection.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED")} errorMessage="The collection status couldn’t be changed" loadingMessage="Updating collection…" successDescription={collection.status === "ARCHIVED" ? "The collection is available as a draft." : "It is no longer available on the storefront."} successMessage={collection.status === "ARCHIVED" ? "Collection restored" : "Collection archived"} successType={collection.status === "ARCHIVED" ? "success" : "warning"}>
                        <CatalogStatusActionButton action={collection.status === "ARCHIVED" ? "restore" : "archive"} name={collection.name} />
                      </AdminMutationForm>
                    </div>
                  </td>
                </tr>
              ))}
              {!collections.length ? <tr><td className="px-4 py-12 text-center text-zinc-500" colSpan={5}>No collections yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-7 scroll-mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" id="collection-form">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-body text-base font-semibold text-zinc-950">{editingCollection ? `Edit ${editingCollection.name}` : "Add collection"}</h2>
            <p className="mt-1 text-sm text-zinc-500">{editingCollection ? "Update this collection’s content and storefront status." : "Create a new collection for a storefront page or campaign."}</p>
          </div>
        </div>
        <form action={editingCollection ? updateCollectionAction.bind(null, editingCollection.id) : createCollectionAction} className="space-y-5">
          <CollectionFields collection={editingCollection} />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-5">
            {editingCollection ? <Link className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50" href="/admin/collections#collection-form">Cancel</Link> : null}
            <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">
              {editingCollection ? <Pencil size={15} /> : <Plus size={15} />}
              {editingCollection ? "Save collection" : "Add collection"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
