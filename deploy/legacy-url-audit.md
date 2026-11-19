# Legacy URLs and Meta matching

Audit date: 19 November 2026. Production release inspected: `19ffb1b7154a24e4a6a3cb7b00ff9a740c5d0c95`.

## WordPress migration

The archived WordPress configuration uses `/product/` and `/product-category/`. Public HTTP checks confirmed `/product/pour-homme` returns 404 and `/products/pour-homme` returns 200. The trailing-slash URL first redirects to the broken old path.

`lib/legacy/redirects.ts` now supplies permanent server redirects through Next.js configuration:

- Unchanged product slugs move from `/product/:slug` to `/products/:slug`.
- Eleven renamed product slugs use explicit mappings verified against imported WordPress product IDs and current active products. These also cover stale `/products/` links.
- Six imported bundles go directly to `/bundles/:slug`, including stale `/products/` links.
- Equivalent originals, recreations, premium and bundle archives, plus originals' active Deja Vu, Noble and Teeb categories, reach their current pages. Legacy numeric pagination reaches the consolidated destination.
- Home, contact, privacy, shipping/returns and Buy 5 Get 1 Free page aliases reach their equivalent pages.
- Query parameters, including genuine Meta ad click IDs, survive redirects. Next.js uses HTTP 308 for permanent redirects; its normal trailing-slash normalization remains enabled.

All 95 published archived products were compared with their current mappings; 94 have active destinations. The unmatched `demo-2` product and the `auto-draft-crystal` variation have no mapped active product. Unavailable products continue to return a final 404; they are not sent to an unrelated page.

The archived WordPress posts contain no published blog articles. The current blog URLs need no migration redirects from that archive.

The legacy taxonomy contains branches without an active equivalent. `/sale` and the originals' `pour-homme`, `pour-femme` and `tar` category pages currently return 404; they must not be used as redirect destinations. Other archived brand/attribute branches, `/shop`, `/my-account` and `/evercompare` need a verified equivalent or a restored destination before adding redirects. The existing active offer page `/sale/buy-5-get-1-free` was independently checked to return 200. Unmapped removed content retains a true 404.

## Meta matching

Production's Meta Pixel and Conversions API are enabled, test mode is off, and the worker heartbeat is healthy. All retained live server events from the preceding seven days had status `SENT` at inspection.

| Event | Accepted events | Email included | Phone included | Country included | Ad click ID included |
| --- | ---: | ---: | ---: | ---: | ---: |
| InitiateCheckout | 131 | 29 | 24 | 29 | 69 |
| AddPaymentInfo | 35 | 35 | 35 | 35 | 19 |
| Purchase | 33 | 33 | 33 | 33 | 19 |

These are server delivery and field-presence counts, not Meta's match-quality score, ad attribution, browser delivery or independently verified deduplication results. Customer details often become available after InitiateCheckout fires. An absent ad click ID is expected when there is no available genuine Meta click identifier.

Known checkout form details now flush before InitiateCheckout rather than waiting for the typing debounce. Explicit wallet matching takes precedence. Existing consent, normalization, hashing, event IDs, event timing and purchase eligibility rules remain in place; no checkout events are replayed to increase coverage. The admin coverage table now separates InitiateCheckout, AddPaymentInfo and Purchase.

The non-browser Meta integration checks verify matching, consent withdrawal, stable browser/server purchase IDs, retries and duplicate prevention against an isolated local database with mocked Meta responses. Meta Events Manager remains the source for actual browser/server merging and match-quality changes after deployment and fresh traffic.
