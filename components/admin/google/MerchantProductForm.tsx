"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { MerchantEditor, MerchantFormState } from "@/lib/google-merchant/admin";
import MerchantTextField from "./MerchantTextField";

interface MerchantProductFormProps {
  editor: MerchantEditor;
  action: (previous: MerchantFormState, form: FormData) => Promise<MerchantFormState>;
}
const selectClass = "mt-2 min-h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700";

export default function MerchantProductForm({ editor, action }: MerchantProductFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const data = editor.metadata;
  return <section aria-labelledby="merchant-product-heading" className="mt-6 max-w-3xl rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
    <h2 className="text-lg font-semibold" id="merchant-product-heading">Google product details</h2>
    <p className="mt-2 text-sm leading-6 text-zinc-600">Use the actual manufacturer details printed on the product or supplied by the brand. These settings do not change the storefront price or stock.</p>
    <form action={formAction} className="mt-6 space-y-6" aria-busy={pending}>
      <input name="revision" type="hidden" value={editor.revision} />
      {state.error ? <p className="rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">{state.error}</p> : null}
      <label className="flex min-h-12 items-center gap-3 text-sm font-medium"><input className="size-4" defaultChecked={data.included} name="included" type="checkbox" />Include this product in the Google catalogue when ready</label>
      <div className="grid gap-6 sm:grid-cols-2">
        <MerchantTextField defaultValue={data.gtin} error={state.fieldErrors?.gtin?.[0]} hint="EAN, UPC or other manufacturer GTIN. Keep leading zeros. Your internal SKU is not a barcode." label="GTIN / barcode" maxLength={14} name="gtin" />
        <MerchantTextField defaultValue={data.mpn} error={state.fieldErrors?.mpn?.[0]} hint="Used when entering an MPN manually. Supply the GTIN too when one exists." label="Manufacturer part number (MPN)" maxLength={70} name="mpn" />
      </div>
      {editor.isRecreation ? <div>
        <label className="block text-sm font-medium" htmlFor="merchant-mpn-source">MPN source</label>
        <select className={selectClass} defaultValue={data.mpnSource} id="merchant-mpn-source" name="mpnSource"><option value="PRODUCT_CODE">Use the official N7 recreation product code</option><option value="MANUAL">Use the manually entered manufacturer MPN</option></select>
        <p className="mt-2 text-xs leading-5 text-zinc-600">Current official code: {editor.productCode || "Missing"}. The catalogue follows changes to this product code automatically.</p>
      </div> : <input name="mpnSource" type="hidden" value="MANUAL" />}
      <div>
        <label className="block text-sm font-medium" htmlFor="merchant-policy">Product identifiers</label>
        <select aria-describedby="merchant-policy-hint" aria-invalid={Boolean(state.fieldErrors?.identifierPolicy)} className={selectClass} defaultValue={data.identifierPolicy} id="merchant-policy" name="identifierPolicy">
          <option value="AUTO">Use the manufacturer identifiers above</option><option value="NONE">Confirmed: neither a GTIN nor an MPN was assigned</option>
        </select>
        <p className="mt-2 text-xs leading-5 text-zinc-600" id="merchant-policy-hint">Only confirm none assigned after checking with the manufacturer. Leave GTIN and MPN blank for that option.</p>
        {state.fieldErrors?.identifierPolicy ? <p className="mt-2 text-sm text-red-700" role="alert">{state.fieldErrors.identifierPolicy[0]}</p> : null}
      </div>
      <MerchantTextField defaultValue={data.googleCategoryId} error={state.fieldErrors?.googleCategoryId?.[0]} hint="Optional numeric ID from Google's product taxonomy. Leave blank to let Google classify the product." label="Google product category ID" maxLength={10} name="googleCategoryId" />
      {editor.productType === "BUNDLE" ? <fieldset className="space-y-4 rounded-lg border border-zinc-200 p-4">
        <legend className="px-2 text-sm font-semibold">Bundle classification</legend>
        <label className="block text-sm font-medium" htmlFor="merchant-bundle-kind">How is this product packaged?</label>
        <select aria-invalid={Boolean(state.fieldErrors?.bundleKind)} className={selectClass} defaultValue={data.bundleKind} id="merchant-bundle-kind" name="bundleKind">
          <option value="UNREVIEWED">Needs review</option><option value="SET">Gift set with no main product</option><option value="MAIN_PRODUCT">Main product with complementary products</option><option value="MULTIPACK">Multipack of one identical product</option><option value="MANUFACTURER">Manufacturer-packaged set</option>
        </select>
        <label className="block text-sm font-medium" htmlFor="merchant-main">Main product (for a main-product bundle)</label>
        <select aria-invalid={Boolean(state.fieldErrors?.mainVariantId)} className={selectClass} defaultValue={data.mainVariantId} id="merchant-main" name="mainVariantId">
          <option value="">Choose the main product if applicable</option>
          {editor.components.filter(component => component.productType === "STANDARD").map(component => <option key={component.variantId} value={component.variantId}>{component.name} · {component.variantTitle} × {component.quantity}{component.active ? "" : " (inactive; bundle out of stock)"}</option>)}
        </select>
        <p className="text-xs leading-5 text-zinc-600">A main-product bundle uses the main product’s brand and identifiers. A multipack uses its identical component’s identifiers. Complete those details on the component’s Google page. Gift sets and manufacturer packs use the identifiers above.</p>
        {state.fieldErrors?.mainVariantId ? <p className="text-sm text-red-700" role="alert">{state.fieldErrors.mainVariantId[0]}</p> : null}
      </fieldset> : <><input name="bundleKind" type="hidden" value="UNREVIEWED" /><input name="mainVariantId" type="hidden" value="" /></>}
      <div className="flex flex-wrap gap-3">
        <button className="min-h-12 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">{pending ? "Saving…" : "Save Google details"}</button>
        <Link className="inline-flex min-h-12 items-center rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" href="/admin/google">Back to catalogue</Link>
      </div>
    </form>
  </section>;
}
