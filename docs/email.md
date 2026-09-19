# N7 email delivery

Email uses Nodemailer and SMTP credentials saved in **Admin → Settings → SMTP email delivery**. No SMTP secrets belong in `.env`. Keep the existing `APP_ENCRYPTION_KEY`: both the SMTP app password and queued message contents are encrypted with it.

## Gmail setup

1. Enable Google 2-Step Verification and create an app password for N7. See [Google's app-password instructions](https://support.google.com/accounts/answer/185833). Google Workspace policies can restrict app passwords.
2. In admin, save `smtp.gmail.com`, port `465`, implicit TLS enabled, the full Gmail/Workspace address and that app password. Use the mailbox or a verified Gmail sending alias as the sender. Spaces in Gmail app passwords are removed when saved.
3. Verify the connection, then use **Send test** to check actual delivery to the signed-in owner's mailbox. Verification does not send email or establish inbox placement.
4. Set the public contact email, the new-order notification recipient and bank-transfer instructions. The order notification recipient defaults to the public contact email.
5. Check the real sender, replies and delivery in Gmail and another mailbox. For a custom Workspace sender domain, verify the provider's SPF, DKIM and DMARC configuration. Gmail account sending limits still apply; this implementation does not send bulk campaigns.

`APP_URL` must be the public HTTPS site on production. Local reset and subscription links use the local value, so `.env.local` links may not be reachable from another device.

## Delivery and recovery

Migration `017_email_delivery.sql` adds email jobs, saved enquiries, newsletter subscribers and delivery tracking fields. Run `pnpm db:migrate`. It preserves existing orders and settings.

Messages are saved before an immediate delivery attempt. Orders and their notification jobs commit together; duplicate checkout submissions do not create another confirmation job. Status, payment, fulfilment and tracking changes produce order updates. Internal notes are never included.

Run `pnpm email:worker` beside local development for automatic retries even when there are no requests. In production the `email-worker` Compose service uses the same application image, database and encryption-key secret. The release script updates both application and worker. No web-accessible scheduler token or SMTP environment credentials are required.

The worker checks every 30 seconds. A failed message gets at most five delivery attempts, with increasing delays. Missing SMTP settings leave messages pending without consuming attempts. Claims use database compare-and-set locks; stale claims can be recovered after five minutes. SMTP acceptance followed by a process/database failure can still result in redelivery: SMTP cannot provide an exactly-once delivery guarantee. A stable Message-ID assists duplicate detection.

**Admin → Email & enquiries** provides queue state, per-attempt history, manual retry/resend, enquiries and subscribers. Managers cannot view or retry administrator reset emails. Sensitive reset/subscription payloads are removed after sending; they cannot be manually resent. Request a fresh link through the relevant flow instead. Reset links expire after 30 minutes; subscription confirmation links after 48 hours. Enquiries stay available in admin even while delivery is unavailable.

## Newsletter

The footer records consent and sends a confirmation link. Opening the link does not activate a subscription; the confirmation button must be submitted. Confirming sends a welcome email with an unsubscribe link. Unsubscribing is idempotent, changes the subscriber status and cancels queued subscription emails. Order emails remain independent. Only ACTIVE subscribers are eligible for any future campaigns; the subscriber list is not a campaign sender.

## Templates and checks

All nine message types share a table-based, responsive email layout using the storefront's ivory, dark and muted gold palette. They include plain text and escaped dynamic content, without scripts or external fonts. **Email & enquiries → Preview templates** shows sample content without sending. Actual message values come from saved orders, enquiries and settings.

Run `pnpm test:unit`, `pnpm typecheck`, and `pnpm build:deploy`. `pnpm email:verify-flow` uses an isolated temporary database and a mocked SMTP transport; it never sends email. Browser and inbox-client rendering are checked manually by the user.
