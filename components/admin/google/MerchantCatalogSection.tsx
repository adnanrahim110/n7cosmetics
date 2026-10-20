import Link from "next/link";
import type { MerchantEntry } from "@/lib/google-merchant/product";

interface MerchantCatalogSectionProps { entries: MerchantEntry[]; query: string; filter: string; page: number; configurationError: boolean }
export default function MerchantCatalogSection({ entries, query, filter, page, configurationError }: MerchantCatalogSectionProps) {
  const matching = entries.filter(entry => (!query || `${entry.product.name} ${entry.product.productCode ?? ""} ${entry.product.sku}`.toLowerCase().includes(query.toLowerCase())) &&
    (filter === "issues" ? entry.issues.length : filter === "excluded" ? entry.excluded : filter === "ready" ? Boolean(entry.item) && !configurationError : true));
  const pages = Math.max(1, Math.ceil(matching.length / 30));
  const current = Math.min(page, pages);
  const href = (page: number) => `/admin/google?${new URLSearchParams({ q: query, filter, page: String(page) })}`;
  return <section aria-labelledby="merchant-catalogue-heading" className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
    <h2 className="text-lg font-semibold" id="merchant-catalogue-heading">Published products</h2>
    <form className="mt-4 flex flex-wrap items-end gap-4" method="get">
      <div className="min-w-0 flex-1"><label className="block text-sm font-medium" htmlFor="merchant-search">Search products</label><input className="mt-2 min-h-12 w-full rounded-lg border border-zinc-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-amber-700" defaultValue={query} id="merchant-search" maxLength={190} name="q" type="search" /></div>
      <div><label className="block text-sm font-medium" htmlFor="merchant-filter">Status</label><select className="mt-2 min-h-12 rounded-lg border border-zinc-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-amber-700" defaultValue={filter} id="merchant-filter" name="filter"><option value="all">All products</option><option value="issues">Needs attention</option><option value="ready">Ready for feed</option><option value="excluded">Excluded by you</option></select></div>
      <button className="min-h-12 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" type="submit">Filter</button>
    </form>
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm"><caption className="sr-only">Google product feed readiness and data issues</caption><thead className="border-b border-zinc-200 text-zinc-600"><tr><th className="p-3" scope="col">Product</th><th className="p-3" scope="col">Price / availability</th><th className="p-3" scope="col">Status and details</th><th className="p-3" scope="col">Action</th></tr></thead>
        <tbody>{matching.slice((current - 1) * 30, current * 30).map(entry => <tr className="border-b border-zinc-100 align-top" key={entry.product.variantId}>
          <td className="min-w-48 p-3"><p className="font-medium">{entry.product.productCode ? `${entry.product.productCode} — ` : ""}{entry.product.name}</p><p className="mt-2 break-all text-xs text-zinc-600">n7_variant_{entry.product.variantId}</p></td>
          <td className="p-3"><p>{new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(entry.product.pricePence / 100)}</p><p className="mt-2 text-xs text-zinc-600">{entry.product.soldOut ? "Out of stock" : "In stock"}</p></td>
          <td className="min-w-64 p-3"><p className="font-medium">{entry.excluded ? "Excluded by you" : entry.issues.length ? "Needs attention" : configurationError ? "Website URL needs attention" : "Ready for feed"}</p>{[...entry.issues, ...entry.warnings].map(message => <p className="mt-2 text-xs leading-5 text-zinc-700" key={message}>{message}</p>)}</td>
          <td className="p-3"><Link aria-label={`Edit Google details for ${entry.product.name}`} className="inline-flex min-h-12 items-center rounded-lg px-3 font-medium text-amber-900 underline underline-offset-4 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-amber-700" href={`/admin/google/${entry.product.variantId}`}>Edit details</Link></td>
        </tr>)}</tbody>
      </table>
      {!matching.length ? <p className="py-8 text-sm text-zinc-600">{entries.length ? "No products match these filters." : "No published products are available. Publish a product with an active default variant to get started."}</p> : null}
    </div>
    <nav aria-label="Google catalogue pages" className="mt-4 flex flex-wrap items-center gap-4 text-sm"><p>{matching.length} products · Page {current} of {pages}</p>{current > 1 ? <Link className="inline-flex min-h-12 items-center px-3 underline focus-visible:outline-2 focus-visible:outline-amber-700" href={href(current - 1)}>Previous</Link> : null}{current < pages ? <Link className="inline-flex min-h-12 items-center px-3 underline focus-visible:outline-2 focus-visible:outline-amber-700" href={href(current + 1)}>Next</Link> : null}</nav>
  </section>;
}
