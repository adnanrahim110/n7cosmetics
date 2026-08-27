"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, FileText, Images, LoaderCircle, PackageCheck, Save, Search, Sparkles } from "lucide-react";
import AdminToggle from "@/components/admin/AdminToggle";
import { showAdminToast } from "@/components/admin/AdminToastProvider";
import CustomSelect from "@/components/admin/CustomSelect";
import MediaDropzone from "@/components/admin/MediaDropzone";
import type { CatalogOption, ProductFormRecord } from "@/lib/admin/products";
import { penceToPounds, slugify } from "@/lib/admin/form";

interface ProductActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

interface ProductFormProps {
  product?: ProductFormRecord | null;
  categories: CatalogOption[];
  collections: CatalogOption[];
  action: (previousState: ProductActionState, formData: FormData) => Promise<ProductActionState>;
  returnTo: string;
}

type NoteGroup = "top" | "heart" | "base";

const inputClass = "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-zinc-700";

function SectionHeader({ icon: Icon, title, description }: { icon: typeof Boxes; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-zinc-100 pb-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-800"><Icon size={17} /></span>
      <div><h2 className="font-body text-base font-semibold text-zinc-950">{title}</h2><p className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p></div>
    </div>
  );
}

function FieldError({ state, name }: { state: ProductActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <span className="mt-1.5 block text-xs font-medium text-red-600">{message}</span> : null;
}

function structuredNotes(product: ProductFormRecord | null | undefined): Record<NoteGroup, string> {
  const empty = { top: "", heart: "", base: "" };
  if (!product?.fragrance_notes_json) return empty;
  let source: unknown = product.fragrance_notes_json;
  if (typeof source === "string") {
    const rawSource = source;
    try { source = JSON.parse(rawSource); } catch { return { ...empty, top: rawSource }; }
  }
  if (Array.isArray(source)) {
    const groups: Record<NoteGroup, string[]> = { top: [], heart: [], base: [] };
    for (const entry of source) {
      if (typeof entry !== "string") continue;
      const match = entry.match(/^(top|heart|middle|base)(?:\s+notes?)?\s*:\s*(.+)$/i);
      const group: NoteGroup = match?.[1]?.toLowerCase() === "base" ? "base" : ["heart", "middle"].includes(match?.[1]?.toLowerCase() ?? "") ? "heart" : "top";
      groups[group].push(match?.[2] ?? entry);
    }
    return { top: groups.top.join(", "), heart: groups.heart.join(", "), base: groups.base.join(", ") };
  }
  if (typeof source === "object" && source) {
    const record = source as Record<string, unknown>;
    const read = (key: NoteGroup) => Array.isArray(record[key]) ? record[key].filter((note): note is string => typeof note === "string").join(", ") : typeof record[key] === "string" ? record[key] : "";
    return { top: read("top"), heart: read("heart"), base: read("base") };
  }
  return empty;
}

function StatusToggle({ defaultActive }: { defaultActive: boolean }) {
  const [active, setActive] = useState(defaultActive);
  return (
    <div className="flex items-center gap-3">
      <input name="status" type="hidden" value={active ? "ACTIVE" : "DRAFT"} />
      <button aria-checked={active} aria-label="Toggle product status" className={`relative h-7 w-12 rounded-full border p-0.5 shadow-inner transition ${active ? "border-emerald-700 bg-emerald-700" : "border-zinc-300 bg-zinc-200"}`} onClick={() => setActive((current) => !current)} role="switch" type="button">
        <span className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-5" : "translate-x-0"}`} />
      </button>
      <span className="sm:min-w-20"><span className="block text-xs font-semibold text-zinc-900">{active ? "Active" : "Draft"}</span><span className="hidden text-[10px] text-zinc-500 sm:block">{active ? "Visible in store" : "Not published"}</span></span>
    </div>
  );
}

export default function ProductForm({ product, categories, collections, action, returnTo }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const shownError = useRef("");
  const [name, setName] = useState(product?.name ?? "");
  const [shortDescription, setShortDescription] = useState(product?.short_description ?? "");
  const [inspiredBy, setInspiredBy] = useState(product?.inspired_by ?? "");
  const [productCode, setProductCode] = useState(product?.product_code ?? "");
  const [seoTitle, setSeoTitle] = useState(product?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seo_description ?? "");
  const selectedCategories = product?.category_ids?.split(",").filter(Boolean) ?? [];
  const selectedCollections = product?.collection_ids?.split(",").filter(Boolean) ?? [];
  const [selectedCollectionIds, setSelectedCollectionIds] = useState(selectedCollections);
  const recreationCollectionIds = useMemo(() => new Set(collections.filter((collection) => collection.slug === "recreations").map((collection) => collection.id)), [collections]);
  const isRecreationsProduct = selectedCollectionIds.some((collectionId) => recreationCollectionIds.has(collectionId));
  const notes = useMemo(() => structuredNotes(product), [product]);
  const slugPreview = slugify(name) || "product-name";
  const primaryImage = product?.images?.[0];
  const galleryImages = product?.images?.slice(1) ?? [];

  useEffect(() => {
    if (!state.error || shownError.current === state.error) return;
    shownError.current = state.error;
    showAdminToast({ id: `product-form:${state.error}`, type: "error", title: "The product wasn’t saved", description: state.error });
  }, [state.error]);

  return (
    <form action={formAction} className="mt-7 pb-28">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader description="The essential information customers use to identify and browse this product." icon={Boxes} title="Product information" />
            <div className="grid gap-5 lg:grid-cols-2">
              <label className={`${labelClass} lg:col-span-2`}>Product name<span className="ml-1 text-red-600">*</span><input autoComplete="off" className={inputClass} maxLength={190} name="name" onChange={(event) => setName(event.target.value)} placeholder="e.g. Infinity Oud Eau de Parfum" required value={name} /><FieldError name="name" state={state} /><span className="mt-1.5 block text-xs font-normal text-zinc-500">Store URL is generated automatically: /products/{slugPreview}</span></label>
              <input name="productType" type="hidden" value="STANDARD" />
              <CustomSelect defaultValue={product?.audience ?? "UNSPECIFIED"} label="Audience" name="audience" options={[{ value: "UNSPECIFIED", label: "Unspecified" }, { value: "MEN", label: "Men" }, { value: "WOMEN", label: "Women" }, { value: "UNISEX", label: "Unisex" }]} required searchable={false} />
              <label className={labelClass}>Brand<input className={inputClass} defaultValue={product?.brand ?? "N7 Cosmetics"} maxLength={150} name="brand" placeholder="N7 Cosmetics" /><FieldError name="brand" state={state} /></label>
              <CustomSelect className="lg:col-span-2" defaultValue={selectedCategories} emptyMessage="Create categories first." label="Categories" multiple name="categoryIds" options={categories.map((category) => ({ value: category.id, label: category.name, mediaUrl: category.image_url, mediaType: "image" }))} placeholder="Select one or more categories" />
              <CustomSelect className="lg:col-span-2" defaultValue={selectedCollections} emptyMessage="Create collections first." label="Collections" multiple name="collectionIds" onChange={setSelectedCollectionIds} options={collections.map((collection) => ({ value: collection.id, label: collection.name, mediaUrl: collection.image_url, mediaType: "image" }))} placeholder="Select one or more collections" />
              {isRecreationsProduct ? (
                <div className="grid gap-5 lg:col-span-2 lg:grid-cols-2">
                  <label className={labelClass}>Inspired by<span className="ml-1 text-red-600">*</span><input className={inputClass} maxLength={190} name="inspiredBy" onChange={(event) => setInspiredBy(event.target.value)} placeholder="Original fragrance or scent inspiration" required value={inspiredBy} /><FieldError name="inspiredBy" state={state} /></label>
                  <label className={labelClass}>Product code<span className="ml-1 text-red-600">*</span><input className={inputClass} maxLength={100} name="productCode" onChange={(event) => setProductCode(event.target.value)} placeholder="e.g. REC-001" required value={productCode} /><FieldError name="productCode" state={state} /></label>
                </div>
              ) : null}
              <AdminToggle defaultChecked={Boolean(product?.featured)} description="Show this item in eligible featured-product areas." label="Featured product" name="featured" />
            </div>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader description="Write clear storefront copy without mixing it with technical or SEO fields." icon={FileText} title="Product content" />
            <label className={labelClass}>Short description<textarea className={inputClass} maxLength={500} name="shortDescription" onChange={(event) => setShortDescription(event.target.value)} placeholder="A concise product summary for cards and the top of the product page." rows={3} value={shortDescription} /><span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">{shortDescription.length}/500</span><FieldError name="shortDescription" state={state} /></label>
            <label className={labelClass}>Full description<textarea className={inputClass} defaultValue={product?.description ?? ""} maxLength={30000} name="description" placeholder="Describe the scent, character, performance, use, and any relevant product details." rows={8} /><FieldError name="description" state={state} /></label>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader description="Separate the fragrance pyramid so the product page can present it clearly." icon={Sparkles} title="Fragrance profile" />
            <div className="grid gap-5 lg:grid-cols-3">
              <label className={labelClass}>Top notes<textarea className={inputClass} defaultValue={notes.top} maxLength={500} name="topNotes" placeholder="Bergamot, lemon" rows={3} /></label>
              <label className={labelClass}>Heart notes<textarea className={inputClass} defaultValue={notes.heart} maxLength={500} name="heartNotes" placeholder="Rose, jasmine" rows={3} /></label>
              <label className={labelClass}>Base notes<textarea className={inputClass} defaultValue={notes.base} maxLength={500} name="baseNotes" placeholder="Oud, amber, musk" rows={3} /></label>
            </div>
            <p className="text-xs leading-5 text-zinc-500">Separate individual notes with commas. Empty fragrance groups are simply omitted.</p>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader description="Maintain the product’s pricing, size, weight, and available stock. SKU and low-stock policy are managed automatically." icon={PackageCheck} title="Pricing and inventory" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>Selling price (£)<span className="ml-1 text-red-600">*</span><input className={inputClass} defaultValue={penceToPounds(product?.price_pence)} inputMode="decimal" name="price" placeholder="29.99" required /><FieldError name="pricePence" state={state} /></label>
              <label className={labelClass}>Compare-at price (£)<input className={inputClass} defaultValue={penceToPounds(product?.compare_at_price_pence)} inputMode="decimal" name="compareAtPrice" placeholder="39.99" /><FieldError name="compareAtPricePence" state={state} /></label>
              <label className={labelClass}>Cost per item (£)<input className={inputClass} defaultValue={penceToPounds(product?.cost_pence)} inputMode="decimal" name="cost" placeholder="Optional" /><FieldError name="costPence" state={state} /></label>
              <label className={labelClass}>Size / option label<span className="ml-1 text-red-600">*</span><input className={inputClass} defaultValue={product?.variant_title ?? "100 ml"} maxLength={150} name="sizeLabel" placeholder="100 ml" required /><FieldError name="sizeLabel" state={state} /></label>
              <label className={labelClass}>Weight (grams)<input className={inputClass} defaultValue={product?.weight_grams ?? ""} min={1} name="weightGrams" placeholder="Optional" type="number" /><FieldError name="weightGrams" state={state} /></label>
              <label className={labelClass}>Stock on hand<span className="ml-1 text-red-600">*</span><input className={inputClass} defaultValue={product?.stock_on_hand ?? 0} min={0} name="stockOnHand" required type="number" /><FieldError name="stockOnHand" state={state} /></label>
            </div>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader description="Control how this product appears in search results. The canonical product path and image alt text are generated automatically." icon={Search} title="Search engine visibility" />
            <div className="grid gap-5 lg:grid-cols-2">
              <label className={labelClass}>SEO title<input className={inputClass} maxLength={70} name="seoTitle" onChange={(event) => setSeoTitle(event.target.value)} placeholder={name || "Product title"} value={seoTitle} /><span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">{seoTitle.length}/70</span><FieldError name="seoTitle" state={state} /></label>
              <label className={labelClass}>Meta description<textarea className={inputClass} maxLength={160} name="seoDescription" onChange={(event) => setSeoDescription(event.target.value)} placeholder="Describe this product for search results." rows={3} value={seoDescription} /><span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">{seoDescription.length}/160</span><FieldError name="seoDescription" state={state} /></label>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="truncate text-sm text-blue-700">{seoTitle || name || "Product title"} · N7 Cosmetics</p>
              <p className="mt-1 truncate text-xs text-emerald-700">n7cosmetics.co.uk/products/{slugPreview}</p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-600">{seoDescription || shortDescription || "Your product meta description preview will appear here."}</p>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-23">
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeader description="The main image used on cards, listings, and product pages." icon={Images} title="Primary image" />
            <MediaDropzone accept="image" defaultAssets={primaryImage ? [{ url: primaryImage.url, name: product?.name, type: "image" }] : []} hint="One image. Alt text is generated from the product name." label="Primary product image" maxFiles={1} name="primaryMedia" />
          </section>
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeader description="Additional product images displayed in the saved order." icon={Images} title="Product gallery" />
            <MediaDropzone accept="image" defaultAssets={galleryImages.map((image, index) => ({ url: image.url, name: `${product?.name ?? "Product"} gallery ${index + 1}`, type: "image" }))} hint="Up to 12 images. Use the arrows to arrange their display order." label="Gallery images" maxFiles={12} multiple name="galleryMedia" />
          </section>
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeader description="Optional product clips for the product page and reusable merchandising areas." icon={Images} title="Product videos" />
            <MediaDropzone accept="video" defaultAssets={(product?.videos ?? []).map((video, index) => ({ url: video.url, name: video.title ?? `${product?.name ?? "Product"} video ${index + 1}`, type: "video" }))} hint="Optional. Add up to 6 MP4, MOV, or WebM videos." label="Product videos" maxFiles={6} multiple name="videoMedia" />
          </section>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:px-7 lg:left-[250px]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <StatusToggle defaultActive={product?.status === "ACTIVE"} />
          <div className="flex items-center gap-2">
            <Link className="hidden rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex" href={returnTo}>Cancel</Link>
            <button className="inline-flex min-w-32 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60 sm:min-w-36 sm:px-5" disabled={pending} type="submit">{pending ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{pending ? "Saving…" : product ? "Update product" : "Create product"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
