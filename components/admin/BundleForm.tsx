"use client";

import { showAdminToast } from "@/components/admin/AdminToastProvider";
import AdminToggle from "@/components/admin/AdminToggle";
import CustomSelect from "@/components/admin/CustomSelect";
import MediaDropzone from "@/components/admin/MediaDropzone";
import type {
  BundleFormRecord,
  BundleProductOption,
} from "@/lib/admin/bundles";
import { penceToPounds, slugify } from "@/lib/admin/form";
import {
  Boxes,
  FileText,
  Images,
  Layers3,
  LoaderCircle,
  PackageCheck,
  Save,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

export interface BundleActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

interface BundleFormProps {
  bundle?: BundleFormRecord | null;
  products: BundleProductOption[];
  action: (
    previousState: BundleActionState,
    formData: FormData,
  ) => Promise<BundleActionState>;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const labelClass = "block text-sm font-medium text-zinc-700";

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Boxes;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-zinc-100 pb-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-800">
        <Icon size={17} />
      </span>
      <div>
        <h2 className="font-body text-base font-semibold text-zinc-950">
          {title}
        </h2>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function FieldError({
  state,
  name,
}: {
  state: BundleActionState;
  name: string;
}) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? (
    <span className="mt-1.5 block text-xs font-medium text-red-600">
      {message}
    </span>
  ) : null;
}

function StatusToggle({ defaultActive }: { defaultActive: boolean }) {
  const [active, setActive] = useState(defaultActive);
  return (
    <div className="flex items-center gap-3">
      <input name="status" type="hidden" value={active ? "ACTIVE" : "DRAFT"} />
      <button
        aria-checked={active}
        aria-label="Toggle bundle status"
        className={`relative h-7 w-12 rounded-full border p-0.5 shadow-inner transition ${active ? "border-emerald-700 bg-emerald-700" : "border-zinc-300 bg-zinc-200"}`}
        onClick={() => setActive((current) => !current)}
        role="switch"
        type="button"
      >
        <span
          className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${active ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
      <span className="sm:min-w-20">
        <span className="block text-xs font-semibold text-zinc-900">
          {active ? "Active" : "Draft"}
        </span>
        <span className="hidden text-[10px] text-zinc-500 sm:block">
          {active ? "Visible in store" : "Not published"}
        </span>
      </span>
    </div>
  );
}

function money(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

export default function BundleForm({
  bundle,
  products,
  action,
}: BundleFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const shownError = useRef("");
  const [name, setName] = useState(bundle?.name ?? "");
  const [shortDescription, setShortDescription] = useState(
    bundle?.short_description ?? "",
  );
  const [seoTitle, setSeoTitle] = useState(bundle?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    bundle?.seo_description ?? "",
  );
  const selectedProducts =
    bundle?.component_variant_ids?.split(",").filter(Boolean) ?? [];
  const slugPreview = slugify(name) || "bundle-title";
  const primaryImage = bundle?.images?.[0];
  const galleryImages = bundle?.images?.slice(1) ?? [];

  useEffect(() => {
    if (!state.error || shownError.current === state.error) return;
    shownError.current = state.error;
    showAdminToast({
      id: `bundle-form:${state.error}`,
      type: "error",
      title: "The bundle wasn’t saved",
      description: state.error,
    });
  }, [state.error]);

  return (
    <form action={formAction} className="mt-7 pb-28">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              description="The essential information customers use to identify and browse this bundle."
              icon={Boxes}
              title="Bundle information"
            />
            <label className={labelClass}>
              Bundle title<span className="ml-1 text-red-600">*</span>
              <input
                autoComplete="off"
                className={inputClass}
                maxLength={190}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. The Evening Fragrance Trio"
                required
                value={name}
              />
              <FieldError name="name" state={state} />
              <span className="mt-1.5 block text-xs font-normal text-zinc-500">
                Store URL is generated automatically: /bundles/{slugPreview}
              </span>
            </label>
            <AdminToggle
              defaultChecked={Boolean(bundle?.featured)}
              description="Show this bundle in eligible featured-product areas."
              label="Featured bundle"
              name="featured"
            />
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              description="Choose the existing products included when a customer purchases this bundle."
              icon={Layers3}
              title="Included products"
            />
            <CustomSelect
              defaultValue={selectedProducts}
              emptyMessage="Create standard products before building a bundle."
              label="Bundle products"
              maximumSelected={20}
              multiple
              name="componentVariantIds"
              options={products.map((product) => ({
                value: product.variant_id,
                label: product.name,
                description: `${product.variant_title} · ${money(product.price_pence)}${product.status === "DRAFT" ? " · Draft" : ""}`,
                mediaUrl: product.image_url,
                mediaType: "image",
              }))}
              placeholder="Select the products in this bundle"
              required
            />
            <FieldError name="componentVariantIds" state={state} />
            <p className="text-xs leading-5 text-zinc-500">
              Products are shown on the bundle detail page in the order selected
              here.
            </p>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              description="Write clear storefront copy for the bundle listing and detail page."
              icon={FileText}
              title="Bundle content"
            />
            <label className={labelClass}>
              Short description
              <textarea
                className={inputClass}
                maxLength={500}
                name="shortDescription"
                onChange={(event) => setShortDescription(event.target.value)}
                placeholder="A concise summary for cards and the top of the bundle page."
                rows={3}
                value={shortDescription}
              />
              <span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">
                {shortDescription.length}/500
              </span>
              <FieldError name="shortDescription" state={state} />
            </label>
            <label className={labelClass}>
              Full description
              <textarea
                className={inputClass}
                defaultValue={bundle?.description ?? ""}
                maxLength={30000}
                name="description"
                placeholder="Describe the bundle, its value, and the products included."
                rows={8}
              />
              <FieldError name="description" state={state} />
            </label>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              description="Maintain the bundle price, presentation, weight, and available stock."
              icon={PackageCheck}
              title="Pricing and inventory"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>
                Selling price (£)<span className="ml-1 text-red-600">*</span>
                <input
                  className={inputClass}
                  defaultValue={penceToPounds(bundle?.price_pence)}
                  inputMode="decimal"
                  name="price"
                  placeholder="85.99"
                  required
                />
                <FieldError name="pricePence" state={state} />
              </label>
              <label className={labelClass}>
                Compare-at price (£)
                <input
                  className={inputClass}
                  defaultValue={penceToPounds(bundle?.compare_at_price_pence)}
                  inputMode="decimal"
                  name="compareAtPrice"
                  placeholder="Optional"
                />
                <FieldError name="compareAtPricePence" state={state} />
              </label>
              <label className={labelClass}>
                Cost per bundle (£)
                <input
                  className={inputClass}
                  defaultValue={penceToPounds(bundle?.cost_pence)}
                  inputMode="decimal"
                  name="cost"
                  placeholder="Optional"
                />
                <FieldError name="costPence" state={state} />
              </label>
              <label className={labelClass}>
                Size / option label<span className="ml-1 text-red-600">*</span>
                <input
                  className={inputClass}
                  defaultValue={bundle?.variant_title ?? "Bundle"}
                  maxLength={150}
                  name="sizeLabel"
                  placeholder="3 × 100 ml"
                  required
                />
                <FieldError name="sizeLabel" state={state} />
              </label>
              <label className={labelClass}>
                Weight (grams)
                <input
                  className={inputClass}
                  defaultValue={bundle?.weight_grams ?? ""}
                  min={1}
                  name="weightGrams"
                  placeholder="Optional"
                  type="number"
                />
                <FieldError name="weightGrams" state={state} />
              </label>
              <label className={labelClass}>
                Stock on hand<span className="ml-1 text-red-600">*</span>
                <input
                  className={inputClass}
                  defaultValue={bundle?.stock_on_hand ?? 0}
                  min={0}
                  name="stockOnHand"
                  required
                  type="number"
                />
                <FieldError name="stockOnHand" state={state} />
              </label>
            </div>
          </section>

          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <SectionHeader
              description="Control how this bundle appears in search results. Its canonical URL is generated from the title."
              icon={Search}
              title="Search engine visibility"
            />
            <div className="grid gap-5 lg:grid-cols-2">
              <label className={labelClass}>
                SEO title
                <input
                  className={inputClass}
                  maxLength={70}
                  name="seoTitle"
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder={name || "Bundle title"}
                  value={seoTitle}
                />
                <span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">
                  {seoTitle.length}/70
                </span>
                <FieldError name="seoTitle" state={state} />
              </label>
              <label className={labelClass}>
                Meta description
                <textarea
                  className={inputClass}
                  maxLength={160}
                  name="seoDescription"
                  onChange={(event) => setSeoDescription(event.target.value)}
                  placeholder="Describe this bundle for search results."
                  rows={3}
                  value={seoDescription}
                />
                <span className="mt-1 block text-right text-[11px] font-normal text-zinc-400">
                  {seoDescription.length}/160
                </span>
                <FieldError name="seoDescription" state={state} />
              </label>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="truncate text-sm text-blue-700">
                {seoTitle || name || "Bundle title"} · N7 Cosmetics
              </p>
              <p className="mt-1 truncate text-xs text-emerald-700">
                n7cosmetics.co.uk/bundles/{slugPreview}
              </p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-zinc-600">
                {seoDescription ||
                  shortDescription ||
                  "Your bundle meta description preview will appear here."}
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-23">
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeader
              description="The main image used on cards, listings, and the bundle page."
              icon={Images}
              title="Primary image"
            />
            <MediaDropzone
              accept="image"
              defaultAssets={
                primaryImage
                  ? [
                      {
                        url: primaryImage.url,
                        name: bundle?.name,
                        type: "image",
                      },
                    ]
                  : []
              }
              hint="One image. Alt text is generated from the bundle title."
              label="Primary bundle image"
              maxFiles={1}
              name="primaryMedia"
            />
          </section>
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeader
              description="Additional bundle images displayed in the saved order."
              icon={Images}
              title="Bundle gallery"
            />
            <MediaDropzone
              accept="image"
              defaultAssets={galleryImages.map((image, index) => ({
                url: image.url,
                name: `${bundle?.name ?? "Bundle"} gallery ${index + 1}`,
                type: "image",
              }))}
              hint="Up to 12 images. Use the arrows to arrange their display order."
              label="Gallery images"
              maxFiles={12}
              multiple
              name="galleryMedia"
            />
          </section>
          <section className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <SectionHeader
              description="Optional clips for the bundle detail page."
              icon={Images}
              title="Bundle videos"
            />
            <MediaDropzone
              accept="video"
              defaultAssets={(bundle?.videos ?? []).map((video, index) => ({
                url: video.url,
                name:
                  video.title ??
                  `${bundle?.name ?? "Bundle"} video ${index + 1}`,
                type: "video",
              }))}
              hint="Optional. Add up to 6 MP4, MOV, or WebM videos."
              label="Bundle videos"
              maxFiles={6}
              multiple
              name="videoMedia"
            />
          </section>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:px-7 lg:left-62.5">
        <div className="mx-auto flex max-w-375 items-center justify-between gap-4">
          <StatusToggle defaultActive={bundle?.status === "ACTIVE"} />
          <div className="flex items-center gap-2">
            <Link
              className="hidden rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:inline-flex"
              href="/admin/bundles"
            >
              Cancel
            </Link>
            <button
              className="inline-flex min-w-32 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-60 sm:min-w-36 sm:px-5"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {pending ? "Saving…" : bundle ? "Update bundle" : "Create bundle"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
