# TikTok Pixel and Events API

## Setup

1. Run `pnpm db:migrate`, including `035_tiktok_events.sql`.
2. Open `/admin/tiktok`. Owners can edit settings and run connection checks; managers can view settings and delivery status. Fulfilment accounts cannot access the integration.
3. Keep the existing pixel `DB7Q61BC77UCS546PMGG`, or use the matching Pixel ID from TikTok Events Manager. Save its Events API access token. Tokens are encrypted with the application's AES-256-GCM key; neither ciphertext nor tokens are passed to client components. Blank token input preserves the saved token; removal explicitly deletes it.
4. Add a Test Events code and run the server connection check. Success requires an HTTP success response AND TikTok JSON `code: 0`. Request IDs are shown without provider messages that might echo private data.
5. Inspect events in TikTok Events Manager. Clear the Test Events code and save before live reporting. Browser events are paused while server test mode is enabled so Stripe test transactions cannot enter live browser reporting.
6. Keep `pnpm tiktok:worker:deploy` running after `pnpm build:deploy`. Production Compose includes `tiktok-worker`. Development starts the same worker through Node instrumentation; `pnpm tiktok:worker` can also run separately.

## Events and values

- `Pageview`: one storefront route view after consent, using TikTok's official event spelling.
- `ViewContent`: active product and bundle detail views.
- `Search`: a completed search response; search text is excluded.
- `AddToCart`: successfully validated additions or quantity increases.
- `InitiateCheckout`: entering checkout with a basket or starting express checkout.
- `AddPaymentInfo`: successfully creating/reusing the Stripe checkout; no card details.
- `Purchase`: an independently verified paid Stripe order, including payments completed without returning to the website. Pending, failed, cancelled and historical orders do not create purchases. Stripe test orders require a Test Events code and never produce browser purchases.

TikTok's current guidance uses Purchase instead of the legacy CompletePayment name. Browser and server copies share event names and IDs. Purchase IDs are `n7_tiktok_purchase_<order ID>`; request retries retain their original ID and timestamp. Product identifiers are `n7_variant_<variant ID>`, including bundle variants and string IDs above JavaScript's safe-integer limit. Commerce amounts are resolved server-side; clients cannot submit Purchase events or prices. Paid totals are GBP after discounts, including shipping and tax. Line prices use stored discounted item totals.

## Consent, matching and isolation

TikTok runs independently of Meta enablement and credentials, using the same marketing permission. No SDK, attribution cookie, collection request or server event is enabled before explicit consent. An actual landing ttclid is held only in tab memory until consent, then retained in a first-party cookie for up to 90 days. TikTok's SDK owns _ttp; the application does not invent it.

Matching uses lowercased, trimmed email and E.164 phone numbers (including the leading +), SHA-256 hashed on the server, plus a provider-specific hashed visitor identifier. Browser identify calls use the official `sha256_email`, `sha256_phone_number` and `external_id` fields to avoid double hashing. Server fields use `email`, `phone` and `external_id`; IP, user agent, ttclid and ttp remain unhashed. Trusted client-IP handling is shared with Meta. Only supported matching fields are sent; no street address, search text, receipt credential or Stripe secret is forwarded.

Pre-order matching is independently consent-checked, bounded and rate-limited. Raw contact details are never stored by tracking; encrypted hashes can be reused for the same consenting visitor until permission expires or is withdrawn. Purchase attribution snapshots contain encrypted, hashed contacts and original request attribution, captured at checkout. Attribution errors use a database savepoint and cannot undo a valid payment order.

Both Pixel providers share an isolated-document transport with separate provider channels, authenticated message source/origin, fixed public URLs and exact matching snapshots. TikTok uses the official deferred bootstrap, manual identify and explicit `ttq.track(name, properties, { event_id, pixel_code })` calls. No implicit page call duplicates the explicit Pageview event. Frames expire after inactivity; withdrawal removes them and cancels pending callbacks immediately. Browser SDK acknowledgment confirms a local SDK call, not TikTok receipt or attribution.

Consent is rechecked at capture, purchase generation and delivery. Withdrawal clears TikTok matching, deletes checkout attribution contexts, cancels pending/failed events, and removes first-party cookies and browser purchase markers. Local opt-out and cross-tab changes take precedence over stale configuration. Renewing expired or withdrawn consent never revives a matching profile. Already transmitted or in-flight events cannot be recalled.

## Delivery and diagnostics

The durable queue uses unique event keys, worker leases and bounded exponential retry for network, rate-limit and server errors. It discovers committed payments independently of browser callbacks/webhooks. Changes to pixel/test destination never reroute old events. Disabling delivery or deleting credentials cancels outstanding jobs. Replacing credentials permits an owner to retry eligible failed events without manufacturing new IDs.

Retries stop at 47 hours, inside TikTok's 48-hour deduplication window. Accepted and cancelled payloads are erased immediately. Failed encrypted payloads remain recoverable only within that 47-hour window, then are erased. Checkout snapshots expire after two days; safe delivery metadata expires after 30 days. Worker heartbeat and recent event status refresh in the admin page. Order pages show capture reasons and recent purchase delivery.

Do not install a second Pixel, duplicate GTM tags, or overlapping Event Builder rules for these events. Verify browser/server deduplication, event matching and attribution in TikTok Events Manager after entering real credentials.

## Non-browser verification

`pnpm test:unit`, `pnpm lint`, `pnpm typecheck`, `pnpm build:deploy`, `pnpm tiktok:verify-flow`, and `pnpm meta:verify-pixel-frame` (the shared production Meta/TikTok route check).

Unit tests execute the bundled document in Node VM fixtures and exercise privacy, hashing, SDK calls, transport cancellation and API response handling without a browser or external SDK. Integration checks create a disposable local database, apply all migrations and verify independent configuration, matching, paid-order deduplication, retries, test-mode isolation, withdrawal and fail-open checkout with mocked TikTok/Stripe responses. They make no real ad-platform requests or charges.

## Primary references

- [Getting started](https://ads.tiktok.com/resources/help/article/getting-started-events-api?lang=en)
- [Current standard events](https://ads.tiktok.com/resources/help/article/standard-events-parameters?lang=en)
- [Updated event names](https://ads.tiktok.com/resources/help/article/how-to-adopt-tiktoks-updated-standard-events?lang=en)
- [Deduplication](https://ads.tiktok.com/resources/help/article/event-deduplication?lang=en)
- [Official browser template and hashed identify fields](https://github.com/tiktok/gtm-template-pixel)
- [Official server template, Pageview mapping and payload](https://github.com/tiktok/gtm-template-eapi)
