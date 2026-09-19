CREATE TABLE stripe_checkouts (
  order_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  request_hash CHAR(64) NOT NULL,
  stripe_mode ENUM('test', 'live') NOT NULL,
  intent_id VARCHAR(190) NULL,
  expires_at DATETIME(3) NOT NULL,
  inventory_state ENUM('RESERVED', 'COMMITTED', 'RELEASED') NOT NULL DEFAULT 'RESERVED',
  UNIQUE KEY uq_stripe_intent (intent_id),
  KEY idx_stripe_expiry (inventory_state, expires_at),
  CONSTRAINT fk_stripe_checkout_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE checkout_stock_reservations (
  order_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  PRIMARY KEY (order_id, variant_id),
  CONSTRAINT fk_checkout_stock_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_checkout_stock_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stripe_webhook_events (
  event_id VARCHAR(190) NOT NULL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public) VALUES
  ('stripe.enabled', 'stripe', 'false', 0),
  ('stripe.mode', 'stripe', '"test"', 0),
  ('stripe.publishable_key', 'stripe', '""', 0);
