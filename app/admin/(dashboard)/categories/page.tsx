import Link from "next/link";
import type { RowDataPacket } from "mysql2/promise";
import { ArrowUpRight, Pencil, PencilLine, Plus } from "lucide-react";
import { categoryCollectionSlugs, categoryHref } from "@/lib/commerce/category-config";
import AdminThumbnail from "@/components/admin/AdminThumbnail";
import AdminMutationForm from "@/components/admin/AdminMutationForm";
import CatalogStatusActionButton from "@/components/admin/CatalogStatusActionButton";
import CustomSelect from "@/components/admin/CustomSelect";
import MediaDropzone from "@/components/admin/MediaDropzone";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { selectRows } from "@/lib/db/query";
import { createCategoryAction, setCategoryStatusAction, updateCategoryAction } from "./actions";

interface CategoryRow extends RowDataPacket {
  id: string;
  collection_id: string;
  collection_name: string;
  collection_slug: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: "ACTIVE" | "HIDDEN";
  sort_order: number;
  product_count: number;
  seo_title: string | null;
  seo_description: string | null;
}

interface CollectionOption extends RowDataPacket { id: string; name: string; image_url: string | null }

interface CategoriesPageProps {
  searchParams: Promise<{ error?: string; saved?: string; edit?: string }>;
}

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-zinc-700";
const hintClass = "mt-1.5 text-xs leading-5 text-zinc-500";

