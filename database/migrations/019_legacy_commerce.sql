CREATE TABLE IF NOT EXISTS legacy_imports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  source_name VARCHAR(255) NOT NULL,
  source_sha256 CHAR(64) NOT NULL,
  source_bytes BIGINT UNSIGNED NOT NULL,
  archive_path TEXT NOT NULL,
  backup_path TEXT NULL,
  status ENUM('ARCHIVING','READY','IMPORTING','COMPLETE','FAILED') NOT NULL DEFAULT 'ARCHIVING',
  report_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  UNIQUE KEY uq_legacy_checksum (source_sha256)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS legacy_tables (
  import_id BIGINT UNSIGNED NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  definition_sql LONGTEXT NOT NULL,
  columns_json JSON NOT NULL,
  row_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (import_id, table_name),
  FOREIGN KEY (import_id) REFERENCES legacy_imports(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Encrypted, compressed copies of EVERY source row. No source SQL is executed.
CREATE TABLE legacy_records (
  import_id BIGINT UNSIGNED NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  source_row_number BIGINT UNSIGNED NOT NULL,
  source_key VARCHAR(190) NOT NULL,
  payload_encrypted MEDIUMTEXT NOT NULL,
  PRIMARY KEY (import_id, table_name, source_row_number),
  KEY idx_legacy_source (import_id, table_name, source_key),
  FOREIGN KEY (import_id, table_name) REFERENCES legacy_tables(import_id, table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) COLLATE utf8mb4_bin NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(100) NULL,
  country_code CHAR(2) NULL,
  source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  import_id BIGINT UNSIGNED NULL,
  admin_notes TEXT NULL,
  registered_at DATETIME(3) NULL,
  last_active_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_customer_email (email),
  KEY idx_customers_name (full_name),
  FOREIGN KEY (import_id) REFERENCES legacy_imports(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE legacy_customer_links (
  source_table VARCHAR(100) NOT NULL,
  source_id VARCHAR(100) NOT NULL,
  customer_id BIGINT UNSIGNED NOT NULL,
  import_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (source_table, source_id),
  KEY idx_legacy_customer (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (import_id) REFERENCES legacy_imports(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_addresses (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  address_type ENUM('BILLING','SHIPPING') NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NULL,
  line_1 VARCHAR(255) NOT NULL,
  line_2 VARCHAR(255) NULL,
  city VARCHAR(255) NOT NULL,
  region VARCHAR(255) NULL,
  postal_code VARCHAR(100) NOT NULL,
  country_code CHAR(2) NULL,
  phone VARCHAR(100) NULL,
  email VARCHAR(320) NULL,
  source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  UNIQUE KEY uq_customer_address (customer_id, address_type),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE legacy_products (
  legacy_id BIGINT UNSIGNED PRIMARY KEY,
  import_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  variant_id BIGINT UNSIGNED NULL,
  name TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL,
  original_status VARCHAR(50) NOT NULL,
  match_method VARCHAR(50) NULL,
  details_json JSON NOT NULL,
  KEY idx_legacy_product_match (product_id),
  FOREIGN KEY (import_id) REFERENCES legacy_imports(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE product_variants
  ADD COLUMN legacy_attributes_json JSON NULL,
  ADD COLUMN legacy_inventory_json JSON NULL;

ALTER TABLE orders
  MODIFY status ENUM('NEW','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','COMPLETED','CANCELLED','REFUNDED','FAILED','ON_HOLD') NOT NULL DEFAULT 'NEW',
  ADD COLUMN customer_id BIGINT UNSIGNED NULL,
  ADD COLUMN source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD COLUMN import_id BIGINT UNSIGNED NULL,
  ADD COLUMN original_status VARCHAR(50) NULL,
  ADD COLUMN completed_at DATETIME(3) NULL,
  ADD COLUMN legacy_details_json JSON NULL,
  ADD UNIQUE KEY uq_order_legacy (legacy_id),
  ADD KEY idx_order_customer (customer_id, placed_at),
  ADD KEY idx_order_source (source, placed_at),
  ADD CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  ADD CONSTRAINT fk_order_import FOREIGN KEY (import_id) REFERENCES legacy_imports(id),
  MODIFY customer_email VARCHAR(320) NOT NULL,
  MODIFY customer_name VARCHAR(255) NOT NULL,
  MODIFY customer_phone VARCHAR(100) NULL;

ALTER TABLE order_addresses
  ADD COLUMN email VARCHAR(320) NULL,
  MODIFY full_name VARCHAR(255) NOT NULL,
  MODIFY company VARCHAR(255) NULL,
  MODIFY line_1 VARCHAR(255) NOT NULL,
  MODIFY line_2 VARCHAR(255) NULL,
  MODIFY city VARCHAR(255) NOT NULL,
  MODIFY region VARCHAR(255) NULL,
  MODIFY postal_code VARCHAR(100) NOT NULL,
  MODIFY phone VARCHAR(100) NULL;

ALTER TABLE order_items
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD COLUMN legacy_product_id BIGINT UNSIGNED NULL,
  ADD COLUMN legacy_variation_id BIGINT UNSIGNED NULL,
  ADD COLUMN parent_item_id BIGINT UNSIGNED NULL,
  ADD COLUMN subtotal_pence INT NOT NULL DEFAULT 0,
  ADD COLUMN tax_pence INT NOT NULL DEFAULT 0,
  ADD COLUMN legacy_details_json JSON NULL,
  ADD UNIQUE KEY uq_order_item_legacy (legacy_id),
  MODIFY product_name TEXT NOT NULL,
  MODIFY variant_title VARCHAR(255) NOT NULL;

ALTER TABLE order_status_history
  MODIFY note LONGTEXT NULL,
  ADD COLUMN source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD COLUMN is_customer_visible TINYINT(1) NOT NULL DEFAULT 0,
  ADD UNIQUE KEY uq_history_legacy (legacy_id);

ALTER TABLE payments
  ADD COLUMN source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  ADD COLUMN legacy_key VARCHAR(100) NULL,
  ADD COLUMN fee_pence INT NULL,
  ADD COLUMN net_pence INT NULL,
  ADD UNIQUE KEY uq_payment_legacy (legacy_key);

CREATE TABLE order_refunds (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  legacy_id BIGINT UNSIGNED NULL,
  source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  amount_pence INT UNSIGNED NOT NULL,
  tax_pence INT NOT NULL DEFAULT 0,
  shipping_pence INT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL,
  reason TEXT NULL,
  provider_reference VARCHAR(190) NULL,
  payment_refunded TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  details_json JSON NULL,
  UNIQUE KEY uq_refund_legacy (legacy_id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_refund_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  refund_id BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NULL,
  legacy_id BIGINT UNSIGNED NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(12,4) NOT NULL,
  amount_pence INT NOT NULL,
  tax_pence INT NOT NULL,
  details_json JSON NOT NULL,
  UNIQUE KEY uq_refund_item_legacy (legacy_id),
  FOREIGN KEY (refund_id) REFERENCES order_refunds(id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_adjustments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  legacy_id BIGINT UNSIGNED NULL,
  adjustment_type VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  amount_pence INT NOT NULL,
  tax_pence INT NOT NULL DEFAULT 0,
  details_json JSON NULL,
  UNIQUE KEY uq_adjustment_legacy (legacy_id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE product_reviews
  MODIFY product_id BIGINT UNSIGNED NULL,
  MODIFY reviewer_name VARCHAR(255) NOT NULL,
  MODIFY reviewer_email VARCHAR(320) NOT NULL,
  MODIFY body LONGTEXT NOT NULL,
  MODIFY user_agent TEXT NULL,
  ADD COLUMN source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD COLUMN legacy_product_id BIGINT UNSIGNED NULL,
  ADD COLUMN import_id BIGINT UNSIGNED NULL,
  ADD UNIQUE KEY uq_review_legacy (legacy_id);

ALTER TABLE contact_enquiries
  MODIFY name VARCHAR(255) NOT NULL,
  MODIFY email VARCHAR(320) NOT NULL,
  MODIFY message LONGTEXT NOT NULL,
  ADD COLUMN source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD COLUMN import_id BIGINT UNSIGNED NULL,
  ADD UNIQUE KEY uq_enquiry_legacy (legacy_id);

ALTER TABLE coupons
  ADD COLUMN source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LIVE',
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD UNIQUE KEY uq_coupon_legacy (legacy_id);

ALTER TABLE shipping_methods
  ADD COLUMN threshold_basis ENUM('BEFORE_DISCOUNT','AFTER_DISCOUNT') NOT NULL DEFAULT 'AFTER_DISCOUNT',
  ADD COLUMN legacy_id BIGINT UNSIGNED NULL,
  ADD UNIQUE KEY uq_shipping_legacy (legacy_id);

CREATE TABLE customer_wishlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NULL,
  legacy_key VARCHAR(100) NOT NULL,
  name TEXT NOT NULL,
  privacy VARCHAR(30) NULL,
  created_at DATETIME(3) NULL,
  details_json JSON NOT NULL,
  source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LEGACY',
  UNIQUE KEY uq_wishlist_legacy (legacy_key),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_wishlist_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  wishlist_id BIGINT UNSIGNED NULL,
  product_id BIGINT UNSIGNED NULL,
  legacy_key VARCHAR(100) NOT NULL,
  legacy_product_id BIGINT UNSIGNED NULL,
  quantity INT NOT NULL,
  created_at DATETIME(3) NULL,
  details_json JSON NOT NULL,
  UNIQUE KEY uq_wishlist_item_legacy (legacy_key),
  FOREIGN KEY (wishlist_id) REFERENCES customer_wishlists(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customer_saved_carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NULL,
  legacy_key VARCHAR(100) NOT NULL,
  source ENUM('LIVE','LEGACY') NOT NULL DEFAULT 'LEGACY',
  contents_json JSON NOT NULL,
  UNIQUE KEY uq_saved_cart_legacy (legacy_key),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing live orders also receive customer profiles; this does not change their snapshots.
INSERT INTO customers (email, full_name, phone, created_at)
SELECT LOWER(TRIM(o.customer_email)), o.customer_name, o.customer_phone,
       (SELECT MIN(first_order.placed_at) FROM orders first_order WHERE LOWER(TRIM(first_order.customer_email)) COLLATE utf8mb4_bin = LOWER(TRIM(o.customer_email)) COLLATE utf8mb4_bin)
FROM orders o WHERE TRIM(o.customer_email) <> '' AND o.id = (
  SELECT latest.id FROM orders latest WHERE LOWER(TRIM(latest.customer_email)) COLLATE utf8mb4_bin = LOWER(TRIM(o.customer_email)) COLLATE utf8mb4_bin
  ORDER BY latest.placed_at DESC, latest.id DESC LIMIT 1
);
UPDATE orders o JOIN customers c ON c.email = LOWER(TRIM(o.customer_email)) SET o.customer_id = c.id;
