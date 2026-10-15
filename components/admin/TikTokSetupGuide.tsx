export default function TikTokSetupGuide() {
  return <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6" aria-labelledby="tiktok-setup-title">
    <h2 id="tiktok-setup-title" className="font-body text-lg font-semibold text-zinc-950">Setup and verification</h2>
    <ol className="mt-4 list-decimal space-y-3 pl-4 text-sm leading-6 text-zinc-700">
      <li>Open TikTok Ads Manager → Events Manager → your existing web pixel → Settings → Events API. Generate an access token with permission for this pixel.</li>
      <li>Save the Pixel ID and token above. Copy a Test Events code from TikTok and save it here to test without live conversions.</li>
      <li>Send a server test event and inspect it in TikTok’s Test Events tool. Test consented product views, cart additions, checkout and a Stripe test purchase. Compare the Purchase value and currency with the order.</li>
      <li>Clear the Test Events code and save before accepting live orders. Browser and server copies then use matching names and event IDs. Confirm deduplication and matching quality in TikTok Events Manager.</li>
    </ol>
    <p className="mt-4 text-sm leading-6 text-zinc-700">Purchases require a verified paid Stripe order. Pending, failed, cancelled and historical orders are excluded. Values use the paid total after discounts, including shipping and tax.</p>
    <p className="mt-4 text-sm leading-6 text-zinc-700">Keep the TikTok worker running in production. Declining or withdrawing marketing consent stops collection and cancels pending delivery.</p>
    <p className="mt-4 text-sm"><a className="inline-flex min-h-11 items-center text-amber-900 underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-amber-700" href="https://ads.tiktok.com/resources/help/article/getting-started-events-api?lang=en" target="_blank" rel="noreferrer">TikTok’s Events API setup guide</a></p>
  </section>;
}
