# N7 VPS operations

Production: https://n7.eluvaire.com on SSH alias `n7-vps`.
Application directory: `/srv/apps/n7cosmetics`.

## Layout

| Path | Purpose |
| --- | --- |
| `docker-compose.prod.yml` | Application, MariaDB, Traefik, networks and persistent volumes |
| `app.env` | Runtime settings (DB host is supplied by Compose) |
| `stack.env` | `APP_DOMAIN` and `ACME_EMAIL` |
| `release.env` | Exact `APP_IMAGE=ghcr.io/adnanrahim110/n7cosmetics@sha256:...` |
| `release.previous.env` | Previous application image for manual rollback |
| `secrets/db_password` | Dedicated application's database password |
| `secrets/db_root_password` | MariaDB administrative password |
| `secrets/app_encryption_key` | Existing application encryption key, preserved during migration |
| `media/` | Private uploads; UID/GID 1000 must be able to read and write |
| `import/` | Private one-time SQL export and media archive |
| `backups/` | Database, media and configuration backups; never publicly served |

Secrets are mounted into containers and read by the entrypoint. Do not put secret values into workflow YAML, Docker build arguments, images or Git. The deploy SSH account has Docker access and must be treated as a privileged account.

Named Docker volumes retain MariaDB data, TLS certificate state and Next's image cache. Do not run `docker compose down --volumes` on production.

## Provisioning and first import

1. Run `deploy/provision-vps.sh` as root on the fresh Ubuntu VPS. It installs Docker from the official repository, creates the deploy account, and enables firewall access on ports 22, 80 and 443. Database and application ports are not published.
2. Install a dedicated deployment public key in `/home/deploy/.ssh/authorized_keys`; use the `restrict` key option. Keep the existing root key access for administration.
3. Copy the Compose file, deployment script and backup script into the application directory. Create `stack.env`, `release.env`, `app.env` and the three secret files. Secret/config files use mode 600 and belong to the deploy user. `release.env` can initially use `APP_IMAGE=ghcr.io/adnanrahim110/n7cosmetics:latest` while only infrastructure starts.
4. Set these runtime values in `app.env`:

```dotenv
APP_URL=https://n7.eluvaire.com
DB_NAME=n7cosmetics
DB_USER=n7cosmetics
DB_PORT=3306
DB_CONNECTION_LIMIT=10
DB_SSL=false
ADMIN_SESSION_HOURS=12
ADMIN_COOKIE_SECURE=true
```

5. Start infrastructure from the application directory:

```sh
docker compose --env-file stack.env --env-file release.env -f docker-compose.prod.yml up -d --wait database proxy
```

6. Securely upload the authoritative SQL export and local media archive into `import/`. Verify the export checksum, require an empty target schema, then import once with MariaDB's root credentials. Extract media into `media/` and set ownership to UID/GID 1000. Record the imported export SHA-256 in `.database-imported`. Never repeat the import over a running store's newer data.
7. Configure the GitHub repository secrets below and push the deployment changes to `main`.

## GitHub Actions

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS address |
| `VPS_SSH_USER` | `deploy` |
| `VPS_SSH_KEY` | Dedicated private deployment key |
| `VPS_KNOWN_HOSTS` | Pinned host-key line obtained through the already trusted SSH connection |

The workflow uses GitHub's ephemeral `GITHUB_TOKEN` for GHCR and removes the VPS registry login after deployment. No persistent registry token is required.

Every deployment checks the current main revision, verifies the image revision label, backs up existing data, runs only unapplied schema migrations, checks all registered media files, and waits for application health. When migrations are pending, the app and both workers stop before the backup; an integrity snapshot verifies the count and original values of every existing table after migration. Migration 022's conversion of shipping methods into rules is verified separately. The public `/api/health` response checks database connectivity, writable media storage and the exact deployed release.

Failed rollouts before migrations begin restore the previous application image. Once migrations begin, a failure keeps writers stopped for recovery because the previous image may be incompatible with the new schema. Inspect the failure and backup before restarting or restoring. Routine deployments never re-import the local database or replace the live store's records.

## Backups

Install `n7-backup.service` and `n7-backup.timer` into `/etc/systemd/system/` and enable the timer. It runs at approximately 03:15 UTC daily with 14-day retention. The deploy script also creates a fresh backup before every release.

Each completed backup contains `database.sql.gz`, `media.tar.gz`, `config.tar.gz` and a `complete` marker. Configuration archives include encryption keys, so keep them private. These backups are on the same VPS; copy them to a separate protected backup destination for protection against total VPS loss.

```sh
systemctl status n7-backup.timer
sudo -u deploy bash /srv/apps/n7cosmetics/backup.sh
```

To restore, stop both the application and email-worker services, back up its current state, restore the SQL dump into a clean database, restore matching media and configuration, restore the desired release image, and run the health and media checks. SQL migrations are not automatically reversed.

## Common commands

Run these on the VPS as the deploy user (or root):

```sh
cd /srv/apps/n7cosmetics
docker compose --env-file stack.env --env-file release.env -f docker-compose.prod.yml ps
docker logs --tail 100 n7-app
docker logs --tail 100 n7-email-worker
docker logs --tail 100 n7-proxy
curl --fail https://n7.eluvaire.com/api/health
docker compose --env-file stack.env --env-file release.env -f docker-compose.prod.yml run --rm --no-deps app node scripts/verify-media.cjs
```

For an application-only rollback, first confirm that any applied migrations are backward compatible, copy `release.previous.env` to `release.env`, then run Compose `up -d --no-deps --wait app email-worker`. When rolling back to an image from before email-worker support, stop the worker and start only `app`. The SQL export and private media remain unchanged by routine application releases.

## Reference setup

This follows payment-portal's GitHub Actions → GHCR → SSH → Docker deployment pattern and its use of Traefik and MariaDB. Hostinger-vps was inspected read-only. N7 has its own database, networks, uploads, keys and backups on n7-vps.

Infrastructure references: [Docker on Ubuntu](https://docs.docker.com/engine/install/ubuntu/), [Traefik Docker and ACME setup](https://doc.traefik.io/traefik/setup/docker/). Next.js configuration follows the documentation bundled with this project's installed version.

The `email-worker` service processes saved messages, retries and enabled low-stock alerts without web requests. It shares the application image, database and encryption secret. Gmail, hosted mailbox or custom SMTP credentials and notification recipient lists are configured in the admin panel; see [email setup](../docs/email.md).

The `payment-worker` service reconciles unresolved Stripe checkouts every 30 seconds, including recent payments whose customers closed the page. It releases inventory only after the reservation expires and Stripe confirms cancellation. It uses the same database/encryption secret and image. Stripe API credentials are configured in **Admin → Settings → Stripe payments**, not in environment files. Checkout verifies payments directly through Stripe; the webhook provides additional background updates and is not required to enable checkout. Configure its HTTPS URL and register the wallet domain as described in [Stripe setup](../docs/stripe.md). Migration `025_stripe_reconciliation.sql` is required by the updated application and worker and is applied by the deployment workflow. Stop both workers during database restores. Include `payment-worker` when rolling back to an image that supports Stripe; otherwise stop it.
