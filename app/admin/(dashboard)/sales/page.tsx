import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";
import CustomSelect, { type CustomSelectOption } from "@/components/admin/CustomSelect";
import Notice from "@/components/admin/Notice";
import PageHeader from "@/components/admin/PageHeader";
import { getSaleProductOptions, listSales, type SaleListRow } from "@/lib/admin/sales";
import { createSaleAction, updateSaleAction } from "./actions";

const input = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100";
const label = "block text-[13px] font-medium leading-5 text-zinc-700";

function SaleFields({ item, products }: { item?: SaleListRow; products: CustomSelectOption[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className={`${label} sm:col-span-2`}>
        Sale name
        <input className={`${input} mt-1`} defaultValue={item?.name} maxLength={190} name="name" placeholder="Buy 5, Get 1 Free" required />
      </label>
      <CustomSelect
        defaultValue={item?.offer_type ?? "BUY_X_GET_Y_FREE"}
        label="Offer condition"
        name="offerType"
        options={[{ value: "BUY_X_GET_Y_FREE", label: "Buy X, get Y free" }]}
        required
        searchable={false}
      />
      <CustomSelect
        defaultValue={item?.status ?? "DRAFT"}
        label="Availability"
        name="status"
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "ACTIVE", label: "Active" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        required
        searchable={false}
      />
      <label className={label}>
        Qualifying quantity
        <input className={`${input} mt-1`} defaultValue={item?.buy_quantity ?? 5} max={99} min={2} name="buyQuantity" required type="number" />
      </label>
      <label className={label}>
        Free quantity
        <input className={`${input} mt-1`} defaultValue={item?.free_quantity ?? 1} max={98} min={1} name="freeQuantity" required type="number" />
      </label>
      <label className={label}>
        Display order
        <input className={`${input} mt-1`} defaultValue={item?.sort_order ?? 0} name="sortOrder" required type="number" />
      </label>
      <div className="sm:col-span-2 lg:col-span-4">
        <CustomSelect
          defaultValue={item?.product_ids?.split(",") ?? []}
          emptyMessage="No standard products are available."
          label="Products in this sale"
          multiple
          name="productIds"
          options={products}
          placeholder="Select qualifying products"
          required
        />
      </div>
    </div>
  );
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [sales, productRows, query] = await Promise.all([
    listSales(),
    getSaleProductOptions(),
    searchParams,
  ]);
  const products: CustomSelectOption[] = productRows.map((product) => ({
    value: product.id,
    label: product.name,
    description: product.sku ?? undefined,
    mediaUrl: product.image_url,
    mediaType: "image",
  }));

  return (
    <div className="max-w-6xl">
      <PageHeader
        description="Create product-specific offers and control which sales are available on the storefront."
        eyebrow="Promotions"
        title="Sales"
      />
      {query.saved ? <Notice type="success">Sale {query.saved === "created" ? "created" : "updated"}.</Notice> : null}
      {query.error ? <Notice>{query.error === "save" ? "The sale could not be saved. No changes were made." : "Check the sale name, quantities, availability, and selected products."}</Notice> : null}

      <details className="mt-7 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" open={!sales.length}>
        <summary className="cursor-pointer list-none px-5 py-4 font-medium text-zinc-950">Add sale</summary>
        <form action={createSaleAction} className="border-t border-zinc-100 p-5">
          <SaleFields products={products} />
          <button className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="submit"><Plus size={15} />Create sale</button>
        </form>
      </details>

      <section className="mt-5 space-y-3">
        {sales.map((sale) => (
          <details className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm" key={sale.id}>
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-950">{sale.name}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{sale.buy_quantity} qualifying · {sale.free_quantity} free · {Number(sale.product_count)} products</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${sale.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : sale.status === "ARCHIVED" ? "bg-zinc-100 text-zinc-500" : "bg-amber-50 text-amber-700"}`}>{sale.status.toLowerCase()}</span>
            </summary>
            <form action={updateSaleAction.bind(null, sale.id)} className="border-t border-zinc-100 p-5">
              <SaleFields item={sale} products={products} />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
                <Link className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-950" href={`/admin/pages/sale-${sale.id}`}>Edit storefront block <ArrowUpRight size={14} /></Link>
                <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="submit">Save sale</button>
              </div>
            </form>
          </details>
        ))}
      </section>
    </div>
  );
}
