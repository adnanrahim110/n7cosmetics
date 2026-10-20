CREATE TABLE google_merchant_products (
  variant_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  included TINYINT(1) NOT NULL DEFAULT 1,
  gtin VARCHAR(14) CHARACTER SET ascii COLLATE ascii_bin NULL,
  mpn VARCHAR(70) NULL,
  identifier_policy ENUM('AUTO', 'NONE') NOT NULL DEFAULT 'AUTO',
  google_category_id VARCHAR(10) CHARACTER SET ascii NULL,
  bundle_kind ENUM('UNREVIEWED', 'SET', 'MAIN_PRODUCT', 'MULTIPACK', 'MANUFACTURER') NOT NULL DEFAULT 'UNREVIEWED',
  main_variant_id BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_google_merchant_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_google_merchant_main_variant FOREIGN KEY (main_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
