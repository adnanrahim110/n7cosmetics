import Link from "next/link";
import CustomSelect from "@/components/admin/CustomSelect";
import MediaDropzone from "@/components/admin/MediaDropzone";
import type { CatalogOption, ProductFormRecord } from "@/lib/admin/products";
import { penceToPounds } from "@/lib/admin/form";

interface ProductFormProps {
  product?: ProductFormRecord | null;
  categories: CatalogOption[];
  collections: CatalogOption[];
  action: (formData: FormData) => void | Promise<void>;
}

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-zinc-700";

export default function ProductForm({ product, categories, collections, action }: ProductFormProps) {
  const selectedCategories = product?.category_ids?.split(",") ?? [];
  const selectedCollections = product?.collection_ids?.split(",") ?? [];

  return (
    <form action={action} className="mt-7 space-y-6">
      <section className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-2">
        <div className="lg:col-span-2"><h2 className="font-body text-base font-semibold text-zinc-950">Product details</h2></div>
        <label className={labelClass}>Name<input className={inputClass} defaultValue={product?.name ?? ""} maxLength={190} name="name" required /></label>
        <label className={labelClass}>Slug<input className={inputClass} defaultValue={product?.slug ?? ""} maxLength={190} name="slug" placeholder="Generated from name if empty" /></label>
        <CustomSelect defaultValue={product?.product_type ?? "STANDARD"} label="Type" name="productType" options={[{ value: "STANDARD", label: "Standard" }, { value: "BUNDLE", label: "Bundle" }]} required searchable={false} />
        <CustomSelect defaultValue={product?.status ?? "DRAFT"} label="Status" name="status" options={[{ value: "DRAFT", label: "Draft" }, { value: "ACTIVE", label: "Active" }, { value: "ARCHIVED", label: "Archived" }]} required searchable={false} />
        <label className={labelClass}>Brand<input className={inputClass} defaultValue={product?.brand ?? ""} maxLength={150} name="brand" /></label>
        <label className={labelClass}>Inspired by<input className={inputClass} defaultValue={product?.inspired_by ?? ""} maxLength={190} name="inspiredBy" /></label>
        <CustomSelect defaultValue={product?.audience ?? "UNSPECIFIED"} label="Audience" name="audience" options={[{ value: "UNSPECIFIED", label: "Unspecified" }, { value: "MEN", label: "Men" }, { value: "WOMEN", label: "Women" }, { value: "UNISEX", label: "Unisex" }]} required searchable={false} />
        <label className={labelClass}>Fragrance notes<input className={inputClass} defaultValue={product?.fragrance_notes_json?.join(", ") ?? ""} name="notes" placeholder="Amber, oud, vanilla" /></label>
        <label className={`${labelClass} lg:col-span-2`}>Short description<textarea className={inputClass} defaultValue={product?.short_description ?? ""} maxLength={500} name="shortDescription" rows={2} /></label>
        <label className={`${labelClass} lg:col-span-2`}>Full description<textarea className={inputClass} defaultValue={product?.description ?? ""} maxLength={30000} name="description" rows={6} /></label>
        <label className="flex items-center gap-2 text-sm text-zinc-700"><input defaultChecked={Boolean(product?.featured)} name="featured" type="checkbox" /> Featured product</label>
        <label className="flex items-center gap-2 text-sm text-zinc-700"><input defaultChecked={product ? Boolean(product.track_inventory) : true} name="trackInventory" type="checkbox" /> Track inventory</label>
      </section>

      <section className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-3">
        <div className="lg:col-span-3"><h2 className="font-body text-base font-semibold text-zinc-950">Default variant and inventory</h2></div>
        <label className={labelClass}>Variant title<input className={inputClass} defaultValue={product?.variant_title ?? "Default"} maxLength={150} name="variantTitle" required /></label>
        <label className={labelClass}>SKU<input className={inputClass} defaultValue={product?.sku ?? ""} maxLength={100} name="sku" required /></label>
        <label className={labelClass}>Price (£)<input className={inputClass} defaultValue={penceToPounds(product?.price_pence)} inputMode="decimal" name="price" placeholder="29.99" required /></label>
        <label className={labelClass}>Compare-at price (£)<input className={inputClass} defaultValue={penceToPounds(product?.compare_at_price_pence)} inputMode="decimal" name="compareAtPrice" /></label>
        <label className={labelClass}>Stock on hand<input className={inputClass} defaultValue={product?.stock_on_hand ?? 0} name="stockOnHand" required type="number" /></label>
        <label className={labelClass}>Low-stock threshold<input className={inputClass} defaultValue={product?.low_stock_threshold ?? 5} min={0} name="lowStockThreshold" required type="number" /></label>
        <label className={labelClass}>Weight (grams)<input className={inputClass} defaultValue={product?.weight_grams ?? ""} min={1} name="weightGrams" type="number" /></label>
      </section>

      <section className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-2">
        <div className="lg:col-span-2"><h2 className="font-body text-base font-semibold text-zinc-950">Media and organisation</h2></div>
        <MediaDropzone accept="image" defaultAssets={product?.image_url ? [{ url: product.image_url, name: product.image_alt ?? product.name, type: "image" }] : []} label="Primary product image" name="imageUrl" />
        <MediaDropzone accept="video" defaultAssets={product?.video_url ? [{ url: product.video_url, name: `${product.name} video`, type: "video" }] : []} label="Product video" name="videoUrl" />
        <label className={`${labelClass} lg:col-span-2`}>Image alt text<input className={inputClass} defaultValue={product?.image_alt ?? ""} maxLength={255} name="imageAlt" /></label>
        <CustomSelect defaultValue={selectedCategories} emptyMessage="Create categories first." label="Categories" multiple name="categoryIds" options={categories.map((category) => ({ value: category.id, label: category.name, mediaUrl: category.image_url, mediaType: "image" }))} placeholder="Select categories" />
        <CustomSelect defaultValue={selectedCollections} emptyMessage="Create collections first." label="Collections" multiple name="collectionIds" options={collections.map((collection) => ({ value: collection.id, label: collection.name, mediaUrl: collection.image_url, mediaType: "image" }))} placeholder="Select collections" />
      </section>

      <section className="grid gap-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm lg:grid-cols-2">
        <div className="lg:col-span-2"><h2 className="font-body text-base font-semibold text-zinc-950">Search visibility</h2></div>
        <label className={labelClass}>SEO title<input className={inputClass} defaultValue={product?.seo_title ?? ""} maxLength={190} name="seoTitle" /></label>
        <label className={labelClass}>SEO description<textarea className={inputClass} defaultValue={product?.seo_description ?? ""} maxLength={320} name="seoDescription" rows={3} /></label>
      </section>

      <div className="flex justify-end gap-3">
        <Link className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50" href="/admin/products">Cancel</Link>
        <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">{product ? "Save product" : "Create product"}</button>
      </div>
    </form>
  );
}
