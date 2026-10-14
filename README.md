# N7 Cosmetics

Next.js 16 storefront, admin panel, commerce APIs, and MariaDB database. Production runs at **https://n7cosmetics.co.uk** on the `n7-vps` SSH host.

## Development

Use Node.js 24 and the pinned pnpm version in `package.json`.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Copy `.env.example` to `.env.local` and configure an application encryption key and `MEDIA_STORAGE_DIR=media`. Run `pnpm db:local:setup` to start the dedicated Docker MariaDB 11.4 database on `127.0.0.1:13308` and import `n7cosmetics.sql` into an empty database. Existing data is never replaced. The setup generates local database passwords, updates `.env.local`, and keeps a private backup under `reports/`. Run `pnpm db:migrate` after setup. Use `pnpm db:local:up` / `pnpm db:local:stop` subsequently; do not remove the Docker volume.

The development server uses port 3003. `.env.local` takes precedence over `.env`; never commit either real environment file. Keep `pnpm payments:worker` running alongside development to reconcile expired card checkouts.

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build:deploy
```

ESLint is pinned to 9.39.4 because ESLint 10 fails with the parser used by this version of `eslint-config-next`. Generated script/test output is excluded from linting.

## Storefront structured data

`lib/commerce/seo.ts` builds the six schema groups: OnlineStore, Product/Offer, BreadcrumbList, MerchantReturnPolicy, ShippingService, and product AggregateRating/Review. The homepage and shipping/returns page render a store graph; each product and bundle page renders one combined graph through the server-rendered `JsonLd` component. Breadcrumb markup and visible navigation share `lib/commerce/breadcrumbs.ts`.

Prices, inventory, formats, brands, contact details, and published reviews come from the same records used by the storefront. Empty review/rating markup and unknown brands are omitted. Bundles retain their own pack format and component-based availability. The return policy matches the displayed 30-day sealed/unused policy, with customer-paid change-of-mind postage and merchant-paid faulty-item postage.

Shipping rates and free-delivery thresholds come from active admin configuration, including the discount basis. No courier transit time is inferred from an end-to-end delivery estimate. Countrywide shipping markup is omitted for postcode-restricted coverage or mixed before/after-discount thresholds that Google cannot represent accurately; checkout remains authoritative. Keep `APP_URL=https://n7cosmetics.co.uk` in production so canonical URLs, images, and schema IDs agree.

`pnpm test:unit` includes the schema checks in `tests/seo.test.ts`. After publishing, manually validate the homepage, shipping/returns page, an available product, a sold-out product, a product without reviews, and a bundle using Google's Rich Results Test and the Schema.org Validator. Optional offer-level policy warnings can remain when policies are defined at store level.

## Production deployment

GitHub Actions validates changes to `main`, builds a Linux Docker image, publishes it to GHCR, and deploys its immutable digest through SSH. Pull requests run lint, type checking, and unit tests. No browser tests run in this workflow.

The VPS runs:

- The Next.js standalone server as a non-root container.
- MariaDB 11.4 on a private Docker network, with persistent database storage.
- Traefik 3.7 on ports 80/443, with automatic Let's Encrypt certificates and HTTP-to-HTTPS redirects.
- Private uploads in `/srv/apps/n7cosmetics/media`, mounted across application releases.

See [the VPS runbook](deploy/README.md) for paths, secrets, backups, deployment and recovery commands.

## Existing database and uploads

For this migration, **the user-supplied `n7cosmetics.sql` export is authoritative**. Import it once into the empty VPS database, transfer the entire private `media` directory, and retain the existing `APP_ENCRYPTION_KEY`. The export, uploads and secret values are excluded from Git and Docker builds. Schema migrations run before each release; seeding does not.

**Do not run `db:seed` against a database containing real data.** The current importer reads the original WordPress catalog and deletes/rebuilds catalog records. Migration must restore the SQL backup, not recreate products with this script.

`pnpm db:create-admin` is only for a new database without an administrator. The imported database retains existing accounts and passwords. Remove bootstrap administrator passwords from production configuration.

SMTP and Stripe settings are managed in the admin panel and stored in the database; secrets depend on the existing encryption key. Checkout uses Stripe cards, Apple Pay and Google Pay, UK billing/delivery addresses and GBP totals. Configure delivery methods and Stripe in admin before accepting orders. See [Stripe setup](docs/stripe.md). Older COD/bank-transfer orders retain their history.

Gmail, hosted mailbox and custom SMTP setup, notification recipient lists, email templates, the delivery queue, saved enquiries and newsletter subscriptions are described in [the email guide](docs/email.md). Run `pnpm email:worker` alongside local development for retries and low-stock alerts; production uses the `email-worker` Compose service. SMTP credentials and notification recipients are managed in admin.
