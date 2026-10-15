INSERT IGNORE INTO site_settings (setting_key, setting_group, value_json, is_public)
VALUES ('tiktok.configuration', 'tiktok', '{}', 0);

ALTER TABLE meta_consents ADD COLUMN tiktok_matching_encrypted MEDIUMTEXT NULL;

CREATE TABLE tiktok_order_contexts (
  order_id BIGINT UNSIGNED PRIMARY KEY,
  consent_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  pixel_id VARCHAR(30) NOT NULL,
  server_enabled TINYINT(1) NOT NULL DEFAULT 0,
  test_event_code VARCHAR(100) NOT NULL DEFAULT '',
  payload_encrypted MEDIUMTEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_tiktok_order_consent (consent_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tiktok_order_diagnostics (
  order_id BIGINT UNSIGNED PRIMARY KEY,
  capture_reason VARCHAR(40) NOT NULL,
  delivery_status VARCHAR(20) NULL,
  test_mode TINYINT(1) NOT NULL DEFAULT 0,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  sent_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tiktok_event_jobs LIKE meta_event_jobs;
ALTER TABLE tiktok_event_jobs ADD COLUMN request_id VARCHAR(100) NULL;
