# N7 Cosmetics commerce application

One Next.js/TypeScript application provides the storefront, secure admin panel, commerce APIs, and direct MySQL access through `mysql2`. It does not use WordPress, a hosted CMS, an ORM, or an external data store.

## Requirements

- Node.js 20.9 or newer
- MySQL 8 recommended (MySQL 5.7.8+ supports the required JSON columns)
- A MySQL database and dedicated database user
- HTTPS in production

## First-time setup

1. In phpMyAdmin, create an empty database with `utf8mb4` encoding and a dedicated user with privileges only for that database. Do not use the MySQL root account in the app.
2. Copy `.env.example` to `.env` and replace every placeholder. Generate `APP_ENCRYPTION_KEY` as 32 random bytes encoded with Base64 and keep it stable: SMTP passwords encrypted with one key cannot be recovered with a different key. In production, set `APP_URL` to the HTTPS site URL, `NODE_ENV=production`, and `ADMIN_COOKIE_SECURE=true`.
3. Install, migrate, seed the existing storefront catalog, and create the first owner:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm db:seed
pnpm db:create-admin
```

`db:seed` is safe to rerun: it inserts missing initial catalog records without overwriting products already edited in admin. Remove `ADMIN_PASSWORD` from the hosting environment after the first administrator has been created.

4. Sign in at `/admin`, then configure at least one delivery zone and delivery method before testing checkout. Global phone, email, address, social links, announcement text, catalog, offers, coupons, orders, and home page sections are managed there.
5. As the owner, open **Settings → SMTP email delivery** and add the mail host, port, TLS mode, username, password, and sender identity. Send a test email before relying on password recovery. SMTP credentials remain in this MySQL database; the password value is encrypted at rest. Order confirmations and administrator password resets use this shared mail service.

Administrators can update their details and password from **Profile**. Password changes revoke existing admin sessions. Password-reset links are one-time, expire after 30 minutes, and are rate limited.

## Development and verification

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm audit --prod
pnpm build
```

The development server uses `http://localhost:3003`.

## Shared-hosting deployment

Upload the project, configure the values from `.env.example` in the host's Node environment (or place a protected `.env` in the application root), and run the first-time database commands above from the terminal. Use these application settings:

- Application root: the project directory
- Build command: `pnpm build`
- Start command: `pnpm start`
- Node environment: `production`
- Application URL: the HTTPS URL configured in `APP_URL`
- Writable upload directory: `UPLOAD_DIR` (defaults to `public/uploads`)
- Public upload URL prefix: `UPLOAD_PUBLIC_PATH` (defaults to `/uploads`)

Keep the Node process behind the hosting provider's HTTPS reverse proxy. Ensure the Node application user can create folders and files inside `UPLOAD_DIR`; uploaded filenames are random and file signatures are checked server-side. Back up both MySQL and the upload directory, keep `.env` outside public web access, and never commit it.

## Checkout status

Checkout currently supports cash on delivery and bank transfer. Orders, inventory deductions, coupons, delivery pricing, audit history, rate limiting, and idempotency are implemented. An online card gateway still requires provider credentials plus provider-specific payment creation and signed webhook handling before card payments can be enabled.
