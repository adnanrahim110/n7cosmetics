# Historical data migration

The importer targets the local database only. It never executes SQL or PHP from the source backup, calls payment gateways, sends emails, runs old scheduled jobs or replays order stock adjustments.

## Run

```powershell
node scripts/backup-local-db.cjs reports/legacy/before-legacy-migration.sql.gz
npm run db:migrate
npm run legacy:archive -- "C:/path/to/wordpress.sql"
npm run legacy:plan -- 1
npm run legacy:apply -- 1
npm run legacy:verify -- 1
```

`archive` preserves the source SQL under ignored `reports/legacy/<sha256>/source.sql`, verifies its SHA-256, and stores every original table definition, column and row in `legacy_tables` / `legacy_records`. Rows are compressed and encrypted using `APP_ENCRYPTION_KEY`. Numeric source literals remain strings to retain precision. Keep this key with the database backups; it is required to read the archive.

`plan` writes a private, non-customer report in `reports/legacy/plan-<batch>.json`. Matching uses exact unique product slugs. Unmatched old products, draft/private products and orphan variations remain in `legacy_products` and the archive. No new storefront product is automatically created.

`apply` uses one transaction for business records, updates matched product prices/SKUs/inventory and bundle components, preserves original classifications/attributes, and imports customers, addresses, orders, line items, shipping/discount lines, charge records, refunds/items, notes, reviews, enquiries, coupon history, wishlists and saved carts. Original price/stock values without an appropriate operational representation remain in the legacy detail fields. It checks record counts, order/refund totals, and a before/after content-and-media checksum before committing. Failure rolls back business data, leaving the verified archive ready to retry. Reapplying a COMPLETE batch is a no-op.

Customer records are merged only by trimmed, lowercase email. Account and customer-lookup IDs remain traceable through `legacy_customer_links`; orders retain their original customer/address snapshots. Staff accounts remain in the archive, rather than being imported as administrator logins. Customers with missing emails are retained separately. Existing live profiles are linked without overwriting their contact details. Future checkout orders link to the customer profile and retain LIVE origin.

WooCommerce completed orders are COMPLETED (not asserted to have been delivered). Original statuses, timestamps and metadata are also preserved. Partial refunds retain their own amounts, dates, reasons, line quantities and references. Legacy payments are historical records, with no live Stripe checkout or inventory reservation. Historical order emails are blocked centrally in `enqueueOrderEmails`.

The GBP shipping configuration is initialized from this backup's UK flat-rate/free-shipping settings: £2.99, free at £99 before discounts. Shipping management controls current checkout charges and the shipping policy. Imported coupons are preserved inactive pending manager review, including placeholders for redeemed codes whose definitions were deleted. Existing automatic promotions remain unchanged. Newsletter consent is not inferred from purchases or account creation.

`legacy:verify` is a local, non-browser check for source checksum, archived table counts/columns, unchanged product content/media, exact order totals and review text, full customer export, and real checkout shipping quotes. Run it immediately after this import; it expects the initial imported shipping configuration and unchanged catalogue content.

## Admin

The admin sidebar and header stay fixed while the main content scrolls independently. Content and sidebar scrollbars are styled with CSS only, retaining native scrolling and keyboard behavior.

- Customers: search, origin filter, paginated table, full filtered CSV export, editable contact details, order history, saved addresses/lists and original identifiers.
- Orders: historical badges/filter, original order status, payment/refund details, shipping/coupon lines and full notes.
- Payments & refunds: searchable reference ledger with origin/type filters.
- Reviews: imported labels and moderation; published reviews appear on matched product pages with ratings calculated from all published reviews.
- Shipping: active zones/methods, charges, minimums, before/after discount threshold basis and estimates.
- Saved lists: historical wishlists and carts, including anonymous and unlinked records.
- Historical data: import reconciliation, product matching, and read-only original tables/records. Full source records are owner-only because they include account/configuration data from the old site.

## Preservation / deployment

No source columns are dropped. Extra source fields remain in encrypted original rows and, for core entities, legacy detail JSON. The old SQL file and `before-legacy-migration.sql.gz` are private backups and must never go under `public/`. The application database contains the full encrypted source archive, so migrate it and retain `APP_ENCRYPTION_KEY` when deploying. Copy the private SQL backups separately if the deployment process excludes `reports/`.

For recovery, restore `before-legacy-migration.sql.gz` into a separate database first, verify it, and switch the application configuration deliberately. Do not restore over a database containing newer orders. No automatic destructive rollback command is provided.