function CategoryFields({ category, collections }: { category?: CategoryRow; collections: CollectionOption[] }) {
  return (
    <div className="space-y-5">
      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-950">Category details</h3>
          <p className={hintClass}>Set the customer-facing name and URL.</p>
        </div>
        <label className={labelClass}>
          Category name
          <input className={inputClass} defaultValue={category?.name ?? ""} maxLength={150} name="name" placeholder="e.g. Men’s fragrances" required />
        </label>
        <label className={labelClass}>
          Slug
          <input className={inputClass} defaultValue={category?.slug ?? ""} maxLength={190} name="slug" placeholder="Generated from the name if empty" />
          <span className={hintClass}>Used in links and navigation.</span>
        </label>
      </section>

      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-zinc-950">Organisation and visibility</h3>
          <p className={hintClass}>Control where the category sits and whether customers can see it.</p>
        </div>
        <div>
          <CustomSelect
            defaultValue={category?.collection_id ?? ""}
            label="Parent collection"
            name="collectionId"
            options={collections.map((item) => ({ value: item.id, label: item.name, mediaUrl: item.image_url, mediaType: "image" as const }))}
            placeholder="Choose a collection"
            required
          />
          <p className={hintClass}>Every category belongs to one storefront collection. Assigned products must belong to that collection.</p>
        </div>
        <div>
          <CustomSelect defaultValue={category?.status ?? "ACTIVE"} label="Status" name="status" options={[{ value: "ACTIVE", label: "Active" }, { value: "HIDDEN", label: "Hidden" }]} required searchable={false} />
          <p className={hintClass}>Hidden categories remain available in admin.</p>
        </div>
        <label className={labelClass}>
          Sort order
          <input className={inputClass} defaultValue={category?.sort_order ?? 0} name="sortOrder" type="number" />
          <span className={hintClass}>Lower numbers appear first.</span>
        </label>
      </section>

      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-950">Content</h3>
          <p className={hintClass}>Add supporting copy and imagery for this category.</p>
        </div>
        <label className={labelClass}>
          Description
          <textarea className={inputClass} defaultValue={category?.description ?? ""} maxLength={5000} name="description" placeholder="Describe the products included in this category" rows={5} />
        </label>
        <MediaDropzone accept="image" defaultAssets={category?.image_url ? [{ url: category.image_url, name: category.name, type: "image" }] : []} hint="Used wherever the category is represented visually." label="Category image" name="imageUrl" />
      </section>
      <section className="grid gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 lg:grid-cols-2">
        <label className={labelClass}>SEO title<input className={inputClass} defaultValue={category?.seo_title ?? ""} maxLength={190} name="seoTitle" /></label>
        <label className={labelClass}>SEO description<textarea className={inputClass} defaultValue={category?.seo_description ?? ""} maxLength={320} name="seoDescription" rows={3} /></label>
      </section>
    </div>
  );
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const [categories, collections, query] = await Promise.all([
    selectRows<CategoryRow>(
      `SELECT CAST(c.id AS CHAR) AS id,
        CAST(c.collection_id AS CHAR) AS collection_id,
        col.name AS collection_name,
        col.slug AS collection_slug,
        c.name,
        c.slug,
        c.description,
        c.image_url,
        c.status,
        c.sort_order,
        c.seo_title,
        c.seo_description,
        COUNT(pc.product_id) AS product_count
      FROM categories c
      INNER JOIN collections col ON col.id = c.collection_id
      LEFT JOIN product_categories pc ON pc.category_id = c.id
      GROUP BY c.id, col.name, col.slug
      ORDER BY col.sort_order, col.name, c.sort_order, c.name`,
    ),
    selectRows<CollectionOption>(`SELECT CAST(id AS CHAR) AS id, name, image_url FROM collections WHERE status != 'ARCHIVED' AND slug IN (${categoryCollectionSlugs.map(() => "?").join(", ")}) ORDER BY sort_order, name`, categoryCollectionSlugs),
    searchParams,
  ]);
  const editingCategory = categories.find((category) => category.id === query.edit);

  return (
    <div>
      <PageHeader
        actions={<Link className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" href="/admin/categories#category-form"><Plus size={16} />Add category</Link>}
        description="Manage categories inside collections, then edit their storefront pages with the collection page editor."
        eyebrow="Catalog"
        title="Categories"
      />
      {query.saved ? <Notice type="success">Category saved.</Notice> : null}
      {query.error ? <Notice>{query.error === "duplicate" ? "That category slug is already in use in this collection." : query.error === "collection" ? "Choose a storefront collection containing all products assigned to this category. Update product assignments before moving the category." : query.error === "media" ? "The category image is invalid or too large. No changes were saved." : query.error === "save" ? "The category could not be saved. No changes were committed." : "Check the category values."}</Notice> : null}

      <div className="mt-7 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Collection</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Sort order</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {categories.map((category) => (
                <tr className="hover:bg-zinc-50/70" key={category.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AdminThumbnail alt={category.name} src={category.image_url} />
                      <div className="min-w-0">
                        <Link className="block max-w-72 truncate font-medium text-zinc-950 hover:text-amber-700" href={`/admin/categories?edit=${category.id}#category-form`}>{category.name}</Link>
                        <p className="mt-0.5 max-w-72 truncate text-xs text-zinc-400">{categoryHref(category.collection_slug, category.slug)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{category.collection_name}</td>
                  <td className="px-4 py-3"><StatusBadge status={category.status} /></td>
                  <td className="px-4 py-3 text-zinc-600">{category.product_count}</td>
                  <td className="px-4 py-3 text-zinc-600">{category.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link aria-label={`Edit ${category.name} page`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={`/admin/pages/category-${category.id}`} title="Edit page"><PencilLine size={16} /></Link>
                      <Link aria-label={`View ${category.name} page`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={categoryHref(category.collection_slug, category.slug)} target="_blank" title="View page"><ArrowUpRight size={16} /></Link>
                      <Link aria-label={`Edit ${category.name}`} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950" href={`/admin/categories?edit=${category.id}#category-form`} title="Edit category"><Pencil size={16} /></Link>
                      <AdminMutationForm action={setCategoryStatusAction.bind(null, category.id, category.status === "ACTIVE" ? "HIDDEN" : "ACTIVE")} errorMessage="The category visibility couldn’t be changed" loadingMessage="Updating category…" successDescription={category.status === "ACTIVE" ? "Customers can no longer see this category." : "Customers can now see this category."} successMessage={category.status === "ACTIVE" ? "Category hidden" : "Category activated"} successType={category.status === "ACTIVE" ? "warning" : "success"}>
                        <CatalogStatusActionButton action={category.status === "ACTIVE" ? "hide" : "activate"} name={category.name} />
                      </AdminMutationForm>
                    </div>
                  </td>
                </tr>
              ))}
              {!categories.length ? <tr><td className="px-4 py-12 text-center text-zinc-500" colSpan={6}>No categories yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-7 scroll-mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm" id="category-form">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-body text-base font-semibold text-zinc-950">{editingCategory ? `Edit ${editingCategory.name}` : "Add category"}</h2>
            <p className="mt-1 text-sm text-zinc-500">{editingCategory ? "Update this category’s details and storefront visibility." : "Create a new category for organizing products."}</p>
          </div>
        </div>
        {editingCategory ? <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-800" href={`/admin/pages/category-${editingCategory.id}`}><PencilLine size={16} />Edit hero and detail sections</Link> : null}
        <form action={editingCategory ? updateCategoryAction.bind(null, editingCategory.id) : createCategoryAction} className="space-y-5" key={editingCategory?.id ?? "new"}>
          <CategoryFields collections={collections} category={editingCategory} />
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-5">
            {editingCategory ? <Link className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50" href="/admin/categories#category-form">Cancel</Link> : null}
            <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">
              {editingCategory ? <Pencil size={15} /> : <Plus size={15} />}
              {editingCategory ? "Save category" : "Add category"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
