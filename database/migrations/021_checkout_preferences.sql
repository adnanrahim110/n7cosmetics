ALTER TABLE orders
  ADD COLUMN marketing_opt_out TINYINT(1) NULL,
  ADD COLUMN marketing_notice TEXT NULL,
  ADD COLUMN marketing_preference_recorded_at DATETIME(3) NULL;

-- Existing newsletter signups use explicit consent. A checkout soft opt-in
-- must remain distinguishable, and an opt-out alone has no marketing basis.
ALTER TABLE newsletter_subscribers
  ADD COLUMN marketing_basis ENUM('CONSENT','SOFT_OPT_IN') NULL DEFAULT 'CONSENT';
