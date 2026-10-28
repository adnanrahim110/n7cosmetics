ALTER TABLE orders
  ADD COLUMN shipping_address_revision INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN delivery_address_confirmed_at DATETIME(3) NULL;

ALTER TABLE email_jobs
  ADD COLUMN order_id BIGINT UNSIGNED NULL,
  ADD COLUMN order_email_kind VARCHAR(30) NULL,
  ADD KEY idx_email_jobs_order (order_id, status);

-- Recover explicit order references from existing customer and team dedupe keys.
-- Preserve historical timestamps: the release verifier checks existing columns.
UPDATE email_jobs
SET order_id = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(dedupe_key, 'order:', -1), ':', 1) AS UNSIGNED),
    order_email_kind = CASE template_key
      WHEN 'order-confirmation' THEN 'confirmation'
      WHEN 'order-status-update' THEN 'update'
      WHEN 'new-order-team' THEN 'team'
      WHEN 'order-update-team' THEN 'team-update' END,
    updated_at = updated_at
WHERE dedupe_key REGEXP '^(order:[0-9]+:|notification:(new_order|order_update):order:[0-9]+:)'
  AND template_key IN ('order-confirmation', 'order-status-update', 'new-order-team', 'order-update-team');

UPDATE email_jobs resend
JOIN email_jobs original ON resend.dedupe_key LIKE CONCAT('resend:', original.id, ':%')
SET resend.order_id = original.order_id, resend.order_email_kind = original.order_email_kind,
    resend.updated_at = resend.updated_at
WHERE original.order_id IS NOT NULL AND resend.order_id IS NULL;
