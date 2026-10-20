export default function MerchantSetupSection({ origin, error }: { origin: string; error: string | null }) {
  return <section aria-labelledby="merchant-setup-heading" className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
    <h2 className="text-lg font-semibold" id="merchant-setup-heading">Connect the product feed</h2>
    {error ? <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900" role="alert">{error}</p> : <p className="mt-4 break-all rounded-lg bg-zinc-50 p-4 font-mono text-sm">{origin}/google-shopping.xml</p>}
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-6 text-zinc-700">
      <li>Verify and claim the website in Google Merchant Center, and configure shipping and returns for your actual selling country.</li>
      <li>Choose “Add products from a file”, enter the feed URL above, and enable scheduled fetching. Prices use the storefront’s GBP currency.</li>
      <li>Check the fetched products and Google’s diagnostics before retiring an old product source. This feed uses stable IDs in the format <code>n7_variant_123</code>; old source IDs may differ.</li>
    </ol>
    <p className="mt-4 text-sm leading-6 text-zinc-600">Resolve product issues before connecting the feed. It reads current catalogue data each time it is requested. Google applies changes after its next fetch and processing. “Ready for feed” below is a local data check; Google controls approval and eligibility. If every included product is invalid, the feed returns a temporary error instead of an empty replacement.</p>
    <a className="mt-4 inline-flex min-h-12 items-center text-sm font-medium text-amber-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700" href="https://support.google.com/merchants/answer/12158380?hl=en" rel="noreferrer" target="_blank">Google’s file-source setup instructions</a>
  </section>;
}
