# N7 Cosmetics

Next.js 16 storefront, admin panel, commerce APIs, and MariaDB database. Production runs at **https://n7.eluvaire.com** on the `n7-vps` SSH host.

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
