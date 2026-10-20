import type { MerchantEntry } from "@/lib/google-merchant/product";

export default function MerchantSummarySection({ entries, configurationError }: { entries: MerchantEntry[]; configurationError: string | null }) {
  const ready = entries.filter(entry => entry.item).length;
  return <section aria-labelledby="merchant-summary-heading" className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
    <h2 className="text-lg font-semibold" id="merchant-summary-heading">Catalogue readiness</h2>
    <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Published products", entries.length], ["Ready for feed", configurationError ? 0 : ready], ["Needs attention", entries.filter(entry => entry.issues.length).length], ["Excluded by you", entries.filter(entry => entry.excluded).length]].map(([label, count]) => <div className="rounded-lg bg-zinc-50 p-4" key={label}><dt className="text-sm text-zinc-600">{label}</dt><dd className="mt-2 text-2xl font-semibold">{count}</dd></div>)}
    </dl>
    <p className="mt-4 text-sm leading-6 text-zinc-600">Published sold-out items remain in the feed as out of stock. Draft, archived and disabled products are omitted. Only variants purchasable on the current storefront are exported.</p>
  </section>;
}
