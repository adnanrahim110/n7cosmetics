ALTER TABLE stripe_checkouts
  ADD COLUMN reconcile_after DATETIME(3) NULL,
  ADD KEY idx_stripe_reconciliation (inventory_state, reconcile_after);
