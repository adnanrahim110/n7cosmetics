# Google Customer Reviews

Both Google integrations are configured under **Admin → Google → Google Customer Reviews**. Migration `042_google_customer_reviews.sql` adds a private settings row for Merchant ID `5876486574`, supplied in the owner's setup screenshots, and enables both features. Existing customized settings are preserved. The Merchant ID, feature switches, widget country/position/spacing and fallback delivery duration remain editable without rebuilding the app.

## Survey invitation

The successful order confirmation page requests `/api/google/customer-reviews` with the existing guest receipt credential in a same-origin POST body. The endpoint reads the order from the database and returns only its reference, email, delivery country, estimated arrival date, Merchant ID and Google's centered-dialog option.

Only paid, committed, live Stripe orders from the last two days are eligible. Pending, failed, test, imported, refunded, cancelled and released orders are excluded. Wallet orders wait for delivery-address confirmation. This feature is independent of newsletter preferences and Meta/TikTok advertising consent: Google presents its own review-survey choice to eligible buyers.

The arrival estimate uses the paid timestamp in the dispatch schedule's time zone, the order's shipping-method snapshot maximum, the dispatch cutoff, working weekdays and configured closures. If the shipping snapshot has no valid maximum, the editable fallback applies (initially five working days after dispatch). Arrival dates do not advance just because a receipt is refreshed. Update the dispatch schedule under **Admin → Settings → Dispatch working hours**, including bank holidays, and set delivery estimates under **Admin → Shipping**.

Receipt and Stripe query credentials are removed before the survey script loads, including when session storage is unavailable. The existing payment-status endpoint does not acquire any customer-email fields. No card details, street addresses, phone numbers or receipt credentials are sent in the Google survey payload. Product GTINs are optional and are omitted. A display marker prevents duplicate prompts in the same tab; email/payload data is never written to browser storage. Google controls the invitation, consent UI, survey delivery and rating eligibility.

The invitation waits while cookie preferences or another dialog is visible. A loading failure leaves the paid receipt usable and provides a retry action.

## Store widget

The official `merchantwidget.js` script loads with Next.js's `lazyOnload` strategy on browsing pages of the configured public HTTPS storefront. It uses the saved Merchant ID, country, side and spacing. Google provides live store-quality/rating content; the application never supplies a made-up rating.

Checkout, confirmations, cart, admin, API and newsletter action routes are excluded. The widget is hidden and made inert during shopping dialogs, cookie preferences, cart overlays and the mobile quick-purchase bar. Google's SDK currently exposes `start()` without a public destroy method, so the integration retains its single wrapper and hides it across client-side navigation, avoiding duplicate initialization. Google manages the widget's internal layout and responsive panel.

## Deployment and verification

The normal release migration step applies 042; release-integrity verification permits only this exact new private settings default and protects existing values. No Google credentials or tokens are required. The storefront `APP_URL` must be the verified public HTTPS domain. Local HTTP and test payments do not send production review invitations.

Automated non-browser checks:

```sh
pnpm test:unit
pnpm google:verify-reviews
pnpm release:verify-flow
pnpm lint
pnpm typecheck
pnpm build:deploy
```

The integration suite creates and deletes its own isolated local MariaDB database and prohibits Google/Stripe calls. CI includes it in release checks. The Google settings and privacy information are included in the application; no production settings or customer records are changed by the test suite.

After deployment, manually verify Google's opt-in on a genuine paid order, decline/accept handling, the displayed delivery estimate, repeat refresh, wallet-address confirmation, and widget placement on desktop/mobile and after navigating into checkout. The user handles browser testing. Google's account agreement, domain eligibility and actual displayed ratings are managed in Merchant Center.

Official references: [survey integration](https://support.google.com/merchants/answer/14629205?hl=en), [store widget integration](https://support.google.com/merchants/answer/14632921?hl=en), [survey data sharing and opt-in](https://support.google.com/merchants/answer/14629305?hl=en).
