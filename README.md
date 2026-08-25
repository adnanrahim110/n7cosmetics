# N7 Cosmetics commerce application

One Next.js/TypeScript application provides the storefront, secure admin panel, commerce APIs, and direct MySQL access through `mysql2`. It does not use WordPress, a hosted CMS, an ORM, or an external data store.

## Requirements

- Node.js 20.12 or newer
- MySQL 8 recommended (MySQL 5.7.8+ supports the required JSON columns)
- A MySQL database and dedicated database user
- HTTPS in production

## First-time setup

1. In phpMyAdmin, create an empty database with `utf8mb4` encoding and a dedicated user with privileges only for that database. Do not use the MySQL root account in the app.
2. Copy `.env.example` to `.env` and replace every placeholder. Generate `APP_ENCRYPTION_KEY` as 32 random bytes encoded with Base64 and keep it stable: SMTP passwords encrypted with one key cannot be recovered with a different key. In production, set `APP_URL` to the HTTPS site URL, `NODE_ENV=production`, `ADMIN_COOKIE_SECURE=true`, and `MEDIA_STORAGE_DIR=../media` (or another private writable location outside the application root).
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

## Namecheap shared-hosting deployment

1. Update the real `.env` with the HTTPS deployment URL plus the MySQL database name, dedicated database user, and password created in Namecheap cPanel. Keep `NODE_ENV=production`, `ADMIN_COOKIE_SECURE=true`, and `MEDIA_STORAGE_DIR=../media`. Keep the existing `APP_ENCRYPTION_KEY` stable.
2. On the local Windows machine, create the optimized build and deployment archive:

```bash
npm run deploy:package
```

This creates `n7cosmetics-namecheap.zip`. The archive includes `.env`, `.next`, `server.js`, the public assets, and the precompiled database utilities. It deliberately excludes `node_modules`, `.git`, `.next/cache`, and `.next/dev`; dependencies must be installed on the Linux host.

3. Upload and extract the ZIP into a private application folder outside `public_html`. The files must be directly inside the configured application root, not inside an extra nested folder.
4. In **cPanel → Setup Node.js App**, use:

   - Node.js version: `24.x`
   - Application mode: `Production`
   - Application root: the folder containing `server.js`
   - Application URL: the same HTTPS URL configured as `APP_URL`
   - Application startup file: `server.js`

5. Stop the app, choose **Run NPM Install**, and then enter the application's virtual environment from cPanel Terminal. Initialize the database once:

```bash
npm run db:migrate:deploy
npm run db:seed:deploy
npm run db:create-admin:deploy
```

Remove `ADMIN_PASSWORD` from `.env` after the owner account is created. Finally, start or restart the Node.js app.

The hosting account must allow the Node process to create and write to the `media` directory one level above the application root. That directory must remain private; the application serves files through signed `/media/{token}` routes. Back up both MySQL and the private media directory, protect `.env`, and never commit it.

## Checkout status

Checkout currently supports cash on delivery and bank transfer. Orders, inventory deductions, coupons, delivery pricing, audit history, rate limiting, and idempotency are implemented. An online card gateway still requires provider credentials plus provider-specific payment creation and signed webhook handling before card payments can be enabled.
