# Google Merchant product catalogue

Apply migrations `036_google_merchant_catalog.sql` and `037_google_merchant_mpn_source.sql` with the normal migration process before running this release. They add per-variant Google metadata and the dynamic MPN source without modifying product prices, inventory or other providers' settings. They do not invent identifiers or assert that products have none.

Migration `038_google_merchant_reviewed_catalog.sql` records the owner's 2026-10-20 confirmation that the 28 reviewed standard products outside Recreations and the six complete curated sets have no assigned GTINs/MPNs. Each set was individually checked: three distinct 100 ml perfumes, no designated main product or accessory. The migration matches exact product IDs/slugs and exact bundle recipes, preserves existing admin choices, and writes an audit record. It does not apply the confirmation to future or replacement products.

## Catalogue source and freshness

`GET /google-shopping.xml` returns uncached Google RSS 2.0 XML from the current database. `APP_URL` must be the public HTTPS origin, for example `https://n7cosmetics.co.uk`, without credentials, path or query parameters. No Google API credentials, additional worker or generated file is required.

Google and Meta share `lib/commerce/catalog-export.ts`. Products, ordered images and storefront stock are read in one transaction snapshot. Only published products with an active default variant are exported, matching what the current storefront sells. Additional database variants are not automatically purchasable. Ambiguous products with multiple active default variants fail the scan.

IDs are `n7_variant_<variant ID>` and preserve large IDs. They remain stable across edits. Prices are actual GBP unit prices, not compare-at prices, coupon discounts or allocated buy-X-get-Y prices. Published sold-out items remain with `out_of_stock`. Bundle capacity and reserved stock reuse storefront inventory calculations. Archiving, unpublishing, disabling, deleting or explicitly excluding a product removes it from the next generated feed.

The feed is current when requested; Google applies changes after its next fetch and processing. Scheduled fetching does not provide immediate Google stock updates. If frequent pushes or in-app Google approval reporting become necessary, use the current Merchant API with an authorized account connection.

Database failures, missing migrations, invalid origins and ambiguous catalogues return HTTP 503 with a retry interval, never a successful empty replacement. Invalid individual products are omitted with reasons visible in admin. If every included product is invalid, the feed also returns 503 instead of an empty replacement. A genuinely empty store or a catalogue with every product explicitly excluded returns valid empty XML; intentionally excluding all products removes them from this source on the next successful fetch.

## Admin and product data

**Admin → Google Merchant** shows the URL, readiness, warnings and searchable/paginated published products. Owners and managers can view and edit. Fulfillment accounts cannot access the pages or save action. Product/bundle edit pages link to their Google details. Saves validate on the server, use a transaction and audit record, and reject stale concurrent edits.

- Supply real manufacturer GTINs/MPNs. GTIN checks cover standard lengths, check digits, leading zeros and restricted/coupon ranges. Internal SKUs never become manufacturer identifiers. Validation cannot establish that a barcode belongs to the product; confirm its assignment with the manufacturer.
- The owner confirmed on 2026-10-20 that N7 recreation product codes are official manufacturer part numbers. Products in the `recreations` collection therefore default to using their existing `product_code` as the MPN. This is a dynamic source: changing the product code updates both feed and structured data, without storing a stale copy. Codes are never treated as GTINs, and products outside this collection do not inherit this rule. A manual manufacturer MPN can override the source in admin. A recreation with an official code cannot be marked as having no assigned identifiers.
- If neither identifier was assigned, explicitly select that confirmation and leave GTIN/MPN blank. Missing fields never silently become `identifier_exists=no`. MPN-only offers show a reminder to supply an assigned GTIN too.
- Brand, name, description, images, price and links come from current product data. Missing required content blocks export. Text is normalized and bounded; XML is escaped. The real product brand is used, never an inspiration brand.
- The primary storefront image remains the main image; up to ten unique additional HTTPS images follow it. Readiness checks URLs and data, not remote image downloads, dimensions, visual compliance or Google approval. Inspect those results in Merchant Center.
- Google category ID is optional. Leave blank for automatic classification or supply a verified numeric taxonomy ID. Validation checks its format, not taxonomy membership.
- Visible unambiguous labels such as `100 ml` and `0.5 L` produce millilitre unit-pricing measurements with a `100 ml` base. Arbitrary labels and sets are not given invented volumes or apparel sizes.
- Product JSON-LD includes the same validated manufacturer identifiers and main-product identity rules, alongside existing matching price/stock information.

## Bundle classification

Each bundle requires explicit review:

- **Gift set with no main product:** uses its own identifiers or an explicitly confirmed absence. Does not copy a component barcode or claim Google's main-product bundle flag.
- **Main product with complementary products:** select an actual active component. Emits `is_bundle=yes` and uses that component's brand and identifiers. Title, description, image, total price and availability describe the entire bundle.
- **Multipack:** requires at least two units of one identical component. Emits `multipack` with the quantity and uses that component's identifiers. The existing bundle editor selects distinct products; this classification is only for records that genuinely represent identical multipacks.
- **Manufacturer-packaged set:** uses the manufacturer's identifiers for the entire package without a retailer-defined bundle flag.

Component identifier changes flow through dynamically. Editing a bundle's component selection or quantities in admin resets its Google classification for review; changing the order alone does not. Review form revisions also include the current component recipe and identity, so a stale unreviewed form cannot approve changed contents. Missing component images required by the storefront block a bundle offer. Inactive/unavailable components participate in the existing stock calculations; a reviewed main-product bundle or multipack retains the component's identity and stays exported as out of stock when that component is inactive.

## Merchant Center setup after deployment

1. Verify and claim the live domain. Configure the actual selling country/language, shipping, returns and other account requirements. Use GBP to match checkout; changing the admin currency label alone does not convert storefront pricing.
2. Review identifiers and bundle classifications at `/admin/google`. Local readiness does not mean Google has fetched or approved a product.
3. Add a file product source using `https://YOUR-VERIFIED-DOMAIN/google-shopping.xml` and enable scheduled fetching. Google normally retrieves URL-hosted sources every 24 hours.
4. Trigger the first fetch. Review processing, item counts, image downloads and Google diagnostics; compare product pages, checkout, prices and stock.
5. Review existing source IDs before retiring old sources. The website cannot discover or migrate old Merchant Center IDs without account access. Retire superseded sources/items only after confirming the replacement; preserve unrelated sources.

## Verification

`pnpm test:unit` covers Google identifiers, XML, URLs, pricing, images, bundles, unit measurements and failed responses. `pnpm google:verify-catalog` creates a disposable local database, applies migrations, checks real catalogue edits/stock/archives/deletion/structured identifiers and compares the shared Meta source. It damages only its disposable schema to verify failure handling, then removes the database. It sends no Google requests. CI includes this command in release checks.

Run `pnpm lint`, `pnpm typecheck` and `pnpm build:deploy` before release. Agent-driven browser testing requires a separate explicit request.

Official references checked during implementation:

- [Product data specification](https://support.google.com/merchants/answer/7052112?hl=en)
- [File sources](https://support.google.com/merchants/answer/12158380?hl=en)
- [Identifier exists](https://support.google.com/merchants/answer/6324478?hl=en)
- [GTIN](https://support.google.com/merchants/answer/6324461?hl=en)
- [MPN](https://support.google.com/merchants/answer/6324482?hl=en)
- [Bundle](https://support.google.com/merchants/answer/6324449?hl=en)
- [Multipack](https://support.google.com/merchants/answer/6324488?hl=en)
- [Merchant API frequent updates](https://developers.google.com/merchant/api/guides/products/frequent-updates)
