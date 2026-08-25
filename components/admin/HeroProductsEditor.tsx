"use client";

import Image from "next/image";
import { ImageIcon, Layers3 } from "lucide-react";
import { useMemo, useState } from "react";
import type { HeroProductPresentation } from "@/lib/homepage/types";
import CustomSelect from "./CustomSelect";
import MediaDropzone from "./MediaDropzone";

export interface HeroEditorProduct {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string;
  description: string;
  tagline: string;
}

interface HeroProductsEditorProps {
  products: HeroEditorProduct[];
  defaultProductIds: string[];
  defaultPresentations: HeroProductPresentation[];
}

const input = "mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm leading-5 outline-none transition placeholder:text-zinc-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const label = "block text-[13px] font-medium leading-5 text-zinc-700";

export default function HeroProductsEditor({ products, defaultProductIds, defaultPresentations }: HeroProductsEditorProps) {
  const [selectedIds, setSelectedIds] = useState(defaultProductIds);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const presentationById = useMemo(() => new Map(defaultPresentations.map((item) => [item.productId, item])), [defaultPresentations]);
  const options = products.map((product) => ({ value: product.id, label: product.name, description: product.sku ?? undefined, mediaUrl: product.imageUrl, mediaType: "image" as const }));

  return (
    <div className="space-y-4 sm:col-span-2">
      <CustomSelect defaultValue={defaultProductIds} label="Featured products" multiple name="productIds" onChange={setSelectedIds} options={options} placeholder="Select hero products" required />
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs leading-5 text-amber-950">
        Each slide can use dedicated promotional content. Leave any field empty to use that product’s catalog value automatically.
      </div>
      {selectedIds.length ? (
        <div className="space-y-3">
          {selectedIds.map((productId, index) => {
            const product = byId.get(productId);
            if (!product) return null;
            const presentation = presentationById.get(productId);
            return (
              <fieldset className="rounded-xl border border-zinc-200 bg-zinc-50/55 p-4" key={productId}>
                <legend className="sr-only">Hero slide {index + 1}: {product.name}</legend>
                <div className="mb-4 flex items-center gap-3 border-b border-zinc-200 pb-3">
                  <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200">
                    {product.imageUrl ? <Image alt="" className="object-cover" fill sizes="48px" src={product.imageUrl} unoptimized /> : <ImageIcon className="text-zinc-400" size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700"><Layers3 size={11} />Hero slide {index + 1}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-zinc-950">{product.name}</span>
                    <span className="block truncate text-[11px] text-zinc-400">{product.sku ?? "Automatic product fallback"}</span>
                  </span>
                </div>
                <input name={`hero${index}ProductId`} type="hidden" value={productId} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={label}>Hero title <span className="font-normal text-zinc-400">(optional)</span><input className={input} defaultValue={presentation?.title ?? ""} maxLength={190} name={`hero${index}Title`} placeholder={product.name} /></label>
                  <label className={label}>Hero tagline <span className="font-normal text-zinc-400">(optional)</span><input className={input} defaultValue={presentation?.tagline ?? ""} maxLength={300} name={`hero${index}Tagline`} placeholder={product.tagline} /></label>
                  <label className={`${label} sm:col-span-2`}>Hero description <span className="font-normal text-zinc-400">(optional)</span><textarea className={input} defaultValue={presentation?.description ?? ""} maxLength={1200} name={`hero${index}Description`} placeholder={product.description} rows={3} /></label>
                  <MediaDropzone accept="image" className="sm:col-span-2" defaultAssets={presentation?.image ? [{ url: presentation.image, name: `${product.name} custom hero image`, type: "image" }] : []} hint="Optional. When empty, the product’s primary catalog image is used." label="Custom hero product image" name={`hero${index}Image`} />
                </div>
              </fieldset>
            );
          })}
        </div>
      ) : <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-400">Choose at least one product to configure its hero presentation.</p>}
    </div>
  );
}
