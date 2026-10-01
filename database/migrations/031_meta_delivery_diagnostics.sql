CREATE TABLE meta_order_diagnostics (
  order_id BIGINT UNSIGNED PRIMARY KEY,
  capture_reason VARCHAR(40) NOT NULL,
  captured_at DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  delivery_status VARCHAR(20) NULL,
  test_mode TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  last_attempt_at DATETIME(3) NULL,
  sent_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_meta_order_diagnostic FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE meta_event_jobs ADD COLUMN last_attempt_at DATETIME(3) NULL AFTER attempts;
ALTER TABLE meta_event_jobs ADD INDEX idx_meta_purchase_lookup (event_name, event_id, id);

-- Preserve observed eligibility and retained delivery proof. Never invent a reason
-- for older orders which have neither a checkout context nor a Purchase job.
INSERT IGNORE INTO meta_order_diagnostics (order_id, capture_reason, captured_at)
SELECT m.order_id, IF(m.server_enabled = 1, 'ELIGIBLE', 'SERVER_DISABLED'), m.created_at FROM meta_order_contexts m JOIN orders o ON o.id = m.order_id;

INSERT IGNORE INTO meta_order_diagnostics (order_id, capture_reason, captured_at)
SELECT o.id, 'ELIGIBLE', NULL FROM orders o JOIN meta_event_jobs j
  ON j.event_name = 'Purchase' AND j.event_id = CONCAT('n7_purchase_', o.id);

CREATE TABLE meta_worker_health (
  id TINYINT UNSIGNED PRIMARY KEY,
  checked_at DATETIME(3) NOT NULL,
  last_success_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
