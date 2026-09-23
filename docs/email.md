# N7 email delivery

Email uses Nodemailer and SMTP credentials saved in **Admin → Settings → SMTP email delivery**. No SMTP secrets belong in `.env`. Keep the existing `APP_ENCRYPTION_KEY`: both the SMTP password and queued message contents are encrypted with it.

## SMTP setup

1. An owner chooses **Gmail / Google Workspace**, **Hosted mailbox / Webmail**, or **Custom SMTP**. The provider choice supplies help and defaults; all connections use the same SMTP service with editable settings.
2. Enter the provider's outgoing SMTP hostname, port, encryption mode, username and password. Use **SSL/TLS** for port 465 or **STARTTLS** for port 587. Other SMTP ports are supported. Encryption and certificate validation remain required. Use the hostname rather than a webmail URL or control-panel address.
3. Gmail users need a full mailbox address and an app password: see [Google's app-password instructions](https://support.google.com/accounts/answer/185833). Spaces are removed only for `smtp.gmail.com`; passwords for other servers are preserved exactly. Hosted mailbox users enter their mailbox's SMTP password, not the hosting control-panel password. Use your provider's settings rather than guessing its hostname.
4. Enter a sender address authorised by that SMTP account. **Save and verify SMTP** tests the connection and credentials before replacing the active settings. A failed check keeps the existing connection. A blank password retains the saved secret only if the server and username are unchanged. Changes from another admin session during verification are rejected.
5. Use **Send delivery test** with a chosen recipient to check sender acceptance and actual inbox delivery. Connection verification alone does not check sender authorisation or inbox placement. Delivery errors appear in **Email & enquiries → Attempt history**.
6. Configure SPF, DKIM and DMARC for a custom sender domain using your provider's instructions. Provider sending limits still apply. This implementation supports SMTP username/password authentication (including app passwords or provider-issued SMTP credentials); OAuth-only accounts and API-only services require an additional integration.

Existing Gmail/custom SMTP settings remain compatible. New settings use the existing `site_settings` table; no additional database migration is needed for provider choices or notification routing. Saving a new connection also wakes the delivery queue.

## Store notification recipients

Owners and managers configure **Admin → Settings → Store notification recipients**. SMTP credentials remain owner-only.

- Add up to 10 addresses to the default store list and to each custom list. Addresses are validated, trimmed, lowercased and deduplicated. Every enabled notification needs at least one effective recipient.
- Each category has an on/off switch and can use the default list or its own addresses: **New orders**, **Order updates**, **Customer enquiries**, **Payment failures**, and **Low stock**.
- New-order alerts follow confirmed payment. Order-update alerts follow administrator changes to status, payment, fulfilment or tracking. Failed-payment alerts are sent at most once per checkout, including when Stripe repeats a webhook or the payment worker reconciles it.
- The email worker checks active, tracked inventory every 30 seconds. Low-stock alerts are queued once per low-stock period, then re-armed when a later scan observes stock above the threshold. Available stock includes pending checkout reservations. Changing low-stock recipients re-arms current alerts. The durable scan state and notification jobs commit together, preventing duplicates across workers.
- Existing new-order recipients and the contact-form inbox carry over on first use. Order-update, payment-failure and low-stock alerts start disabled. After saving routing, changing the public contact email does not silently change notification recipients.
- Each recipient gets an individual encrypted job and delivery history. A failure for one address does not stop the other recipients. Before attempting delivery, the queue cancels internal alerts for a disabled category or a removed recipient. Messages already in flight may finish. Adding recipients affects new events, not previously queued events.
- **Send group test** queues a test for the selected category's saved recipients. Save edited lists first. Use delivery history to review each result.

**Sender email** identifies the SMTP-authorised sender. **Customer reply-to email** is independent and falls back to the public contact email when blank. Team order/enquiry/payment alerts use the customer's address for replies. The public contact email remains the address displayed by the storefront and in email footers. Notification routing does not redirect or disable customer confirmations, enquiry receipts, subscriptions or administrator password resets.

`APP_URL` must be the public HTTPS site on production. Local reset and subscription links use the local value, so `.env.local` links may not be reachable from another device.

## Delivery and recovery

Migration `017_email_delivery.sql` adds email jobs, saved enquiries, newsletter subscribers and delivery tracking fields. Run `pnpm db:migrate`. It preserves existing orders and settings.

Messages are saved before an immediate delivery attempt. Successful payment and its notification jobs commit together; duplicate checkout submissions do not create another confirmation job. Administrator status, payment, fulfilment and tracking changes produce order updates. Internal notes are never included.

### Royal Mail dispatch

Click an order's status badge in the orders table or order details to choose a status. Choosing **Shipped** opens the Royal Mail form; cancelling leaves the order unchanged. The separate **Royal Mail tracking** block on order details uses the same two required fields: **Postage service** and **Tracking number**. Saving either form automatically marks the order **Shipped** and **Fulfilled**, preserving its payment details and checkout delivery method.

Migration `026_order_postage_service.sql` adds the postage-service field. Run `pnpm db:migrate` before deploying the updated order pages. The tracking number and Royal Mail tracking-page URL use the existing tracking columns. The URL is assigned automatically; administrators do not enter it or re-enter the destination address.

The dispatch email contains the saved shipping destination, postage service, tracking number and a **Track on Royal Mail** link. Tracking corrections send an updated notification; saving identical details does not queue another email. Order changes, history, audit records and email jobs commit together. Historical/imported orders continue to suppress emails, and existing payment/administrator permissions still apply.

`pnpm orders:verify-flow` checks validation, automatic shipping, duplicate/concurrent saves, email content, permissions, tracking corrections and rollback using a temporary local database. It never sends email.

Run `pnpm email:worker` beside local development for automatic retries even when there are no requests. In production the `email-worker` Compose service uses the same application image, database and encryption-key secret. The release script updates both application and worker. No web-accessible scheduler token or SMTP environment credentials are required.

The worker checks every 30 seconds. A failed message gets at most five delivery attempts, with increasing delays. Missing SMTP settings leave messages pending without consuming attempts. Claims use database compare-and-set locks; stale claims can be recovered after five minutes. SMTP acceptance followed by a process/database failure can still result in redelivery: SMTP cannot provide an exactly-once delivery guarantee. The Message-ID uses the job ID and application hostname so changing SMTP provider or sender does not change it during retries. Each queue batch uses one SMTP settings snapshot. Message content and reply addresses are captured when queued.

**Admin → Email & enquiries** provides queue state, per-attempt history, manual retry/resend, enquiries and subscribers. Managers cannot view or retry administrator reset emails. Sensitive reset/subscription payloads are removed after sending; they cannot be manually resent. Request a fresh link through the relevant flow instead. Reset links expire after 30 minutes; subscription confirmation links after 48 hours. Enquiries stay available in admin even while delivery is unavailable.

## Newsletter

The footer records consent and sends a confirmation link. Opening the link does not activate a subscription; the confirmation button must be submitted. Confirming sends a welcome email with an unsubscribe link. Unsubscribing is idempotent, changes the subscriber status and cancels queued subscription emails. Order emails remain independent. Only ACTIVE subscribers are eligible for any future campaigns; the subscriber list is not a campaign sender.

## Templates and checks

All thirteen template previews share a table-based, responsive email layout using the storefront's ivory, dark and muted gold palette. They include plain text and escaped dynamic content, without scripts or external fonts. **Email & enquiries → Preview templates** shows sample content without sending, including internal order updates, failed payments, low stock and checkout subscriptions. Actual message values come from saved orders, enquiries, inventory and settings.

Owners and managers can edit **Plain-text version & wording** beneath each preview. Changes to titles, messages, labels and button text update both the plain-text and styled versions. Locked slots retain customer names, order references, prices, expiry periods and other live values; product rows, customer messages, addresses and link destinations are generated from their original records. The editor saves only the text around these details, and the server rejects unknown fields or altered slot counts. Subject lines remain automatic. Use the sample-order selector to preview different statuses and payment methods.

Save wording before switching templates. **Restore defaults** loads the original wording into the editor; select **Save wording** to apply it. Saves are audited and detect conflicting edits from another session. Overrides are stored privately in `site_settings` under `email.copy.*`; no migration is needed. Changes affect newly generated emails; already queued messages retain their saved content. Neither previewing nor saving sends email.

Email headers have two full-height panels: the left 30% uses the storefront's primary colour (`#c98a39`) with the white N7 logo centred, and the right uses a black background with a white title and description. The body starts with the message details; there is no eyebrow or repeated introduction. Order selections show the thumbnail saved with each order item beside its name; missing or invalid image URLs leave the product text intact. Logo and thumbnail URLs are absolute URLs based on `APP_URL` (existing external image URLs are retained). Public media images allow cross-origin embedding for email clients and previews. Delivery and destination addresses use comma-separated text.

New checkout references use `N7-1001`, `N7-1002`, and so on. Migration `027_sequential_order_numbers.sql` creates a transaction-safe counter starting at 1001, or above any existing references in that format. Existing order numbers stay unchanged. Checkout retries reuse the original number, and rolled-back checkouts do not consume one; an order that was created and later cancelled keeps its number.

Run `pnpm test:unit`, `pnpm typecheck`, `pnpm lint`, and `pnpm build:deploy`. `pnpm email:verify-flow` uses an isolated temporary database and a mocked SMTP transport; it never sends email. It covers provider replacement, verification failure, exact password preservation, concurrent configuration changes, recipient routing, individual retries, disabled alerts, payment failures and low-stock re-arming. Browser and inbox-client rendering are checked manually by the user.
