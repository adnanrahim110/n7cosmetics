import type { RowDataPacket } from "mysql2/promise";
import { Plus } from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import MediaDropzone from "@/components/admin/MediaDropzone";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import StatusBadge from "@/components/admin/StatusBadge";
import { selectRows } from "@/lib/db/query";
import { createCategoryAction, updateCategoryAction } from "./actions";

interface CategoryRow extends RowDataPacket { id: string; parent_id: string | null; name: string; slug: string; description: string | null; image_url: string | null; status: "ACTIVE" | "HIDDEN"; sort_order: number; product_count: number }
const input = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";

function CategoryFields({ category, categories }: { category?: CategoryRow; categories: CategoryRow[] }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <input aria-label="Name" className={input} defaultValue={category?.name} maxLength={150} name="name" placeholder="Category name" required />
    <input aria-label="Slug" className={input} defaultValue={category?.slug} maxLength={190} name="slug" placeholder="Slug (optional)" />
    <CustomSelect defaultValue={category?.parent_id ?? ""} name="parentId" options={[{ value: "", label: "No parent" }, ...categories.filter((item) => item.id !== category?.id).map((item) => ({ value: item.id, label: item.name, mediaUrl: item.image_url, mediaType: "image" as const }))]} placeholder="Parent category" />
    <CustomSelect defaultValue={category?.status ?? "ACTIVE"} name="status" options={[{ value: "ACTIVE", label: "Active" }, { value: "HIDDEN", label: "Hidden" }]} required searchable={false} />
    <input aria-label="Sort order" className={input} defaultValue={category?.sort_order ?? 0} name="sortOrder" placeholder="Sort order" type="number" />
    <MediaDropzone accept="image" className="sm:col-span-2 lg:col-span-4" defaultAssets={category?.image_url ? [{ url: category.image_url, name: category.name, type: "image" }] : []} label="Category image" name="imageUrl" />
    <textarea aria-label="Description" className={`${input} sm:col-span-2 lg:col-span-4`} defaultValue={category?.description ?? ""} maxLength={5000} name="description" placeholder="Description" rows={2} />
  </div>;
}

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [categories, query] = await Promise.all([
    selectRows<CategoryRow>(`SELECT CAST(c.id AS CHAR) AS id, CAST(c.parent_id AS CHAR) AS parent_id, c.name, c.slug, c.description, c.image_url, c.status, c.sort_order, COUNT(pc.product_id) AS product_count FROM categories c LEFT JOIN product_categories pc ON pc.category_id = c.id GROUP BY c.id ORDER BY c.sort_order, c.name`),
    searchParams,
  ]);
  return <div><PageHeader eyebrow="Catalog" title="Categories" description="Group products for navigation and discount rules." />{query.saved ? <Notice type="success">Categories saved.</Notice> : null}{query.error ? <Notice>{query.error === "duplicate" ? "That category slug is already in use." : "Check the category values."}</Notice> : null}
    <section className="mt-7 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><h2 className="mb-4 font-body text-base font-semibold text-zinc-950">Add category</h2><form action={createCategoryAction}><CategoryFields categories={categories} /><button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" type="submit"><Plus size={15} />Add category</button></form></section>
    <section className="mt-5 space-y-3">{categories.map((category) => <details key={category.id} className="group rounded-xl border border-zinc-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate font-medium">{category.name}</p><p className="mt-0.5 text-xs text-zinc-400">/{category.slug} · {category.product_count} products</p></div><StatusBadge status={category.status} /><span className="text-sm text-zinc-400 group-open:rotate-180">⌄</span></summary><form action={updateCategoryAction.bind(null, category.id)} className="border-t border-zinc-100 p-5"><CategoryFields category={category} categories={categories} /><button className="mt-4 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Save category</button></form></details>)}{!categories.length ? <p className="rounded-xl border border-dashed border-zinc-300 py-10 text-center text-sm text-zinc-500">No categories yet.</p> : null}</section>
  </div>;
}
