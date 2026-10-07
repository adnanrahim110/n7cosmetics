ALTER TABLE meta_catalog_items
  ADD COLUMN meta_observation JSON NULL,
  ADD COLUMN meta_observed_hash CHAR(64) NULL,
  ADD COLUMN meta_checked_at DATETIME(3) NULL,
  ADD INDEX idx_meta_catalog_observation (catalog_id, status, meta_checked_at);

CREATE TABLE meta_catalog_remote_checks (
  catalog_id VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  configuration_revision CHAR(64) NULL,
  checked_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL,
  next_check_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_token CHAR(36) NULL,
  lease_expires_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
