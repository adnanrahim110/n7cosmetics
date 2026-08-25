CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING', 'PUBLISHED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  rating TINYINT UNSIGNED NOT NULL,
  reviewer_name VARCHAR(120) NOT NULL,
  reviewer_email VARCHAR(190) NOT NULL,
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  recommends_product TINYINT(1) NOT NULL DEFAULT 1,
  is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) NULL,
  published_at DATETIME(3) NULL,
  submitted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_product_reviews_product_status_date (product_id, status, published_at, submitted_at),
  KEY idx_product_reviews_status_date (status, submitted_at),
  KEY idx_product_reviews_email_product (reviewer_email, product_id),
  CONSTRAINT chk_product_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_product_reviews_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_review_media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id BIGINT UNSIGNED NOT NULL,
  media_asset_id BIGINT UNSIGNED NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_review_media_asset (media_asset_id),
  KEY idx_product_review_media_review_sort (review_id, sort_order, id),
  CONSTRAINT fk_product_review_media_review
    FOREIGN KEY (review_id) REFERENCES product_reviews (id) ON DELETE CASCADE,
  CONSTRAINT fk_product_review_media_asset
    FOREIGN KEY (media_asset_id) REFERENCES media_assets (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_submission_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip_address VARCHAR(45) NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  succeeded TINYINT(1) NOT NULL DEFAULT 0,
  attempted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_review_submission_attempts_ip_time (ip_address, attempted_at),
  KEY idx_review_submission_attempts_product_time (product_id, attempted_at),
  CONSTRAINT fk_review_submission_attempts_product
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
