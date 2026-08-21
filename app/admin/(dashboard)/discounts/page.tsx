import type { RowDataPacket } from "mysql2/promise";
import { Plus } from "lucide-react";
import CustomSelect from "@/components/admin/CustomSelect";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import { penceToPounds } from "@/lib/admin/form";
import { selectRows } from "@/lib/db/query";
import { createDiscountAction, updateDiscountAction } from "./actions";

interface DiscountRow extends RowDataPacket { id: string; name: string; method: "AUTOMATIC" | "COUPON"; discount_type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"; value: number; applies_to: "ALL" | "PRODUCTS" | "CATEGORIES" | "COLLECTIONS"; minimum_subtotal_pence: number | null; maximum_discount_pence: number | null; priority: number; starts_at: Date | null; ends_at: Date | null; is_active: number; product_ids: string | null; category_ids: string | null; collection_ids: string | null }
interface OptionRow extends RowDataPacket { id: string; name: string; image_url: string | null }
const input = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
function localDate(value: Date | null | undefined) { if (!value) return ""; const d = new Date(value); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function richOptions(rows: OptionRow[]) { return rows.map((option) => ({ value: option.id, label: option.name, mediaUrl: option.image_url, mediaType: "image" as const })); }

function Fields({ item, products, categories, collections }: { item?: DiscountRow; products: OptionRow[]; categories: OptionRow[]; collections: OptionRow[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <input aria-label="Name" className={`${input} sm:col-span-2`} defaultValue={item?.name} maxLength={190} name="name" placeholder="Discount name" required />
    <CustomSelect defaultValue={item?.method ?? "AUTOMATIC"} name="method" options={[{ value: "AUTOMATIC", label: "Automatic" }, { value: "COUPON", label: "Coupon based" }]} required searchable={false} />
    <CustomSelect defaultValue={item?.discount_type ?? "PERCENTAGE"} name="discountType" options={[{ value: "PERCENTAGE", label: "Percentage" }, { value: "FIXED_AMOUNT", label: "Fixed amount" }, { value: "FREE_SHIPPING", label: "Free shipping" }]} required searchable={false} />
    <input aria-label="Value" className={input} defaultValue={item ? (item.discount_type === "FIXED_AMOUNT" ? penceToPounds(item.value) : item.value) : ""} min={0} name="value" placeholder="Percent or £ amount" required step="0.01" type="number" />
    <CustomSelect defaultValue={item?.applies_to ?? "ALL"} name="appliesTo" options={[{ value: "ALL", label: "All products" }, { value: "PRODUCTS", label: "Selected products" }, { value: "CATEGORIES", label: "Selected categories" }, { value: "COLLECTIONS", label: "Selected collections" }]} required searchable={false} />
    <input aria-label="Minimum subtotal" className={input} defaultValue={penceToPounds(item?.minimum_subtotal_pence)} min={0} name="minimumSubtotal" placeholder="Minimum subtotal £" step="0.01" type="number" />
    <input aria-label="Maximum discount" className={input} defaultValue={penceToPounds(item?.maximum_discount_pence)} min={0} name="maximumDiscount" placeholder="Maximum discount £" step="0.01" type="number" />
    <input aria-label="Priority" className={input} defaultValue={item?.priority ?? 0} name="priority" placeholder="Priority" type="number" />
    <label className="text-xs text-zinc-500">Starts at<input className={`${input} mt-1`} defaultValue={localDate(item?.starts_at)} name="startsAt" type="datetime-local" /></label>
    <label className="text-xs text-zinc-500">Ends at<input className={`${input} mt-1`} defaultValue={localDate(item?.ends_at)} name="endsAt" type="datetime-local" /></label>
    <label className="flex items-center gap-2 text-sm text-zinc-700"><input defaultChecked={item ? Boolean(item.is_active) : true} name="isActive" type="checkbox" />Active</label>
    <div className="grid gap-3 lg:col-span-4 lg:grid-cols-3">
      <CustomSelect defaultValue={item?.product_ids?.split(",") ?? []} label="Products" multiple name="productIds" options={richOptions(products)} placeholder="Select products" />
      <CustomSelect defaultValue={item?.category_ids?.split(",") ?? []} label="Categories" multiple name="categoryIds" options={richOptions(categories)} placeholder="Select categories" />
      <CustomSelect defaultValue={item?.collection_ids?.split(",") ?? []} label="Collections" multiple name="collectionIds" options={richOptions(collections)} placeholder="Select collections" />
    </div>
  </div>;
}

export default async function DiscountsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [items, products, categories, collections, query] = await Promise.all([
    selectRows<DiscountRow>(`SELECT CAST(d.id AS CHAR) AS id, d.*, (SELECT GROUP_CONCAT(product_id) FROM discount_products WHERE discount_id = d.id) AS product_ids, (SELECT GROUP_CONCAT(category_id) FROM discount_categories WHERE discount_id = d.id) AS category_ids, (SELECT GROUP_CONCAT(collection_id) FROM discount_collections WHERE discount_id = d.id) AS collection_ids FROM discounts d ORDER BY d.priority DESC, d.created_at DESC`),
    selectRows<OptionRow>(`SELECT CAST(p.id AS CHAR) AS id, p.name, (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.sort_order, pi.id LIMIT 1) AS image_url FROM products p WHERE p.status != 'ARCHIVED' ORDER BY p.name`),
    selectRows<OptionRow>("SELECT CAST(id AS CHAR) AS id, name, image_url FROM categories ORDER BY name"),
    selectRows<OptionRow>("SELECT CAST(id AS CHAR) AS id, name, image_url FROM collections WHERE status != 'ARCHIVED' ORDER BY name"),
    searchParams,
  ]);
  return <div><PageHeader eyebrow="Promotions" title="Discounts" description="Configure automatic, coupon-linked, product, category, and collection discounts." />{query.saved ? <Notice type="success">Discounts saved.</Notice> : null}{query.error ? <Notice>Check the discount values and date range.</Notice> : null}<details className="mt-7 rounded-xl border border-zinc-200 bg-white shadow-sm" open={!items.length}><summary className="cursor-pointer list-none px-5 py-4 font-medium">Add discount</summary><form action={createDiscountAction} className="border-t border-zinc-100 p-5"><Fields products={products} categories={categories} collections={collections} /><button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" type="submit"><Plus size={15} />Add discount</button></form></details><section className="mt-5 space-y-3">{items.map((item) => <details key={item.id} className="group rounded-xl border border-zinc-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4"><div className="flex-1"><p className="font-medium">{item.name}</p><p className="mt-0.5 text-xs text-zinc-400">{item.discount_type.toLowerCase().replaceAll("_", " ")} · {item.applies_to.toLowerCase()}</p></div><span className={`rounded-full px-2 py-1 text-xs ${item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{item.is_active ? "active" : "inactive"}</span></summary><form action={updateDiscountAction.bind(null, item.id)} className="border-t border-zinc-100 p-5"><Fields item={item} products={products} categories={categories} collections={collections} /><button className="mt-4 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Save discount</button></form></details>)}</section></div>;
}
