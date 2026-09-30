# Meta integration

## Setup

1. Apply migration `028_meta_integration.sql` with `pnpm db:migrate`.
2. Open `/admin/meta` as an owner. Managers can inspect configuration and delivery records; fulfilment accounts cannot access this page.
3. A Pixel/dataset ID enables browser events independently. Add a Conversions API token for server events. An ad account ID and a separate `ads_read` token enable advertising reports on the main dashboard.
4. Tokens use the existing `APP_ENCRYPTION_KEY` AES-256-GCM encryption. Blank token inputs preserve saved tokens; removal checkboxes delete them. No token or ciphertext is passed to the browser. A failed connection check does not falsely mark configuration as verified.
5. Keep `pnpm meta:worker:deploy` running in production (after `pnpm build:deploy`). The Docker Compose deployment includes `meta-worker`. For local development use `pnpm meta:worker`. Request completion also attempts prompt delivery; the durable worker recovers missed callbacks and verifies paid orders independently of checkout requests.

The setup guide at the bottom of the page explains where to find IDs, how to generate tokens, asset permissions, Test Events, the production domain, and deduplication. Configuration is read from the database, with no redeploy required. Existing storefront tabs refresh settings on focus and every 60 seconds.

## Events and financial meaning

- `PageView`: storefront route navigation after marketing consent.
- `ViewContent`: a product or bundle page; uses its active default variant, matching N7's checkout model.
- `Search`: a completed storefront search response. Search text is deliberately omitted.
- `AddToCart`: successfully validated additions or quantity increases, not failed attempts.
- `InitiateCheckout`: entering checkout with products, or starting express checkout from the basket.
- `AddPaymentInfo`: successfully creating/reusing a Stripe checkout before payment confirmation. No card information is collected by this integration.
- `Purchase`: a verified paid Stripe order; pending, failed, cancelled and historical orders are excluded. Values are GBP paid order totals after discounts, including shipping/tax. Item values use the stored discounted line totals. Revenue is a purchase value, not profit or net-of-refund revenue.

Browser/server copies share event name and ID. Purchase IDs are `n7_purchase_<order ID>`. Catalogue content IDs are `n7_variant_<variant ID>`, including the bundle variant (not its component stock reservations). Future catalogue exports must use this same helper. A variant ID is a string, including IDs above JavaScript's safe integer limit.

Public clients cannot post `Purchase` events or supply prices. Event products/prices resolve from N7's database. Checkout credentials and Stripe secrets are stripped from receipt URLs and retained only in tab session storage for receipt refresh. If storage is blocked or the document/referrer contains sensitive query parameters, the browser Pixel is suppressed; eligible server events continue. The browser receipt event requires the same consenting browser as the original checkout.

Optional attribution writes use a database savepoint so a Meta storage/encryption failure does not undo a valid checkout. If the database itself aborts the order transaction, normal checkout rollback still applies. Failed attribution is omitted instead of reconstructing customer tracking data later.

## Consent and privacy

No Meta script, click cookie, tracking request or server event is enabled before explicit marketing consent. The footer provides a permanent preference control. Newsletter permission is separate. The server stores an opaque HttpOnly preference cookie and verifies consent again at collection, purchase processing and delivery. Withdrawal cancels pending events and removes order tracking contexts. Already transmitted/in-flight events cannot be recalled.

Only email and phone are used for hashed purchase matching; GB local phone numbers are normalised to the country calling code. IP, browser user agent, `_fbp` and `_fbc` are passed unhashed per Meta's field definitions. `_fbc` is only derived from an actual `fbclid` after consent. No notes, addresses, card data or search text are sent. Browser automatic configuration is disabled; do not enable additional automatic events/advanced matching in another Pixel installation.

Queued events and checkout attribution snapshots are encrypted. Accepted/failed/cancelled job payloads are erased. Delivery retries expire at 47 hours to stay inside the 48-hour browser/server deduplication window. Checkout attribution snapshots expire after two days. Delivery metadata expires after 30 days. The worker performs cleanup; it must remain running even when tracking is paused.

Browser purchase deduplication markers expire after 47 hours and are cleaned on the next settings refresh, or immediately when consent is withdrawn. A local opt-out takes precedence over stale server consent, including when local storage is unavailable; failed withdrawal requests are retried on subsequent settings refreshes.

## Testing and operation

`pnpm test:unit`, `pnpm meta:verify-flow` and `pnpm payments:verify-flow` are non-browser checks. The integration scripts use disposable local databases and mock outbound API calls; they do not send real events or charge cards.

For an authorised live check, save a Test Events code and select **Send server test event**. Only a synthetic `PageView` with that code is sent. Test payments are server-only and require this code; they never trigger browser Purchase events. Browser activity still uses the saved Pixel, so use a dedicated test dataset when testing the complete browser journey. Remove the code before production server reporting. Review Meta Test Events, Diagnostics, Event Match Quality, and browser/server deduplication yourself before launch.

Meta API errors are reduced to safe messages/numeric codes. Transient failures retry with exponential backoff. Invalid credentials/permissions require an owner to fix the connection. Delivery statuses indicate whether Meta accepted a request, not whether it attributed a purchase to an ad. The dashboard's Traffic and Meta ads tabs read account, daily, campaign and delivery-breakdown reports, with one-minute caching and explicit attribution. Catalogue export remains future work. See [dashboard definitions](dashboard.md).

Source references (checked 2026-09-29):
- https://developers.facebook.com/docs/marketing-api/conversions-api/best-practices/
- https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/
- https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters/
- https://developers.facebook.com/docs/marketing-api/insights/
- https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/api.js (official SDK pins Graph API v26.0)
- https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/serverside/server-event.js
- https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/serverside/user-data.js
- https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/serverside/event-request.js

Meta's documentation endpoints returned rate-limit errors during implementation; the current official SDK source was available and used to verify event fields, hashing conventions, test events, deduplication keys and API version. No live Meta credentials were supplied or tested.
