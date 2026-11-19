# Google Product Ratings XML feed

Public endpoint after deployment: `https://n7cosmetics.co.uk/feeds/google-product-reviews.xml`.

The Next.js route generates a complete Google Product Review Feeds v2.4 XML document from current database records on every request. It requires no login, sends `application/xml; charset=utf-8`, disables caching, and is excluded from search indexing through an HTTP header. It is independent of `/google-shopping.xml`, the Google Customer Reviews opt-in and the store widget.

## Sources and eligibility

Migration 043 adds source and incentive metadata without changing existing review contents, ratings, publication status or timestamps. It classifies:

- WordPress customer imports with an original review ID and completed import batch as `LEGACY_IMPORT`.
- Entries recorded by the existing admin creation audit as `ADMIN_ENTRY`.
- The 110 exact seed tuples from migration 024 as `CURATED_SEED`. Matching uses product, author, rating, content, original date and the seed's database signature. A missing email or localhost IP alone never identifies a seed.
- Other historical records as `UNKNOWN` until their customer source is documented.

New website submissions record `CUSTOMER_SUBMISSION`; future WordPress imports record `LEGACY_IMPORT`. New admin entries remain `ADMIN_ENTRY` until confirmed. A source label identifies the collection path; it does not establish a verified purchase or independently prove that a review is genuine. Normal publication moderation remains required.

The feed includes every published review with a recorded website, WordPress or explicitly confirmed customer source, including low ratings and old reviews. No star-rating threshold or recent-date limit is applied. Pending and rejected reviews and unconfirmed/seeded sources are excluded. Review IDs remain stable as `n7_review_<database ID>`. Dates come from `submitted_at`, not the moderation/publication timestamp. Empty reviewer names are explicitly anonymous.

Under **Admin → Reviews**, expand **Google feed** on a review to document its original customer source and any incentive. An owner or manager must provide a reference and explicitly attest to checking the original customer review. The transaction records the previous source and evidence in the admin audit log; a stale revision or failed audit rolls back the change. Do not confirm a seed or admin-created text merely to increase the export count.

Purchase verification requires both the existing stored verification flag and a matching paid product order, dated on or before the review. A stored flag alone is insufficient. Known incentives are disclosed; an unrecorded incentive status is omitted rather than invented. Email, phone, IP, receipt credentials and internal source evidence are not exported.

## Product matching and complete replacements

Products and reviews are read in one transaction snapshot. GTIN, Brand + MPN, product name and canonical product URL are reused from the existing Merchant catalogue. SKU identifiers contain its stable offer ID and the actual inventory SKU. Codes such as `253` are not silently added as SKUs; an official N7 MPN remains an MPN. Reviewed gift sets use the existing bundle identity rules and `/bundles/` landing pages.

Review URLs use the product's `#reviews` group link. This selects the existing reviews tab for standard products and reaches the reviews section for bundles.

If a genuine published review has invalid XML text/date/rating, a missing landing page or unavailable Merchant catalogue identity, the endpoint returns HTTP 503 with `Retry-After: 300`. Database failures and a zero-review feed also fail closed. These conditions never become a successful empty or partial replacement that could delete previously submitted reviews. **Admin → Google → Product Ratings XML feed** displays the counts, excluded source groups and records needing attention. Fix the source/product data to recover automatically on the next fetch.

## Local audit on 20 November 2026

The local database contained 1,196 total reviews and 1,187 published reviews. The source audit exported 1,052 WordPress customer submissions, including 14 with supporting purchase records, and held 110 curated seeds, 23 admin entries and 2 unknown-source records. No product or record validation issues were found. A before/after fingerprint over all original columns confirmed every existing review field was unchanged by migration 043. These are local audit results, not an independent authentication of each customer's submission or a production approval decision.

The actual 1,052-review XML document passed Google's official v2.4 XSD validation. The XSD orders purchase-verification and incentive elements after products; its sequence is authoritative where Google's sample-page ordering differs.

## Checks and operation

```sh
pnpm db:migrate
pnpm google:verify-product-reviews
pnpm release:verify-flow
pnpm test:unit
pnpm lint
pnpm typecheck
pnpm build:deploy
```

Schema validation uses Python with `lxml==6.1.3` and the pinned, unmodified official XSD under `tests/fixtures/`. The parser disables external entity resolution, DTD loading and network access. CI installs the validation dependency and runs the isolated MariaDB integration suite. The application has no new runtime dependency.

For a read-only local source audit and an XML artifact:

```sh
pnpm exec tsc -p tsconfig.scripts.json
node .scripts-dist/scripts/audit-product-review-feed.js --origin=https://n7cosmetics.co.uk
```

This writes `reports/product-review-feed/audit.json` and, when ready, `google-product-reviews.xml` in that directory. The explicit origin changes only that audit process; stored application settings remain untouched. Generated reports are excluded from Git. A failed audit removes the prior generated XML artifact so it cannot be mistaken for a current valid result.

After deployment, add the review data source under **Merchant Center → Reviews → Join Product Reviews / Product Ratings**, then arrange regular full-feed fetches, at least monthly. Google's minimum is 50 eligible reviews across products. Approval, product matching and displayed stars are controlled by Google. This change does not submit the feed to Merchant Center or deploy the application. Browser testing is left to the user.

Official references: [XML schema](https://developers.google.com/product-review-feeds/schema), [Product Ratings policies](https://support.google.com/merchants/answer/6098512?hl=en), [eligibility](https://support.google.com/merchants/answer/14549080).
