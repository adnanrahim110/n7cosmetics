CREATE TABLE meta_catalog_state (
  catalog_id VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  catalog_name VARCHAR(190) NULL,
  verified_revision CHAR(64) NULL,
  last_checked_at DATETIME(3) NULL,
  last_scanned_at DATETIME(3) NULL,
  last_full_sync_at DATETIME(3) NULL,
  last_success_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL,
  force_sync TINYINT(1) NOT NULL DEFAULT 1,
  next_run_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_token CHAR(36) NULL,
  lease_expires_at DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meta_catalog_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  catalog_id VARCHAR(30) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  retailer_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_name VARCHAR(190) NOT NULL,
  operation ENUM('UPSERT','DELETE') NOT NULL,
  desired_payload JSON NOT NULL,
  desired_hash CHAR(64) NOT NULL,
  sent_hash CHAR(64) NULL,
  submitted_hash CHAR(64) NULL,
  request_handle TEXT NULL,
  status ENUM('QUEUED','PROCESSING','SUBMITTED','SYNCED','FAILED','EXCLUDED','DELETED') NOT NULL DEFAULT 'QUEUED',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  submitted_at DATETIME(3) NULL,
  synced_at DATETIME(3) NULL,
  exclusion_reason VARCHAR(500) NULL,
  last_error VARCHAR(500) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_meta_catalog_item (catalog_id, retailer_id),
  INDEX idx_meta_catalog_queue (catalog_id, status, next_attempt_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
