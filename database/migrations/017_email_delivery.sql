CREATE TABLE newsletter_subscribers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  status ENUM('PENDING','ACTIVE','UNSUBSCRIBED') NOT NULL DEFAULT 'PENDING',
  confirmation_token_hash CHAR(64) NULL,
  confirmation_expires_at DATETIME(3) NULL,
  unsubscribe_token_hash CHAR(64) NULL,
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  confirmed_at DATETIME(3) NULL,
  unsubscribed_at DATETIME(3) NULL,
  consent_text VARCHAR(500) NOT NULL,
  UNIQUE KEY uq_newsletter_email (email),
  UNIQUE KEY uq_newsletter_confirmation (confirmation_token_hash),
  UNIQUE KEY uq_newsletter_unsubscribe (unsubscribe_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE newsletter_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_newsletter_attempts_ip (ip_address, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  dedupe_key VARCHAR(190) NOT NULL,
  recipient VARCHAR(190) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_key VARCHAR(100) NOT NULL,
  payload_encrypted MEDIUMTEXT NULL,
  subscriber_id BIGINT UNSIGNED NULL,
  status ENUM('PENDING','PROCESSING','SENT','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  available_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  locked_at DATETIME(3) NULL,
  lock_token CHAR(36) NULL,
  expires_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL,
  sent_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_email_jobs_dedupe (dedupe_key),
  KEY idx_email_jobs_due (status, available_at),
  KEY idx_email_jobs_subscriber (subscriber_id),
  CONSTRAINT fk_email_jobs_subscriber FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE email_logs ADD COLUMN email_job_id BIGINT UNSIGNED NULL,
  ADD KEY idx_email_logs_job (email_job_id);

CREATE TABLE contact_enquiries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(50) NULL,
  topic VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('NEW','RESOLVED') NOT NULL DEFAULT 'NEW',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_contact_enquiries_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders
  ADD COLUMN shipping_method_name VARCHAR(190) NULL,
  ADD COLUMN tracking_reference VARCHAR(190) NULL,
  ADD COLUMN tracking_url VARCHAR(1000) NULL;
