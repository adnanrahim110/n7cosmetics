export default function GoogleMerchantLoading() {
  return <div aria-busy="true" aria-label="Loading Google catalogue" className="space-y-6">
    <p className="text-sm font-medium text-zinc-700" role="status">Loading the Google catalogue…</p>
    <div aria-hidden="true" className="h-12 w-64 max-w-full rounded-lg bg-zinc-200" />
    <div aria-hidden="true" className="h-48 rounded-xl bg-zinc-200" />
    <div aria-hidden="true" className="h-64 rounded-xl bg-zinc-200" />
  </div>;
}
