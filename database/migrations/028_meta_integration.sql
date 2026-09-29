INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public)
VALUES ('meta.configuration', 'meta', '{}', 0);

CREATE TABLE meta_consents (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  granted TINYINT(1) NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  INDEX idx_meta_consent_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meta_order_contexts (
  order_id BIGINT UNSIGNED PRIMARY KEY,
  consent_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  pixel_id VARCHAR(30) NOT NULL,
  server_enabled TINYINT(1) NOT NULL DEFAULT 0,
  test_event_code VARCHAR(100) NOT NULL DEFAULT '',
  payload_encrypted MEDIUMTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_meta_order_consent (consent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meta_event_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pixel_id VARCHAR(30) NOT NULL,
  event_id VARCHAR(100) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  event_name VARCHAR(40) NOT NULL,
  consent_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  test_event_code VARCHAR(100) NOT NULL DEFAULT '',
  payload_encrypted MEDIUMTEXT NULL,
  status ENUM('PENDING','PROCESSING','SENT','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_token CHAR(36) NULL,
  last_error VARCHAR(500) NULL,
  event_time DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at DATETIME(3) NULL,
  UNIQUE KEY uq_meta_event (pixel_id, event_name, event_id),
  INDEX idx_meta_queue (status, next_attempt_at),
  INDEX idx_meta_consent (consent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE meta_rate_limits (
  bucket CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  hits INT UNSIGNED NOT NULL DEFAULT 1,
  expires_at DATETIME(3) NOT NULL,
  INDEX idx_meta_rate_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
